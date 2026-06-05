/**
 * pi-agent-budget — 扩展入口
 *
 * 设计文档：../design.md
 *
 * 当前实现进度：
 *   MVP Step 1 ✅（数据库层 + cost 累计）
 *   MVP Step 2 ✅（状态栏 widget + model_select 联动）
 *   MVP Step 3 ✅（/budget set + 软/硬限弹窗 + input 事件硬限拦截）
 *
 * 加载方式：
 *   pi -e ./src/index.ts
 */

import type { ExtensionAPI, ExtensionUIContext, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { BudgetDb } from "./db/client.js";
import { createTracker, lastToolName } from "./core/tracker.js";
import { getProjectId } from "./core/project.js";
import { loadConfig, saveConfig, type BudgetConfig } from "./config.js";
import { createWidgetRenderer, type WidgetState } from "./ui/widget.js";
import { checkSessionLimit } from "./core/limits.js";
import { showSoftLimitCard, showHardLimitCard, askNewBudget } from "./ui/alert-card.js";
import {
  parseSetArgs,
  parseUnsetArgs,
  applySet,
  applyUnset,
  fmtUsd,
} from "./commands/set.js";
import { renderOverview, type OverviewInput } from "./commands/overview.js";
import { parseRange, parseByDim, runReport, runBy, type ReportRange } from "./commands/report.js";

export default function (pi: ExtensionAPI) {
  // ────────────────────────────────────────────────────────────────────────
  // 共享状态
  // ────────────────────────────────────────────────────────────────────────
  let dbPromise: Promise<BudgetDb> | null = null;
  const projectIdCache = new Map<string, string>();
  let config: BudgetConfig = loadConfig();

  let currentModelDisplay = "";

  // 软限去重：每个 session 在同一阈值下只弹一次；直到用户调高预算或跨过硬限
  const softLimitAlreadyShown = new Set<string>();
  // 上次请求快照（供 /budget 总览显示）
  let lastRequestSnap: OverviewInput["lastRequest"] | undefined;

  async function getDb(): Promise<BudgetDb> {
    if (!dbPromise) {
      dbPromise = BudgetDb.open();
      dbPromise.catch(() => {
        dbPromise = null;
      });
    }
    return dbPromise;
  }

  function getProjectIdForCwd(cwd: string): string {
    const cached = projectIdCache.get(cwd);
    if (cached) return cached;
    const id = getProjectId(cwd, config.projectIdOverride);
    projectIdCache.set(cwd, id);
    return id;
  }

  function getSessionId(ctx: { sessionManager?: { getSessionFile?: () => string | undefined } }): string {
    return ctx.sessionManager?.getSessionFile?.() ?? "ephemeral";
  }

  function reloadConfig(): BudgetConfig {
    config = loadConfig();
    return config;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Widget
  // ────────────────────────────────────────────────────────────────────────
  type UiLike = { setWidget: Parameters<Parameters<typeof pi.on>[1]>[1]["ui"]["setWidget"] };
  let uiRef: UiLike | null = null;

  function refreshWidget(
    ui: UiLike,
    ctx: { model?: { name?: string; id?: string } | null },
    usedUsd: number,
  ): void {
    const modelDisplay = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay ?? "?";
    currentModelDisplay = modelDisplay;
    const state: WidgetState = {
      model: modelDisplay,
      usedUsd,
      budgetUsd: config.session?.usd ?? 0,
    };
    createWidgetRenderer({ ui }).refresh(state);
  }

  // ────────────────────────────────────────────────────────────────────────
  // 软限弹窗（在 message_end 后调用）
  // ────────────────────────────────────────────────────────────────────────
  async function maybeShowSoftLimit(
    ui: Pick<ExtensionUIContext, "select" | "input" | "notify">,
    sessionId: string,
    usedUsd: number,
  ): Promise<void> {
    const budget = config.session?.usd ?? 0;
    const status = checkSessionLimit(usedUsd, budget, config);
    if (!status || status.level === "ok") return;

    // 硬限不在软限卡里处理，让 input 事件拦截
    if (status.level === "hard") return;

    // 同一 session 同一阈值只弹一次
    const key = `${sessionId}:${status.threshold.toFixed(6)}`;
    if (softLimitAlreadyShown.has(key)) return;
    softLimitAlreadyShown.add(key);

    try {
      const action = await showSoftLimitCard(ui, status);
      if (action === "raise") {
        const newAmount = await askNewBudget(ui, budget);
        if (newAmount && newAmount > 0) {
          config = applySet({ scope: "session", amount: newAmount }, config);
          softLimitAlreadyShown.delete(key);
          ui.notify(`预算已调高到 ${fmtUsd(newAmount)}`, "info");
        }
      } else if (action === "abort") {
        ui.notify("会话已结束（用户主动终止）", "warning");
        // 不直接 shutdown，仅提示；让用户自行决定
      } else {
        ui.notify("已继续，到硬限会再次拦截", "info");
      }
    } catch (err) {
      console.warn(`[pi-budget] 软限弹窗失败: ${(err as Error).message}`);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Layer 1: Observability —— message_end → SQLite → 刷新 widget → 软限检查
  // ────────────────────────────────────────────────────────────────────────
  pi.on("message_end", async (event, ctx) => {
    if (event.message.role !== "assistant") return;

    const message = event.message as {
      model?: string;
      content?: unknown;
      usage?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
        cost?: {
          input?: number;
          output?: number;
          cacheRead?: number;
          cacheWrite?: number;
          total?: number;
        };
      };
    };

    const usage = message.usage;
    const costTotal = usage?.cost?.total;

    if (costTotal == null) {
      console.warn(
        `[pi-budget] usage.cost.total 缺失，跳过记录（model=${message.model ?? "?"}）`,
      );
      return;
    }

    try {
      const db = await getDb();
      const tracker = createTracker(db);
      const sessionId = getSessionId(ctx);
      const projectId = getProjectIdForCwd(ctx.cwd);

      tracker.record({
        sessionId,
        projectId,
        model: message.model ?? "unknown",
        inputTokens: usage?.input ?? 0,
        outputTokens: usage?.output ?? 0,
        cacheRead: usage?.cacheRead ?? 0,
        cacheWrite: usage?.cacheWrite ?? 0,
        cost: {
          input: usage?.cost?.input ?? 0,
          output: usage?.cost?.output ?? 0,
          cacheRead: usage?.cost?.cacheRead ?? 0,
          cacheWrite: usage?.cost?.cacheWrite ?? 0,
          total: costTotal,
        },
        toolName: lastToolName(message),
      });

      lastRequestSnap = {
        costUsd: costTotal,
        inputTokens: usage?.input ?? 0,
        outputTokens: usage?.output ?? 0,
      };

      const usedUsd = tracker.sessionUsd(sessionId);

      if (uiRef) refreshWidget(uiRef, ctx, usedUsd);

      // 软限检查（不阻塞主流程，独立 catch）
      if (uiRef) {
        const uiForCard: Pick<ExtensionUIContext, "select" | "input" | "notify"> = ctx.ui;
        maybeShowSoftLimit(uiForCard, sessionId, usedUsd).catch(() => {});
      }
    } catch (err) {
      console.warn(`[pi-budget] message_end 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // session_start：绑定 ui + 首次渲染
  // ────────────────────────────────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    try {
      uiRef = ctx.ui;
      reloadConfig(); // 用户可能在 session 间手编辑了配置
      const sessionId = getSessionId(ctx);

      let usedUsd = 0;
      try {
        const db = await getDb();
        usedUsd = createTracker(db).refreshSession(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedUsd);
    } catch (err) {
      console.warn(`[pi-budget] session_start 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // model_select：切模型后立刻刷新 widget
  // ────────────────────────────────────────────────────────────────────────
  pi.on("model_select", async (event, ctx) => {
    try {
      if (!uiRef) uiRef = ctx.ui;
      const sessionId = getSessionId(ctx);
      let usedUsd = 0;
      try {
        const db = await getDb();
        usedUsd = createTracker(db).sessionUsd(sessionId);
      } catch {
        // ignore
      }
      currentModelDisplay = event.model?.name ?? event.model?.id ?? currentModelDisplay;
      refreshWidget(uiRef, ctx, usedUsd);
    } catch (err) {
      console.warn(`[pi-budget] model_select 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // session_shutdown：清理 widget + db
  // ────────────────────────────────────────────────────────────────────────
  pi.on("session_shutdown", async (_event, ctx) => {
    if (uiRef ?? ctx.ui) {
      createWidgetRenderer({ ui: (uiRef ?? ctx.ui) as UiLike }).clear();
    }
    uiRef = null;
    softLimitAlreadyShown.clear();
    try {
      const db = await dbPromise;
      db?.close();
    } catch {
      // ignore
    }
    dbPromise = null;
  });

  // ────────────────────────────────────────────────────────────────────────
  // Layer 2: Control —— input 事件硬限拦截
  // ────────────────────────────────────────────────────────────────────────
  pi.on("input", async (event, ctx) => {
    // 只拦截交互式用户输入；extension / rpc / steer 不拦
    if (event.source !== "interactive") return { action: "continue" as const };

    const sessionId = getSessionId(ctx);
    const budget = config.session?.usd ?? 0;
    if (!budget || budget <= 0) return { action: "continue" as const };

    let usedUsd = 0;
    try {
      const db = await getDb();
      usedUsd = createTracker(db).sessionUsd(sessionId);
    } catch {
      // db 拿不到，宁可放行也不要错拦
      return { action: "continue" as const };
    }

    const status = checkSessionLimit(usedUsd, budget, config);
    if (!status || status.level !== "hard") return { action: "continue" as const };

    // 已硬限 → 弹窗阻塞
    try {
      const action = await showHardLimitCard(ctx.ui, status);
      if (action === "raise_and_continue") {
        const newAmount = await askNewBudget(ctx.ui, budget);
        if (newAmount && newAmount > 0) {
          config = applySet({ scope: "session", amount: newAmount }, config);
          ctx.ui.notify(`预算已调高到 ${fmtUsd(newAmount)}，本次放行`, "info");
          return { action: "continue" as const };
        }
        // 用户取消调高 → 视为拒绝
      }
      // abort 或 raise 取消：拦截消息
      ctx.ui.notify("已硬限，消息未发送（可用 /budget set 调高预算）", "warning");
      return { action: "handled" as const };
    } catch (err) {
      console.warn(`[pi-budget] 硬限弹窗失败: ${(err as Error).message}`);
      return { action: "continue" as const };
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // Commands: /budget（无参数 = 总览） / /budget set / /budget unset
  // ────────────────────────────────────────────────────────────────────────
  pi.registerCommand("budget", {
    description: "AI 成本预算管理：/budget | /budget set <amount> | /budget report [range] | /budget by <dim>",
    handler: async (args, ctx) => {
      const trimmed = (args ?? "").trim();

      // 无参数：总览
      if (trimmed === "") {
        await runOverviewCommand(ctx);
        return;
      }

      const [sub, ...rest] = trimmed.split(/\s+/);
      const restStr = rest.join(" ");

      if (sub === "set") {
        await runSetCommand(restStr, ctx);
        return;
      }
      if (sub === "unset") {
        await runUnsetCommand(restStr, ctx);
        return;
      }
      if (sub === "report") {
        await runReportCommand(restStr, ctx);
        return;
      }
      if (sub === "by") {
        await runByCommand(restStr, ctx);
        return;
      }

      const help = `未知子命令: ${sub}\n支持的子命令：set / unset / report / by`;
      ctx.ui.notify(help, "warning");
    },
  });

  async function runOverviewCommand(ctx: ExtensionCommandContext): Promise<void> {
    const sessionId = getSessionId(ctx);
    let usedUsd = 0;
    try {
      const db = await getDb();
      usedUsd = createTracker(db).sessionUsd(sessionId);
    } catch {
      // ignore
    }
    const budgetUsd = config.session?.usd;
    const status = checkSessionLimit(usedUsd, budgetUsd ?? 0, config);
    const text = renderOverview({
      sessionId,
      usedUsd,
      budgetUsd,
      model: ctx.model?.name ?? ctx.model?.id,
      lastRequest: lastRequestSnap,
      status,
    });
    ctx.ui.notify(text, "info");
  }

  async function runSetCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const parsed = parseSetArgs(args);
    if (!parsed) {
      const usage = "用法：\n  /budget set <amount>\n  /budget set project <amount>\n  /budget set global <amount>";
      ctx.ui.notify(usage, "warning");
      return;
    }
    config = applySet(parsed, config);
    // 调高预算时清掉对应的软限去重标记，避免下次到软限不弹
    const sessionId = getSessionId(ctx);
    for (const k of [...softLimitAlreadyShown]) {
      if (k.startsWith(`${sessionId}:`)) softLimitAlreadyShown.delete(k);
    }
    // 立刻刷新 widget
    if (uiRef) {
      let usedUsd = 0;
      try {
        const db = await getDb();
        usedUsd = createTracker(db).sessionUsd(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedUsd);
    }
    ctx.ui.notify(`已设置 ${parsed.scope} 预算 = ${fmtUsd(parsed.amount)}`, "info");
  }

  async function runUnsetCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const scope = parseUnsetArgs(args);
    config = applyUnset(scope, config);
    if (uiRef) {
      const sessionId = getSessionId(ctx);
      let usedUsd = 0;
      try {
        const db = await getDb();
        usedUsd = createTracker(db).sessionUsd(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedUsd);
    }
    ctx.ui.notify(`已清除 ${scope === "all" ? "全部" : scope} 预算`, "info");
  }

  async function runReportCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    let range: ReportRange;
    try {
      range = parseRange(args.trim().split(/\s+/)[0]);
    } catch (err) {
      ctx.ui.notify((err as Error).message, "warning");
      return;
    }
    try {
      const db = await getDb();
      await runReport(db, range, ctx);
    } catch (err) {
      ctx.ui.notify(`报表生成失败: ${(err as Error).message}`, "error");
    }
  }

  async function runByCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const parts = args.trim().split(/\s+/);
    const dim = parseByDim(parts[0]);
    if (!dim) {
      ctx.ui.notify(
        "用法：/budget by <model|tool|session> [today|week|month|all]\n例：/budget by tool\n     /budget by model week",
        "warning",
      );
      return;
    }
    let range: ReportRange;
    try {
      range = parseRange(parts[1]);
    } catch {
      range = "all"; // by 命令默认全量
    }
    try {
      const db = await getDb();
      await runBy(db, dim, range, ctx);
    } catch (err) {
      ctx.ui.notify(`切片生成失败: ${(err as Error).message}`, "error");
    }
  }

  // 防 TS unused
  void pi;
  void saveConfig;
}
