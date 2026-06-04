/**
 * pi-agent-budget — 扩展入口
 *
 * 设计文档：../design.md
 *
 * 当前实现进度：
 *   MVP Step 1 ✅（数据库层 + cost 累计）
 *   MVP Step 2 ✅（状态栏 widget + model_select 联动）
 *
 * 加载方式：
 *   pi -e ./src/index.ts
 *   或放到 ~/.pi/agent/extensions/pi-budget/ 自动加载
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { BudgetDb } from "./db/client.js";
import { createTracker, lastToolName } from "./core/tracker.js";
import { getProjectId } from "./core/project.js";
import { loadConfig, type BudgetConfig } from "./config.js";
import { createWidgetRenderer, type WidgetState } from "./ui/widget.js";

export default function (pi: ExtensionAPI) {
  // ────────────────────────────────────────────────────────────────────────
  // 共享状态
  // ────────────────────────────────────────────────────────────────────────
  let dbPromise: Promise<BudgetDb> | null = null;
  const projectIdCache = new Map<string, string>();
  const config: BudgetConfig = loadConfig();

  let currentModelDisplay = "";

  async function getDb(): Promise<BudgetDb> {
    if (!dbPromise) {
      dbPromise = BudgetDb.open();
      dbPromise.catch(() => {
        dbPromise = null; // 失败后允许重试
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

  // ────────────────────────────────────────────────────────────────────────
  // Widget 渲染辅助
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
  // Layer 1: Observability —— message_end → SQLite → 刷新 widget
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

    // 兜底 #3：cost 缺失（pi 未识别新模型定价）→ 记 0 + warn，不报错
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

      // 刷新 widget（uiRef 必有，session_start 必先触发）
      if (uiRef) refreshWidget(uiRef, ctx, tracker.sessionUsd(sessionId));
    } catch (err) {
      console.warn(`[pi-budget] message_end 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // session_start：绑定 ui + 首次渲染（resume 场景显示历史累计）
  // ────────────────────────────────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    try {
      uiRef = ctx.ui;
      const sessionId = getSessionId(ctx);

      let usedUsd = 0;
      try {
        const db = await getDb();
        usedUsd = createTracker(db).refreshSession(sessionId);
      } catch {
        // db 没起来也先画占位
      }
      refreshWidget(uiRef, ctx, usedUsd);
    } catch (err) {
      console.warn(`[pi-budget] session_start 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // model_select：切模型后立刻刷新 widget（兜底 #2）
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
    try {
      const db = await dbPromise;
      db?.close();
    } catch {
      // ignore
    }
    dbPromise = null;
  });

  // ────────────────────────────────────────────────────────────────────────
  // Layer 2: Control（待 Step 3）
  // ────────────────────────────────────────────────────────────────────────
  // TODO(MVP Step 3): input 事件硬限拦截 + 软限弹窗

  // ────────────────────────────────────────────────────────────────────────
  // Layer 3: Optimization（v2）
  // ────────────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────────────
  // Commands（待 Step 3-4）
  // ────────────────────────────────────────────────────────────────────────

  void pi;
}
