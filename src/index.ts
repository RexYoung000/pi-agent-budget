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

import type { ExtensionAPI, ExtensionUIContext, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { BudgetDb } from "./db/client.js";
import { createTracker, lastToolName } from "./core/tracker.js";
import { getProjectId } from "./core/project.js";
import { loadConfig, saveConfig, type BudgetConfig, DEFAULT_WIDGET_CONFIG } from "./config.js";
import { initLocale, t, setLocale } from "./i18n/index.js";
import { createWidgetRenderer, type WidgetState } from "./ui/widget.js";
import { createDashboard } from "./ui/dashboard.js";
import { checkSessionLimit, type LimitStatus } from "./core/limits.js";
import { showSoftLimitCard, showHardLimitCard, askNewBudget } from "./ui/alert-card.js";
import {
  parseSetArgs,
  parseUnsetArgs,
  applySet,
  applyUnset,
  fmtUsd,
} from "./commands/set.js";
import { renderOverview, type OverviewInput } from "./commands/overview.js";
import { parseRange, parseByDim, runReport, runBy, rangeToSince, type ReportRange } from "./commands/report.js";
import { openWidgetSettings, openFullSettings, createSettingsListForDashboard, createBudgetListForDashboard, createPricingListForDashboard } from "./commands/config.js";
import { getPricingInfo, formatMoney, usdToDisplay, formatUsdInCurrency, currencyLabel, calculateCostFromTokens, lookupModelPrice, displayToUsd } from "./core/pricing.js";
import { effectiveExchangeRate, fetchExchangeRate, shouldRefreshExchangeRate, validExchangeRate } from "./core/exchange-rate.js";
import { parseExportFormat, runExport as runExportCommand } from "./commands/export.js";

export default function (pi: ExtensionAPI) {
  // ────────────────────────────────────────────────────────────────────────
  // 共享状态
  // ────────────────────────────────────────────────────────────────────────
  let dbPromise: Promise<BudgetDb> | null = null;
  let trackerPromise: Promise<ReturnType<typeof createTracker>> | null = null;
  const projectIdCache = new Map<string, string>();
  let config: BudgetConfig = loadConfig();

  // i18n 初始化
  initLocale(config.locale);

  let currentModelDisplay = "";
  let fxController = new AbortController();
  let fxTimer: ReturnType<typeof setInterval> | undefined;
  let fxPending: Promise<void> | undefined;
  let fxRevision = 0;
  let refreshDashboard: (() => void) | undefined;

  async function updateExchangeRate(ctx: ExtensionContext, force = false): Promise<void> {
    if (config.exchangeRate?.mode === "fixed") {
      if (force) ctx.ui.notify(t("fx.fixedRefresh"), "info");
      return;
    }
    if (!force && !shouldRefreshExchangeRate(config)) return;
    if (process.env.PI_OFFLINE === "1") {
      if (force) ctx.ui.notify(t("fx.offline"), "warning");
      return;
    }
    if (fxPending) return fxPending;
    const revision = fxRevision;
    const controller = fxController;
    if (force) ctx.ui.notify(t("fx.refreshing"), "info");
    const operation = (async () => {
      const result = await fetchExchangeRate(config.exchangeRate, { signal: controller.signal });
      if (controller.signal.aborted || revision !== fxRevision || config.exchangeRate?.mode === "fixed") return;
      config = { ...config, exchangeRate: result };
      saveConfig(config);
      refreshWidgetAfterConfig(ctx);
      refreshDashboard?.();
      if (result.lastError) ctx.ui.notify(t("fx.failure"), "warning");
      else if (force) ctx.ui.notify(t("fx.updated"), "info");
    })().catch((error) => {
      if (!controller.signal.aborted) ctx.ui.notify(`${t("fx.failure")} (${String(error)})`, "warning");
    });
    fxPending = operation;
    try { await operation; }
    finally { if (fxPending === operation) fxPending = undefined; }
  }

  function replaceConfig(next: BudgetConfig, ctx: ExtensionContext): void {
    next = { ...next, exchangeRate: {
      ...config.exchangeRate,
      mode: next.exchangeRate?.mode ?? "auto",
      fixedRate: next.exchangeRate?.fixedRate ?? config.exchangeRate?.fixedRate,
    } };
    if (next.exchangeRate?.mode !== config.exchangeRate?.mode || next.exchangeRate?.fixedRate !== config.exchangeRate?.fixedRate) {
      fxRevision++;
      fxController.abort();
      fxController = new AbortController();
      fxPending = undefined;
    }
    config = next;
    saveConfig(config);
    refreshWidgetAfterConfig(ctx);
    void updateExchangeRate(ctx);
  }

  // 软限去重：每个 session 在同一阈值下只弹一次；直到用户调高预算或跨过硬限
  const softLimitAlreadyShown = new Set<string>();
  // 上次请求快照（供 /budget 总览显示）
  let lastRequestSnap: OverviewInput["lastRequest"] | undefined;

  async function getDb(): Promise<BudgetDb> {
    if (!dbPromise) {
      dbPromise = BudgetDb.open();
      dbPromise.catch(() => {
        dbPromise = null;
        trackerPromise = null;
      });
    }
    return dbPromise;
  }

  async function getTracker(): Promise<ReturnType<typeof createTracker>> {
    if (!trackerPromise) {
      trackerPromise = getDb().then((db) => createTracker(db));
    }
    return trackerPromise;
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

  /** 合并默认值，让用户不用手配所有字段。 */
  function widgetConfig(): NonNullable<BudgetConfig["widget"]> {
    return { ...DEFAULT_WIDGET_CONFIG, ...(config.widget ?? {}) };
  }

  function refreshWidget(
    ui: UiLike,
    ctx: { model?: { name?: string; id?: string } | null; getContextUsage?: () => { tokens: number | null; contextWindow: number; percent: number | null } | undefined },
    usedUsd: number,
  ): void {
    const modelDisplay = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay ?? "?";
    currentModelDisplay = modelDisplay;
    const wc = widgetConfig();
    const context = ctx.getContextUsage?.();
    const pricing = getPricingInfo(config, modelDisplay);
    const state: WidgetState = {
      model: modelDisplay,
      usedUsd: usdToDisplay(usedUsd, pricing.displayCurrency, pricing.exchangeRate),
      budgetUsd: usdToDisplay(config.session?.usd ?? 0, pricing.displayCurrency, pricing.exchangeRate),
      currencySymbol: pricing.symbol,
      context: context ? { tokens: context.tokens, contextWindow: context.contextWindow, percent: context.percent } : undefined,
    };
    createWidgetRenderer({ ui, config: wc }).refresh(state);
  }

  // ────────────────────────────────────────────────────────────────────────
  // 软限弹窗（在 message_end 后调用）
  // ────────────────────────────────────────────────────────────────────────
  async function maybeShowSoftLimit(
    ui: Pick<ExtensionUIContext, "select" | "input" | "notify">,
    sessionId: string,
    usedUsd: number,
    modelName?: string,
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

    // 按当前模型的币种换算显示金额
    const pricing = getPricingInfo(config, modelName);
    const displayStatus: LimitStatus = {
      ...status,
      current: usdToDisplay(status.current, pricing.displayCurrency, pricing.exchangeRate),
      budget: usdToDisplay(status.budget, pricing.displayCurrency, pricing.exchangeRate),
      threshold: usdToDisplay(status.threshold, pricing.displayCurrency, pricing.exchangeRate),
    };

    try {
      const action = await showSoftLimitCard(ui, displayStatus, pricing.symbol);
      if (action === "raise") {
        const displayBudget = usdToDisplay(budget, pricing.displayCurrency, pricing.exchangeRate);
        const newAmount = await askNewBudget(ui, displayBudget, pricing.symbol);
        if (newAmount && newAmount > 0) {
          // 用户在弹窗输入的是显示币种金额，转回 USD 存储
          const usdAmount = displayToUsd(newAmount, pricing.displayCurrency, pricing.exchangeRate);
          config = applySet({ scope: "session", amount: usdAmount }, config);
          softLimitAlreadyShown.delete(key);
          ui.notify(t("set.raisedTo", { amount: formatMoney(newAmount, pricing.displayCurrency) }), "info");
        }
      } else if (action === "abort") {
        ui.notify(t("set.sessionEnded"), "warning");
      } else {
        ui.notify(t("set.continued"), "info");
      }
    } catch (err) {
      console.warn(`[pi-budget] ${t("log.softLimitError")}: ${(err as Error).message}`);
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
    const providerHasCost = costTotal != null && costTotal > 0;

    // 若 provider 未返回 cost 或 cost=0，按 tokens × 内置价格表兜底计算
    const fallback = !providerHasCost
      ? calculateCostFromTokens(
          usage?.input ?? 0,
          usage?.output ?? 0,
          usage?.cacheRead ?? 0,
          usage?.cacheWrite ?? 0,
          message.model,
          effectiveExchangeRate(config),
        )
      : null;
    const actualTotal = providerHasCost ? costTotal! : (fallback?.total ?? 0);

    if (actualTotal <= 0 && (usage?.input ?? 0) + (usage?.output ?? 0) === 0) {
      console.warn(
        `[pi-budget] ${t("log.costMissing", { model: message.model ?? "?" })}`,
      );
      return;
    }

    try {
      const db = await getDb();
      const tracker = await getTracker();
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
          input: fallback?.inputCost ?? usage?.cost?.input ?? 0,
          output: fallback?.outputCost ?? usage?.cost?.output ?? 0,
          cacheRead: fallback?.cacheReadCost ?? usage?.cost?.cacheRead ?? 0,
          cacheWrite: fallback?.cacheWriteCost ?? usage?.cost?.cacheWrite ?? 0,
          total: actualTotal,
        },
        toolName: lastToolName(message),
      });

      lastRequestSnap = {
        costUsd: actualTotal,
        inputTokens: usage?.input ?? 0,
        outputTokens: usage?.output ?? 0,
      };

      // 当前模型消耗（不是全会话总计），切换模型后独立计数
      const modelName = message.model ?? currentModelDisplay;
      const usedModelUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);

      if (uiRef) refreshWidget(uiRef, ctx, usedModelUsd);

      // 软限检查（不阻塞主流程，独立 catch）
      if (uiRef) {
        const uiForCard: Pick<ExtensionUIContext, "select" | "input" | "notify"> = ctx.ui;
        maybeShowSoftLimit(uiForCard, sessionId, usedModelUsd, modelName).catch(() => {});
      }
    } catch (err) {
      console.warn(`[pi-budget] ${t("log.messageEndError")}: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // session_start：绑定 ui + 首次渲染
  // ────────────────────────────────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    try {
      uiRef = ctx.ui;
      fxController.abort();
      fxController = new AbortController();
      fxRevision++;
      fxPending = undefined;
      if (fxTimer) clearInterval(fxTimer);
      reloadConfig(); // 用户可能在 session 间手编辑了配置
      void updateExchangeRate(ctx);
      fxTimer = setInterval(() => { void updateExchangeRate(ctx); }, 60 * 60 * 1000);
      fxTimer.unref();
      const sessionId = getSessionId(ctx);

      let usedUsd = 0;
      try {
        const tracker = await getTracker();
        usedUsd = tracker.refreshSession(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedUsd);
    } catch (err) {
      console.warn(`[pi-budget] ${t("log.sessionStartError")}: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // model_select：切模型后立刻刷新 widget
  // ────────────────────────────────────────────────────────────────────────
  pi.on("model_select", async (event, ctx) => {
    try {
      if (!uiRef) uiRef = ctx.ui;
      const sessionId = getSessionId(ctx);
      const newModel = event.model?.name ?? event.model?.id ?? currentModelDisplay;
      currentModelDisplay = newModel;
      // 切换模型后，只显示新模型的消耗
      let usedModelUsd = 0;
      try {
        const tracker = await getTracker();
        usedModelUsd = tracker.sessionModelUsd(sessionId, newModel);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedModelUsd);
    } catch (err) {
      console.warn(`[pi-budget] ${t("log.modelSelectError")}: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // session_shutdown：清理 widget + db
  // ────────────────────────────────────────────────────────────────────────
  pi.on("session_shutdown", async (_event, ctx) => {
    fxController.abort();
    fxRevision++;
    fxPending = undefined;
    if (fxTimer) clearInterval(fxTimer);
    fxTimer = undefined;
    refreshDashboard = undefined;
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
    trackerPromise = null;
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

    // 按当前模型消耗做硬限检查（切换模型后独立计数）
    const modelName = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay;
    let usedUsd = 0;
    try {
      const tracker = await getTracker();
      usedUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);
    } catch {
      // db 拿不到，宁可放行也不要错拦
      return { action: "continue" as const };
    }

    const status = checkSessionLimit(usedUsd, budget, config);
    if (!status || status.level !== "hard") return { action: "continue" as const };

    // 已硬限 → 弹窗阻塞（按当前模型币种换算显示）
    try {
      const pricing = getPricingInfo(config, modelName);
      const displayStatus: LimitStatus = {
        ...status,
        current: usdToDisplay(status.current, pricing.displayCurrency, pricing.exchangeRate),
        budget: usdToDisplay(status.budget, pricing.displayCurrency, pricing.exchangeRate),
        threshold: usdToDisplay(status.threshold, pricing.displayCurrency, pricing.exchangeRate),
      };
      const action = await showHardLimitCard(ctx.ui, displayStatus, pricing.symbol);
      if (action === "raise_and_continue") {
        const displayBudget = usdToDisplay(budget, pricing.displayCurrency, pricing.exchangeRate);
        const newAmount = await askNewBudget(ctx.ui, displayBudget, pricing.symbol);
        if (newAmount && newAmount > 0) {
          // 用户在弹窗输入的是显示币种金额，转回 USD 存储
          const usdAmount = displayToUsd(newAmount, pricing.displayCurrency, pricing.exchangeRate);
          config = applySet({ scope: "session", amount: usdAmount }, config);
          ctx.ui.notify(t("set.raisedTo", { amount: formatMoney(newAmount, pricing.displayCurrency) }) + ", " + t("set.continued"), "info");
          return { action: "continue" as const };
        }
        // 用户取消调高 → 视为拒绝
      }
      // abort 或 raise 取消：拦截消息
      ctx.ui.notify(t("set.hardLimitBlocked"), "warning");
      return { action: "handled" as const };
    } catch (err) {
      console.warn(`[pi-budget] ${t("log.hardLimitError")}: ${(err as Error).message}`);
      return { action: "continue" as const };
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // Commands: /budget（无参数 = 总览） / /budget set / /budget unset
  // ────────────────────────────────────────────────────────────────────────
  pi.registerCommand("budget", {
    description: t("cmd.budget.description"),
    handler: async (args, ctx) => {
      const trimmed = (args ?? "").trim();

      // 无参数：总览
      if (trimmed === "") {
        await runOverviewCommand(ctx);
        return;
      }

      const [sub, ...rest] = trimmed.split(/\s+/);
      const restStr = rest.join(" ");

      if (sub === "fx") {
        const [action, raw, ...extra] = rest;
        if (!action) {
          const info = getPricingInfo(config, ctx.model?.name ?? ctx.model?.id);
          ctx.ui.notify(`1 USD = ${info.exchangeRate} CNY · ${t(config.exchangeRate?.mode === "fixed" ? "fx.fixed" : "fx.auto")} · ${info.fxDate ?? t("pricing.fxDate.notNeeded")}`, "info");
        } else if (action === "fixed" && raw && !extra.length && validExchangeRate(Number(raw))) {
          const next = { ...config, exchangeRate: { ...config.exchangeRate, mode: "fixed" as const, fixedRate: Number(raw) } };
          replaceConfig(next, ctx);
          ctx.ui.notify(`1 USD = ${Number(raw)} CNY · ${t("fx.fixed")}`, "info");
        } else if (action === "auto" && !raw) {
          const next = { ...config, exchangeRate: { ...config.exchangeRate, mode: "auto" as const } };
          replaceConfig(next, ctx);
          await updateExchangeRate(ctx, true);
        } else if (action === "refresh" && !raw) {
          await updateExchangeRate(ctx, true);
        } else ctx.ui.notify(t("fx.usage"), "warning");
        return;
      }
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
      if (sub === "config") {
        await runConfigCommand(ctx);
        return;
      }
      if (sub === "widget") {
        await runWidgetCommand(ctx);
        return;
      }
      if (sub === "export") {
        await runExportCmd(restStr, ctx);
        return;
      }

      const help = t("cmd.unknownSub", { sub: String(sub) });
      ctx.ui.notify(help, "warning");
    },
  });

  async function runOverviewCommand(ctx: ExtensionCommandContext): Promise<void> {
    const sessionId = getSessionId(ctx);
    const modelName = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay;
    let usedUsd = 0;
    try {
      const tracker = await getTracker();
      // 按当前模型消耗（切换模型后独立计数）
      usedUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);
    } catch { /* ignore */ }

    const context = ctx.getContextUsage?.();

    const overviewText = () => {
      const pricing = getPricingInfo(config, modelName);
      const budgetUsd = config.session?.usd;
      const status = checkSessionLimit(usedUsd, budgetUsd ?? 0, config);
      const lines: string[] = [];
      lines.push(`${t("overview.sessionCost")}: ${formatUsdInCurrency(usedUsd, pricing.displayCurrency, pricing.exchangeRate)}${budgetUsd && budgetUsd > 0 ? ` / ${formatUsdInCurrency(budgetUsd, pricing.displayCurrency, pricing.exchangeRate)}` : ` (${t("overview.noBudget")})`}`);
      lines.push(`${t("overview.model")}: ${modelName || t("report.unknown")}`);
      lines.push(`${t("pricing.nativeCurrency")}: ${currencyLabel(pricing.nativeCurrency)}`);
      lines.push(`${t("overview.sessionContext")}: ${sessionId}`);
      if (lastRequestSnap) {
        lines.push(`${t("overview.last")}: ${formatUsdInCurrency(lastRequestSnap.costUsd, pricing.displayCurrency, pricing.exchangeRate)} (${t("overview.inputTokens", { count: lastRequestSnap.inputTokens })} / ${t("overview.outputTokens", { count: lastRequestSnap.outputTokens })})`);
      }
      if (context) {
        const tokens = context.tokens ?? 0;
        const pct = context.percent != null ? `, ${t("overview.contextPercent", { pct: Math.round(context.percent) })}` : "";
        lines.push(`${t("overview.modelContext")}: ${tokens}/${context.contextWindow}${pct}`);
      } else {
        lines.push(`${t("overview.modelContext")}: ${t("overview.contextUnavailable")}`);
      }
      const statusKey = status?.level === "hard" ? "status.hard" : status?.level === "soft" ? "status.soft" : "status.ok";
      lines.push(`${t("overview.status")}: ${t(statusKey)}`);
      lines.push("");
      lines.push(t("overview.hintSetBudget"));
      return lines.join("\n");
    };

    if (!ctx.hasUI || ("mode" in ctx && ctx.mode !== "tui")) {
      ctx.ui.notify(overviewText(), "info");
      return;
    }

    await ctx.ui.custom<void>((tui, theme, _kb, done) => {
      const dashboard = createDashboard(
        { overview: overviewText },
        theme,
        {
          budgetFactory: () => createBudgetListForDashboard(config, modelName, (c) => {
            replaceConfig(c, ctx);
          }),
          pricingFactory: () => createPricingListForDashboard(config, modelName, (c) => {
            replaceConfig(c, ctx);
          }, () => { void updateExchangeRate(ctx, true); }),
          settingsFactory: () => createSettingsListForDashboard(config, modelName, (c) => {
            replaceConfig(c, ctx);
          }),
        },
        () => { refreshDashboard = undefined; done(); },
      );
      refreshDashboard = () => { dashboard.invalidate(); tui.requestRender(); };
      return {
        ...dashboard,
        handleInput(data: string) {
          dashboard.handleInput(data);
          tui.requestRender();
        },
      };
    });
  }

  async function runSetCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const parsed = parseSetArgs(args);
    if (!parsed) {
      ctx.ui.notify(t("set.usage"), "warning");
      return;
    }
    config = applySet(parsed, config);
    // 调高预算时清掉对应的软限去重标记，避免下次到软限不弹
    const sessionId = getSessionId(ctx);
    for (const k of [...softLimitAlreadyShown]) {
      if (k.startsWith(`${sessionId}:`)) softLimitAlreadyShown.delete(k);
    }
    // 立刻刷新 widget（按当前模型消耗）
    if (uiRef) {
      const modelName = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay;
      let usedModelUsd = 0;
      try {
        const tracker = await getTracker();
        usedModelUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedModelUsd);
    }
    ctx.ui.notify(t("set.budgetSet", { scope: parsed.scope, amount: fmtUsd(parsed.amount) }), "info");
  }

  async function runUnsetCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const scope = parseUnsetArgs(args);
    config = applyUnset(scope, config);
    if (uiRef) {
      const sessionId = getSessionId(ctx);
      const modelName = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay;
      let usedModelUsd = 0;
      try {
        const tracker = await getTracker();
        usedModelUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);
      } catch {
        // ignore
      }
      refreshWidget(uiRef, ctx, usedModelUsd);
    }
    const scopeLabel = scope === "all" ? t("set.budgetClearedAll") : t("set.budgetCleared", { scope });
    ctx.ui.notify(scopeLabel, "info");
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
      await runReport(db, range, ctx, getPricingInfo(config, ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay).displayCurrency, effectiveExchangeRate(config));
    } catch (err) {
      ctx.ui.notify(t("report.generationFailed") + `: ${(err as Error).message}`, "error");
    }
  }

  async function runByCommand(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const parts = args.trim().split(/\s+/);
    const dim = parseByDim(parts[0]);
    if (!dim) {
      ctx.ui.notify(t("cmd.byUsage"), "warning");
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
      await runBy(db, dim, range, ctx, getPricingInfo(config, ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay).displayCurrency, effectiveExchangeRate(config));
    } catch (err) {
      ctx.ui.notify(t("error.sliceFailed") + `: ${(err as Error).message}`, "error");
    }
  }

  async function runConfigCommand(ctx: ExtensionCommandContext): Promise<void> {
    if (!ctx.hasUI || ("mode" in ctx && ctx.mode !== "tui")) return;
    try {
      await openFullSettings(config, ctx.ui, (c) => { replaceConfig(c, ctx); }, ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay);
      refreshWidgetAfterConfig(ctx);
    } catch (err) {
      ctx.ui.notify(t("error.settingsFailed") + `: ${(err as Error).message}`, "error");
    }
  }

  async function runWidgetCommand(ctx: ExtensionCommandContext): Promise<void> {
    if (!ctx.hasUI || ("mode" in ctx && ctx.mode !== "tui")) return;
    try {
      await openWidgetSettings(config, ctx.ui, (c) => { replaceConfig(c, ctx); }, ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay);
      refreshWidgetAfterConfig(ctx);
    } catch (err) {
      ctx.ui.notify(t("error.settingsFailed") + `: ${(err as Error).message}`, "error");
    }
  }

  function refreshWidgetAfterConfig(ctx: ExtensionContext): void {
    // 配置可能改变了 locale，同步更新
    if (config.locale) setLocale(config.locale);
    if (!uiRef) return;
    const sessionId = getSessionId(ctx);
    const modelName = ctx.model?.name ?? ctx.model?.id ?? currentModelDisplay;
    const ui = uiRef;
    getTracker().then((tracker) => {
      if (uiRef !== ui) return; // A closed or replaced session must not receive a pending refresh.
      const usedModelUsd = modelName ? tracker.sessionModelUsd(sessionId, modelName) : tracker.sessionUsd(sessionId);
      refreshWidget(ui, ctx, usedModelUsd);
    }).catch(() => {});
  }

  async function runExportCmd(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const format = parseExportFormat(args.trim().split(/\s+/)[0]);
    try {
      const db = await getDb();
      const result = await runExportCommand(db, format, getSessionId(ctx));
      ctx.ui.notify(result, "info");
    } catch (err) {
      ctx.ui.notify(`${t("export.error")}: ${(err as Error).message}`, "error");
    }
  }

  // 防 TS unused
  void pi;
  void saveConfig;
}
