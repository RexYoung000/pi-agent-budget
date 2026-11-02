/**
 * i18n 翻译键类型 & 各语言翻译数据
 *
 * 支持语言：en（默认）、zh-CN、ja、ko
 * 切换方式：config.locale 或环境变量 PI_LANG
 */

export type Locale = "en" | "zh-CN" | "ja" | "ko";

/** 所有支持的语言 */
export const SUPPORTED_LOCALES: Locale[] = ["en", "zh-CN", "ja", "ko"];

/** 语言显示名 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  ja: "日本語",
  ko: "한국어",
};

/** 翻译键定义 */
export interface Translations {
  "fx.mode": string;
  "fx.mode.description": string;
  "fx.fixed": string;
  "fx.auto": string;
  "fx.rate": string;
  "fx.rate.description": string;
  "fx.status": string;
  "fx.failure": string;
  "fx.source.description": string;
  "fx.failed": string;
  "fx.cached": string;
  "fx.builtin": string;
  "fx.ready": string;
  "fx.updated": string;
  "fx.usage": string;
  "fx.offline": string;
  "fx.refreshing": string;
  "fx.fixedRefresh": string;

  // ── widget ──
  "widget.prefix": string;

  // ── dashboard ──
  "dashboard.title": string;
  "dashboard.tab.overview": string;
  "dashboard.tab.report": string;
  "dashboard.tab.appearance": string;
  "dashboard.tab.settings": string;
  "dashboard.hint": string;
  "dashboard.truncated": string;

  "dashboard.tab.budget": string;
  "dashboard.tab.pricing": string;
  "dashboard.hint.overview": string;
  "dashboard.hint.interactive": string;

  // ── status labels ──
  "status.ok": string;
  "status.soft": string;
  "status.hard": string;

  // ── overview additions ──
  "overview.sessionCost": string;
  "overview.sessionContext": string;
  "overview.modelContext": string;
  "overview.contextUnavailable": string;
  "overview.contextPercent": string;
  "overview.inputTokens": string;
  "overview.outputTokens": string;

  // ── budget TUI ──
  "budget.sessionBudget": string;
  "budget.sessionBudget.description": string;
  "budget.clearSession": string;
  "budget.clearSession.description": string;
  "budget.value.unset": string;
  "budget.action.ready": string;
  "budget.action.clear": string;

  // ── pricing ──
  "pricing.anchor": string;
  "pricing.anchor.followModel": string;
  "pricing.anchor.cny": string;
  "pricing.anchor.usd": string;
  "pricing.anchor.description": string;
  "pricing.currentModel": string;
  "pricing.currentModel.description": string;
  "pricing.provider": string;
  "pricing.provider.description": string;
  "pricing.provider.unknown": string;
  "pricing.nativeCurrency": string;
  "pricing.nativeCurrency.description": string;
  "pricing.displayCurrency": string;
  "pricing.displayCurrency.description": string;
  "pricing.currency.cny": string;
  "pricing.currency.usd": string;
  "pricing.priceDate": string;
  "pricing.priceDate.description": string;
  "pricing.fxDate": string;
  "pricing.fxDate.description": string;
  "pricing.fxDate.notNeeded": string;
  "pricing.updateToday": string;
  "pricing.updateToday.description": string;
  "pricing.status.latest": string;
  "pricing.action.update": string;

  // ── overview ──
  "overview.session": string;
  "overview.model": string;
  "overview.last": string;
  "overview.status": string;
  "overview.noBudget": string;
  "overview.hintSetBudget": string;
  "overview.estRemaining": string;
  "overview.statusOk": string;

  // ── report ──
  "report.title": string;
  "report.col.model": string;
  "report.col.tool": string;
  "report.col.session": string;
  "report.col.usd": string;
  "report.col.requests": string;
  "report.col.pct": string;
  "report.summary": string;
  "report.noData": string;
  "report.generationFailed": string;
  "report.range.today": string;
  "report.range.week": string;
  "report.range.month": string;
  "report.range.all": string;
  "report.header.total": string;
  "report.header.sessions": string;
  "report.header.requests": string;
  "report.header.avgPerSession": string;
  "report.byModel": string;
  "report.byTool": string;
  "report.byDim": string;
  "report.unknown": string;
  "report.noTool": string;
  "report.unknownRange": string;
  "report.byUsage": string;

  // ── set / budget ──
  "set.scope.session": string;
  "set.scope.project": string;
  "set.scope.global": string;
  "set.budgetSet": string;
  "set.budgetCleared": string;
  "set.budgetClearedAll": string;
  "set.usage": string;
  "set.raisedTo": string;
  "set.sessionEnded": string;
  "set.continued": string;
  "set.hardLimitBlocked": string;

  // ── config ──
  "config.title": string;
  "config.softLimitBehavior": string;
  "config.softLimitThreshold": string;
  "config.hardLimitBehavior": string;
  "config.projectId": string;
  "config.custom": string;
  "config.auto": string;
  "config.debugLog": string;
  "config.locale": string;
  "config.settingsError": string;
  "config.widgetSummary.onSoftLimit.notify": string;
  "config.widgetSummary.onSoftLimit.pause": string;
  "config.widgetSummary.onSoftLimit.downgrade": string;
  "config.widgetSummary.onHardLimit.pause": string;
  "config.widgetSummary.onHardLimit.terminate": string;
  "config.widgetSummary.projectId.override": string;
  "config.widgetSummary.projectId.auto": string;
  "config.widgetSummary.debug.on": string;
  "config.widgetSummary.debug.off": string;
  "config.softLimit.description": string;
  "config.softLimitRatio.description": string;
  "config.hardLimit.description": string;
  "config.debug.description": string;
  "config.locale.description": string;

  // ── widget config panel ──
  "widget.placement.aboveEditor": string;
  "widget.placement.belowEditor": string;
  "widget.config.title": string;
  "widget.config.placement": string;
  "widget.config.compact": string;
  "widget.config.showModel": string;
  "widget.config.showProgress": string;
  "widget.config.showContext": string;
  "widget.config.currency": string;
  "widget.config.livePreview": string;
  "widget.config.hintNav": string;
  "widget.config.hintEdit": string;
  "widget.config.mode": string;
  "widget.config.modeFull": string;
  "widget.config.modeCustom": string;
  "widget.config.modeDescription": string;
  "widget.config.placementDescription": string;
  "widget.config.currencyDescription": string;
  "widget.config.showModelDescription": string;
  "widget.config.showProgressDescription": string;
  "widget.config.showContextDescription": string;

  // ── value labels (通用 on/off/popup 等) ──
  "value.on": string;
  "value.off": string;

  // ── localized settings list ──
  "settingsList.empty": string;
  "settingsList.hint": string;
  "settingsList.position": string;

  // ── alert cards ──
  "alert.softLimit.title": string;
  "alert.softLimit.message": string;
  "alert.softLimit.raiseBudget": string;
  "alert.softLimit.continue": string;
  "alert.softLimit.endSession": string;
  "alert.hardLimit.title": string;
  "alert.hardLimit.message": string;
  "alert.hardLimit.raiseBudget": string;
  "alert.hardLimit.cancel": string;
  "alert.newBudget.title": string;
  "alert.newBudget.message": string;
  "alert.newBudget.cancel": string;

  // ── export ──
  "export.title": string;
  "export.generating": string;
  "export.savedTo": string;
  "export.error": string;
  "export.unsupported": string;
  "export.usage": string;

  // ── command / generic errors ──
  "cmd.budget.description": string;
  "cmd.unknownSub": string;
  "cmd.byUsage": string;
  "error.sliceFailed": string;
  "error.settingsFailed": string;
  "error.rangeInvalid": string;

  // ── log messages ──
  "log.costMissing": string;
  "log.messageEndError": string;
  "log.sessionStartError": string;
  "log.modelSelectError": string;
  "log.hardLimitError": string;
  "log.softLimitError": string;
  "log.configLoadError": string;
}

// ──────────────────────────────────────────────────────────────────────────
// 各语言翻译数据
// ──────────────────────────────────────────────────────────────────────────

const en: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "Overview",
  "dashboard.tab.report": "Report",
  "dashboard.tab.appearance": "Appearance",
  "dashboard.tab.settings": "Settings",
  "dashboard.hint": "← → switch tab    ESC exit",
  "dashboard.tab.budget": "Budget",
  "dashboard.tab.pricing": "Pricing",
  "dashboard.hint.overview": "← → switch tab    ESC exit",
  "dashboard.hint.interactive": "← → switch tab    ↑↓ select    Enter change    ESC exit",
  "dashboard.truncated": "... (truncated from {total} lines)",

  "overview.session": "会话",
  "overview.model": "模型",
  "overview.last": "上次请求",
  "overview.status": "状态",
  "overview.noBudget": "no budget",
  "overview.hintSetBudget": "Tip: switch to Budget to set it here.",
  "overview.estRemaining": "~{count} more similar requests estimated",
  "overview.statusOk": "ok",
  "status.ok": "Normal",
  "status.soft": "Near budget",
  "status.hard": "Limit reached",
  "overview.sessionCost": "Session cost",
  "overview.sessionContext": "Session context",
  "overview.modelContext": "Model context",
  "overview.contextUnavailable": "Not available",
  "overview.contextPercent": "{pct}% used",
  "overview.inputTokens": "in {count}",
  "overview.outputTokens": "out {count}",
  "budget.sessionBudget": "Session budget",
  "budget.sessionBudget.description": "Set the budget for this session. Presets follow the current display currency: {currency}.",
  "budget.clearSession": "Clear session budget",
  "budget.clearSession.description": "Remove the current session budget. Cost tracking continues, but no limit is enforced.",
  "budget.value.unset": "Unset",
  "budget.action.ready": "Ready",
  "budget.action.clear": "Clear",
  "pricing.anchor": "Pricing anchor",
  "pricing.anchor.followModel": "Follow model",
  "pricing.anchor.cny": "Unified CNY",
  "pricing.anchor.usd": "Unified USD",
  "pricing.anchor.description": "Follow model keeps domestic models in CNY and overseas models in USD. Unified modes convert display to one currency.",
  "pricing.currentModel": "Current model",
  "pricing.currentModel.description": "Model name detected from the current session.",
  "pricing.provider": "Provider",
  "pricing.provider.description": "Provider inferred from the model name.",
  "pricing.provider.unknown": "Unknown provider",
  "pricing.nativeCurrency": "Native currency",
  "pricing.nativeCurrency.description": "The model provider’s original billing currency.",
  "pricing.displayCurrency": "Display currency",
  "pricing.displayCurrency.description": "Currency used in the TUI and widget display.",
  "pricing.currency.cny": "CNY / ¥",
  "pricing.currency.usd": "USD / $",
  "pricing.priceDate": "Price date",
  "pricing.priceDate.description": "Date of the built-in price table used by this extension.",
  "pricing.fxDate": "FX date",
  "pricing.fxDate.description": "Date of the actual reference-rate data; fixed rates have no market date.",
  "pricing.fxDate.notNeeded": "Fixed rate",
  "pricing.updateToday": "Refresh exchange rate",
  "pricing.updateToday.description": "Fetch the latest USD/CNY reference rate. Model prices are not changed.",
  "pricing.status.latest": "Latest",
  "pricing.action.update": "Update",

  "report.title": "Budget Report",
  "report.col.model": "Model",
  "report.col.tool": "Tool",
  "report.col.session": "Session",
  "report.col.usd": "USD",
  "report.col.requests": "Requests",
  "report.col.pct": "%",
  "report.summary": "Summary",
  "report.noData": "No data for this range",
  "report.generationFailed": "Report generation failed",
  "report.range.today": "Today",
  "report.range.week": "This Week",
  "report.range.month": "This Month",
  "report.range.all": "All Time",
  "report.header.total": "Total",
  "report.header.sessions": "Sessions",
  "report.header.requests": "Requests",
  "report.header.avgPerSession": "Avg/Session",
  "report.byModel": "By Model",
  "report.byTool": "By Tool",
  "report.byDim": "By {dim}",
  "report.unknown": "(unknown)",
  "report.noTool": "(no tool)",
  "report.unknownRange": "Unknown range: {arg}. Supported: today/week/month/all",
  "report.byUsage": "Usage: /budget by <model|tool|session> [today|week|month|all]",

  "set.scope.session": "session",
  "set.scope.project": "project",
  "set.scope.global": "global",
  "set.budgetSet": "Budget set: {scope} = {amount}",
  "set.budgetCleared": "Budget cleared: {scope}",
  "set.budgetClearedAll": "All budgets cleared",
  "set.usage": "Usage (amounts in USD):\n  /budget set <amount>\n  /budget set project <amount>\n  /budget set global <amount>",
  "set.raisedTo": "Budget raised to {amount}",
  "set.sessionEnded": "Session ended (user terminated)",
  "set.continued": "Continuing, will block again at hard limit",
  "set.hardLimitBlocked": "Hard limit reached — message not sent. Open Budget to raise it.",

  "config.title": "Budget Settings",
  "config.softLimitBehavior": "Soft limit behavior",
  "config.softLimitThreshold": "Soft limit threshold",
  "config.hardLimitBehavior": "Hard limit behavior",
  "config.projectId": "Project ID",
  "config.custom": "Custom",
  "config.auto": "Auto (git remote)",
  "config.debugLog": "Debug log",
  "config.locale": "Language",
  "config.settingsError": "Settings error",
  "config.widgetSummary.onSoftLimit.notify": "Notify",
  "config.widgetSummary.onSoftLimit.pause": "Popup",
  "config.widgetSummary.onSoftLimit.downgrade": "Downgrade",
  "config.widgetSummary.onHardLimit.pause": "Popup",
  "config.widgetSummary.onHardLimit.terminate": "Terminate",
  "config.widgetSummary.projectId.override": "Custom",
  "config.widgetSummary.projectId.auto": "Auto (git remote)",
  "config.widgetSummary.debug.on": "On",
  "config.widgetSummary.debug.off": "Off",
  "config.softLimit.description": "Triggered at {pct}% of budget.\n{notify}: notification only.\n{pause}: popup with options.",
  "config.softLimitRatio.description": "Budget % at which to warn you.",
  "config.hardLimit.description": "Triggered at 100% of budget.\n{pause}: popup with options.\n{terminate}: reject new messages immediately.",
  "config.debug.description": "Write detailed logs to ~/.pi/logs/. Not needed for normal use.",
  "config.locale.description": "Change the display language. Saved to config.",

  "widget.placement.aboveEditor": "Above editor",
  "widget.placement.belowEditor": "Below input",
  "widget.config.title": "Widget Appearance",
  "widget.config.placement": "Placement",
  "widget.config.compact": "Compact mode",
  "widget.config.showModel": "Show model name",
  "widget.config.showProgress": "Show progress bar",
  "widget.config.showContext": "Show context window",
  "widget.config.currency": "Currency symbol",
  "widget.config.livePreview": "Live Preview",
  "widget.config.hintNav": "← → switch tab    ESC exit",
  "widget.config.hintEdit": "/budget widget to edit interactively",
  "widget.config.mode": "Display mode",
  "widget.config.modeFull": "Full",
  "widget.config.modeCustom": "Custom",
  "widget.config.modeDescription": "• {compact}: cost only, one line.\n• {full}: model + progress bar + context window.\n• {custom}: toggle each item below.",
  "widget.config.placementDescription": "Where the widget appears. Recommended: below input (doesn’t obscure code).",
  "widget.config.currencyDescription": "Prefix before cost numbers. Cosmetic only (pi uses USD internally).\nPreview: {sym}0.42",
  "widget.config.showModelDescription": "Show current AI model name on widget.\nPreview: {on}",
  "widget.config.showProgressDescription": "Show budget bar with █ and ░. Color changes: green → cyan → orange → red.\nPreview: {on}",
  "widget.config.showContextDescription": "Show context window usage (tokens / limit + %).\nPreview: │ 28K/200K (14%)",
  "value.on": "On",
  "value.off": "Off",
  "settingsList.empty": "No settings available",
  "settingsList.hint": "↑↓ select · Enter/Space change · ESC exit",
  "settingsList.position": "{current}/{total}",

  "alert.softLimit.title": "⚠️ Soft Limit Reached",
  "alert.softLimit.message": "Used {used} / {budget} ({pct}%)\nYou are approaching your budget limit.",
  "alert.softLimit.raiseBudget": "Raise budget",
  "alert.softLimit.continue": "Continue",
  "alert.softLimit.endSession": "End session",
  "alert.hardLimit.title": "🛑 Hard Limit Reached",
  "alert.hardLimit.message": "Budget exhausted: {used} / {budget}\nFurther requests are blocked.",
  "alert.hardLimit.raiseBudget": "Raise budget",
  "alert.hardLimit.cancel": "Cancel",
  "alert.newBudget.title": "New budget amount",
  "alert.newBudget.message": "Enter new budget amount ({currency}):",
  "alert.newBudget.cancel": "Cancel",

  "export.title": "Export Data",
  "export.generating": "Generating export...",
  "export.savedTo": "Exported to: {path}",
  "export.error": "Export failed",
  "export.unsupported": "Unsupported format: {format}",
  "export.usage": "Usage: /budget export [csv|json]",
  "cmd.budget.description": "AI cost budget manager: /budget | /budget set <amount> | /budget report [range] | /budget by <dim>",
  "cmd.unknownSub": "Unknown sub-command: {sub}\nAvailable: widget / set / unset / report / by / config / export",
  "cmd.byUsage": "Usage: /budget by <model|tool|session> [today|week|month|all]",
  "error.sliceFailed": "Slice view failed",
  "error.settingsFailed": "Settings error",
  "error.rangeInvalid": "Invalid range",

  "log.costMissing": "usage.cost.total missing, skipping record (model={model})",
  "log.messageEndError": "message_end processing failed",
  "log.sessionStartError": "session_start processing failed",
  "log.modelSelectError": "model_select processing failed",
  "log.hardLimitError": "Hard limit popup failed",
  "log.softLimitError": "Soft limit popup failed",
  "log.configLoadError": "loadConfig failed, using defaults",
  "fx.mode": "Exchange-rate mode",
  "fx.mode.description": "Automatic daily refresh or fixed rate. Set a value with /budget fx fixed <rate>.",
  "fx.fixed": "Fixed",
  "fx.auto": "Automatic",
  "fx.rate": "USD/CNY rate",
  "fx.rate.description": "Set any positive rate: /budget fx fixed 7.1. Return to automatic: /budget fx auto.",
  "fx.status": "Rate status",
  "fx.failure": "Refresh failed; retaining the last valid rate or built-in reference. Use /budget fx refresh to retry.",
  "fx.source.description": "Frankfurter daily reference, not your payment settlement rate. Built-in is used only without a saved rate.",
  "fx.failed": "Refresh failed",
  "fx.cached": "Frankfurter (cached)",
  "fx.builtin": "Built-in reference",
  "fx.ready": "Ready",
  "fx.updated": "Exchange rate updated.",
  "fx.usage": "Usage: /budget fx [auto | fixed <CNY per USD> | refresh]. Rate must be finite and greater than zero.",
  "fx.offline": "Offline: using the saved rate or built-in reference.",
  "fx.refreshing": "Refreshing exchange rate…",
  "fx.fixedRefresh": "Fixed mode: use /budget fx auto to enable online updates.",
};

const zhCN: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "概览",
  "dashboard.tab.report": "报表",
  "dashboard.tab.appearance": "外观",
  "dashboard.tab.settings": "设置",
  "dashboard.hint": "← → 切换标签    ESC 退出",
  "dashboard.tab.budget": "预算",
  "dashboard.tab.pricing": "价格表",
  "dashboard.hint.overview": "← → 切换标签    ESC 退出",
  "dashboard.hint.interactive": "← → 切换标签    ↑↓ 选择    Enter 修改    ESC 退出",
  "dashboard.truncated": "... (共 {total} 行，已截断)",

  "overview.session": "会话",
  "overview.model": "模型",
  "overview.last": "上次请求",
  "overview.status": "状态",
  "overview.noBudget": "无预算",
  "overview.hintSetBudget": "还没有预算时，可切到「预算」页直接设置。",
  "overview.estRemaining": "预计还可发起 ~{count} 次类似请求",
  "overview.statusOk": "正常",
  "status.ok": "正常",
  "status.soft": "接近预算",
  "status.hard": "已达上限",
  "overview.sessionCost": "当前会话花费",
  "overview.sessionContext": "Session 上下文",
  "overview.modelContext": "模型上下文",
  "overview.contextUnavailable": "暂时无法读取",
  "overview.contextPercent": "{pct}% 使用",
  "overview.inputTokens": "输入 {count}",
  "overview.outputTokens": "输出 {count}",
  "budget.sessionBudget": "本次会话预算",
  "budget.sessionBudget.description": "设置本次会话预算。档位会跟随当前展示币种：{currency}。",
  "budget.clearSession": "清除本次预算",
  "budget.clearSession.description": "清除当前会话预算。花费仍会记录，但不会触发预算限制。",
  "budget.value.unset": "未设置",
  "budget.action.ready": "待执行",
  "budget.action.clear": "清除",
  "pricing.anchor": "价格锚点",
  "pricing.anchor.followModel": "跟随模型",
  "pricing.anchor.cny": "统一人民币",
  "pricing.anchor.usd": "统一美元",
  "pricing.anchor.description": "跟随模型会让国内模型用人民币、海外模型用美元；统一模式会把展示口径固定为一种币种。",
  "pricing.currentModel": "当前模型",
  "pricing.currentModel.description": "从当前会话识别到的模型名称。",
  "pricing.provider": "模型厂商",
  "pricing.provider.description": "根据模型名推断出的服务商。",
  "pricing.provider.unknown": "未知厂商",
  "pricing.nativeCurrency": "模型计价币种",
  "pricing.nativeCurrency.description": "模型服务商原始账单使用的币种。",
  "pricing.displayCurrency": "界面展示币种",
  "pricing.displayCurrency.description": "TUI 和 Widget 当前展示使用的币种。",
  "pricing.currency.cny": "CNY / ¥",
  "pricing.currency.usd": "USD / $",
  "pricing.priceDate": "价格表日期",
  "pricing.priceDate.description": "当前扩展内置价格表对应的日期。",
  "pricing.fxDate": "汇率日期",
  "pricing.fxDate.description": "实际参考汇率数据的日期；固定汇率没有市场数据日期。",
  "pricing.fxDate.notNeeded": "固定汇率",
  "pricing.updateToday": "立即更新汇率",
  "pricing.updateToday.description": "获取最新 USD/CNY 参考汇率，不更改模型价格表。",
  "pricing.status.latest": "最新",
  "pricing.action.update": "更新",

  "report.title": "预算报告",
  "report.col.model": "模型",
  "report.col.tool": "工具",
  "report.col.session": "会话",
  "report.col.usd": "美元",
  "report.col.requests": "请求数",
  "report.col.pct": "占比",
  "report.summary": "汇总",
  "report.noData": "该时间范围无数据",
  "report.generationFailed": "报表生成失败",
  "report.range.today": "今天",
  "report.range.week": "本周",
  "report.range.month": "本月",
  "report.range.all": "全部",
  "report.header.total": "总计",
  "report.header.sessions": "会话数",
  "report.header.requests": "请求数",
  "report.header.avgPerSession": "平均/会话",
  "report.byModel": "按模型",
  "report.byTool": "按工具",
  "report.byDim": "按 {dim}",
  "report.unknown": "(未知)",
  "report.noTool": "(无工具)",
  "report.unknownRange": "未知范围：{arg}。支持 today/week/month/all",
  "report.byUsage": "用法：/budget by <model|tool|session> [today|week|month|all]",

  "set.scope.session": "会话",
  "set.scope.project": "项目",
  "set.scope.global": "全局",
  "set.budgetSet": "已设置 {scope} 预算 = {amount}",
  "set.budgetCleared": "已清除 {scope} 预算",
  "set.budgetClearedAll": "已清除全部预算",
  "set.usage": "用法（金额单位：美元 USD）：\n  /budget set <金额>\n  /budget set project <金额>\n  /budget set global <金额>",
  "set.raisedTo": "预算已调高到 {amount}",
  "set.sessionEnded": "会话已结束（用户主动终止）",
  "set.continued": "已继续，到硬限会再次拦截",
  "set.hardLimitBlocked": "已硬限，消息未发送（可用 /budget set 调高预算）",

  "config.title": "预算设置",
  "config.softLimitBehavior": "软限行为",
  "config.softLimitThreshold": "软限阈值",
  "config.hardLimitBehavior": "硬限行为",
  "config.projectId": "项目识别",
  "config.custom": "自定义",
  "config.auto": "自动（git remote）",
  "config.debugLog": "调试日志",
  "config.locale": "语言",
  "config.settingsError": "设置错误",
  "config.widgetSummary.onSoftLimit.notify": "通知",
  "config.widgetSummary.onSoftLimit.pause": "弹窗",
  "config.widgetSummary.onSoftLimit.downgrade": "降级",
  "config.widgetSummary.onHardLimit.pause": "弹窗",
  "config.widgetSummary.onHardLimit.terminate": "终止",
  "config.widgetSummary.projectId.override": "自定义",
  "config.widgetSummary.projectId.auto": "自动（git remote）",
  "config.widgetSummary.debug.on": "开启",
  "config.widgetSummary.debug.off": "关闭",
  "config.softLimit.description": "达到预算的 {pct}% 时触发。\n{notify}：仅在状态栏提示。\n{pause}：跳出选项让你选择。",
  "config.softLimitRatio.description": "预算消耗到多少百分比时警告你。",
  "config.hardLimit.description": "达到预算 100% 时触发。\n{pause}：跳出选项让你选择。\n{terminate}：直接拒绝发送新消息。",
  "config.debug.description": "开启后会在 ~/.pi/logs/ 下记录详细运行日志。正常使用无需开启。",
  "config.locale.description": "切换显示语言。会保存到配置文件。",

  "widget.placement.aboveEditor": "编辑器上方",
  "widget.placement.belowEditor": "输入框下方",
  "widget.config.title": "Widget 外观",
  "widget.config.placement": "显示位置",
  "widget.config.compact": "极简模式",
  "widget.config.showModel": "显示模型名",
  "widget.config.showProgress": "显示进度条",
  "widget.config.showContext": "显示上下文窗口",
  "widget.config.currency": "货币符号",
  "widget.config.livePreview": "实时预览",
  "widget.config.hintNav": "← → 切换标签    ESC 退出",
  "widget.config.hintEdit": "/budget widget 可交互编辑外观",
  "widget.config.mode": "显示模式",
  "widget.config.modeFull": "丰富",
  "widget.config.modeCustom": "自定义",
  "widget.config.modeDescription": "• {compact}：只显示一行成本数字。\n• {full}：显示模型名 + 进度条 + 上下文窗口。\n• {custom}：自由开关下面每一项。",
  "widget.config.placementDescription": "选择 Widget 出现在编辑器上方还是输入框下面。推荐放在输入框下面，不遮挡代码。",
  "widget.config.currencyDescription": "成本数字前面的符号。只是显示样式，不做汇率换算（pi 内部统一用 USD 计价）。\n预览：{sym}0.42",
  "widget.config.showModelDescription": "打开后 Widget 第一行会显示当前使用的 AI 模型。\n预览：{on}",
  "widget.config.showProgressDescription": "打开后 Widget 用 █ 和 ░ 直观展示预算消耗进度。颜色随消耗自动变化：绿→青→橙→红。\n预览：{on}",
  "widget.config.showContextDescription": "打开后 Widget 显示当前会话的上下文使用情况。\n预览：│ 28K/200K (14%)",
  "value.on": "开启",
  "value.off": "关闭",
  "settingsList.empty": "暂无设置项",
  "settingsList.hint": "↑↓ 选择 · Enter/Space 修改 · ESC 退出",
  "settingsList.position": "{current}/{total}",

  "alert.softLimit.title": "⚠️ 已达软限",
  "alert.softLimit.message": "已用 {used} / {budget}（{pct}%）\n预算即将用尽。",
  "alert.softLimit.raiseBudget": "调高预算",
  "alert.softLimit.continue": "继续",
  "alert.softLimit.endSession": "结束会话",
  "alert.hardLimit.title": "🛑 已达硬限",
  "alert.hardLimit.message": "预算用尽：{used} / {budget}\n后续请求已被拦截。",
  "alert.hardLimit.raiseBudget": "调高预算",
  "alert.hardLimit.cancel": "取消",
  "alert.newBudget.title": "新预算金额",
  "alert.newBudget.message": "请输入新预算金额（{currency}）：",
  "alert.newBudget.cancel": "取消",

  "export.title": "导出数据",
  "export.generating": "正在生成导出文件...",
  "export.savedTo": "已导出到：{path}",
  "export.error": "导出失败",
  "export.unsupported": "不支持的格式：{format}",
  "export.usage": "用法：/budget export [csv|json]",
  "cmd.budget.description": "AI 成本预算管理：/budget | /budget set <金额> | /budget report [范围] | /budget by <维度>",
  "cmd.unknownSub": "未知子命令：{sub}\n可用：widget / set / unset / report / by / config / export",
  "cmd.byUsage": "用法：/budget by <model|tool|session> [today|week|month|all]",
  "error.sliceFailed": "切片生成失败",
  "error.settingsFailed": "设置错误",
  "error.rangeInvalid": "范围无效",

  "log.costMissing": "usage.cost.total 缺失，跳过记录（model={model}）",
  "log.messageEndError": "message_end 处理失败",
  "log.sessionStartError": "session_start 处理失败",
  "log.modelSelectError": "model_select 处理失败",
  "log.hardLimitError": "硬限弹窗失败",
  "log.softLimitError": "软限弹窗失败",
  "log.configLoadError": "loadConfig 失败，使用默认值",
  "fx.mode": "汇率模式",
  "fx.mode.description": "自动每日更新或固定汇率。用 /budget fx fixed <汇率> 设置固定值。",
  "fx.fixed": "固定",
  "fx.auto": "自动",
  "fx.rate": "美元兑人民币",
  "fx.rate.description": "自定义汇率：/budget fx fixed 7.1；恢复自动：/budget fx auto。",
  "fx.status": "汇率状态",
  "fx.failure": "更新失败，保留上次有效汇率或内置参考值。可用 /budget fx refresh 重试。",
  "fx.source.description": "Frankfurter 每日参考汇率，不是支付结算汇率；没有缓存时才用内置参考值。",
  "fx.failed": "更新失败",
  "fx.cached": "Frankfurter（已缓存）",
  "fx.builtin": "内置参考值",
  "fx.ready": "可刷新",
  "fx.updated": "汇率已更新。",
  "fx.usage": "用法：/budget fx [auto | fixed <1 美元对应人民币数> | refresh]；汇率须为有限正数。",
  "fx.offline": "离线模式：使用已保存汇率或内置参考值。",
  "fx.refreshing": "正在更新汇率…",
  "fx.fixedRefresh": "当前为固定汇率；用 /budget fx auto 开启联网更新。",
};

const ja: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "概要",
  "dashboard.tab.report": "レポート",
  "dashboard.tab.appearance": "表示",
  "dashboard.tab.settings": "設定",
  "dashboard.hint": "← → タブ切替    ESC 終了",
  "dashboard.tab.budget": "予算",
  "dashboard.tab.pricing": "価格表",
  "dashboard.hint.overview": "← → タブ切替    ESC 終了",
  "dashboard.hint.interactive": "← → タブ切替    ↑↓ 選択    Enter 変更    ESC 終了",
  "dashboard.truncated": "... ({total}行中、切り捨て)",

  "overview.session": "会话",
  "overview.model": "模型",
  "overview.last": "上次请求",
  "overview.status": "状态",
  "overview.noBudget": "予算なし",
  "overview.hintSetBudget": "未設定の場合は「予算」タブで直接設定できます。",
  "overview.estRemaining": "あと約{count}回の類似リクエストが可能",
  "overview.statusOk": "正常",
  "status.ok": "正常",
  "status.soft": "予算に近い",
  "status.hard": "已达上限",
  "overview.sessionCost": "セッション費用",
  "overview.sessionContext": "セッションコンテキスト",
  "overview.modelContext": "モデルコンテキスト",
  "overview.contextUnavailable": "暂时无法读取",
  "overview.contextPercent": "{pct}% 使用",
  "overview.inputTokens": "输入 {count}",
  "overview.outputTokens": "输出 {count}",
  "budget.sessionBudget": "セッション予算",
  "budget.sessionBudget.description": "このセッションの予算を設定します。プリセットは現在の表示通貨（{currency}）に従います。",
  "budget.clearSession": "セッション予算をクリア",
  "budget.clearSession.description": "現在のセッション予算を削除します。費用記録は継続しますが、制限は適用されません。",
  "budget.value.unset": "未設定",
  "budget.action.ready": "待执行",
  "budget.action.clear": "清除",
  "pricing.anchor": "価格アンカー",
  "pricing.anchor.followModel": "モデルに追従",
  "pricing.anchor.cny": "统一人民币",
  "pricing.anchor.usd": "统一美元",
  "pricing.anchor.description": "モデル追従では中国系モデルはCNY、海外モデルはUSDで表示します。統一モードでは表示通貨を固定します。",
  "pricing.currentModel": "現在のモデル",
  "pricing.currentModel.description": "現在のセッションから検出したモデル名。",
  "pricing.provider": "模型厂商",
  "pricing.provider.description": "モデル名から推定した提供元。",
  "pricing.provider.unknown": "未知厂商",
  "pricing.nativeCurrency": "模型计价币种",
  "pricing.nativeCurrency.description": "モデル提供元の本来の請求通貨。",
  "pricing.displayCurrency": "界面展示币种",
  "pricing.displayCurrency.description": "TUI 和 Widget 当前展示使用的币种。",
  "pricing.currency.cny": "CNY / ¥",
  "pricing.currency.usd": "USD / $",
  "pricing.priceDate": "価格表日付",
  "pricing.priceDate.description": "この拡張の内蔵価格表の日付。",
  "pricing.fxDate": "汇率日期",
  "pricing.fxDate.description": "参考レートの実際のデータ日付。固定レートにはありません。",
  "pricing.fxDate.notNeeded": "固定レート",
  "pricing.updateToday": "為替を更新",
  "pricing.updateToday.description": "最新の USD/CNY 参考レートを取得。モデル価格は変更しません。",
  "pricing.status.latest": "最新",
  "pricing.action.update": "更新",

  "report.title": "予算レポート",
  "report.col.model": "モデル",
  "report.col.tool": "ツール",
  "report.col.session": "セッション",
  "report.col.usd": "USD",
  "report.col.requests": "リクエスト数",
  "report.col.pct": "割合",
  "report.summary": "サマリー",
  "report.noData": "この期間のデータはありません",
  "report.generationFailed": "レポート生成に失敗",
  "report.range.today": "今日",
  "report.range.week": "今週",
  "report.range.month": "今月",
  "report.range.all": "全期間",
  "report.header.total": "合計",
  "report.header.sessions": "セッション",
  "report.header.requests": "リクエスト",
  "report.header.avgPerSession": "平均/セッション",
  "report.byModel": "モデル別",
  "report.byTool": "ツール別",
  "report.byDim": "{dim}別",
  "report.unknown": "(不明)",
  "report.noTool": "(ツールなし)",
  "report.unknownRange": "不明な範囲: {arg}。対応: today/week/month/all",
  "report.byUsage": "使い方: /budget by <model|tool|session> [today|week|month|all]",

  "set.scope.session": "セッション",
  "set.scope.project": "プロジェクト",
  "set.scope.global": "グローバル",
  "set.budgetSet": "{scope} 予算を {amount} に設定しました",
  "set.budgetCleared": "{scope} 予算をクリアしました",
  "set.budgetClearedAll": "すべての予算をクリアしました",
  "set.usage": "使い方（金額は USD）:\n  /budget set <金額>\n  /budget set project <金額>\n  /budget set global <金額>",
  "set.raisedTo": "予算を {amount} に引き上げました",
  "set.sessionEnded": "セッション終了（ユーザーによる終了）",
  "set.continued": "続行します（ハードリミットで再度ブロック）",
  "set.hardLimitBlocked": "ハードリミット到達 — メッセージは送信されません（/budget set で予算を上げてください）",

  "config.title": "予算設定",
  "config.softLimitBehavior": "ソフトリミット動作",
  "config.softLimitThreshold": "ソフトリミット閾値",
  "config.hardLimitBehavior": "ハードリミット動作",
  "config.projectId": "プロジェクトID",
  "config.custom": "カスタム",
  "config.auto": "自動（git remote）",
  "config.debugLog": "デバッグログ",
  "config.locale": "言語",
  "config.settingsError": "設定エラー",
  "config.widgetSummary.onSoftLimit.notify": "通知",
  "config.widgetSummary.onSoftLimit.pause": "ポップアップ",
  "config.widgetSummary.onSoftLimit.downgrade": "ダウングレード",
  "config.widgetSummary.onHardLimit.pause": "ポップアップ",
  "config.widgetSummary.onHardLimit.terminate": "終了",
  "config.widgetSummary.projectId.override": "カスタム",
  "config.widgetSummary.projectId.auto": "自動（git remote）",
  "config.widgetSummary.debug.on": "オン",
  "config.widgetSummary.debug.off": "オフ",
  "config.softLimit.description": "予算の {pct}% でトリガー。\n{notify}: 通知のみ。\n{pause}: 選択肢のポップアップ。",
  "config.softLimitRatio.description": "警告を出す予算の消費割合。",
  "config.hardLimit.description": "予算 100% でトリガー。\n{pause}: 選択肢のポップアップ。\n{terminate}: 新しいメッセージを即座に拒否。",
  "config.debug.description": "〜/.pi/logs/ に詳細ログを書き出します。通常使用では不要。",
  "config.locale.description": "表示言語を切替えます。設定に保存されます。",

  "widget.placement.aboveEditor": "エディタ上部",
  "widget.placement.belowEditor": "入力欄下部",
  "widget.config.title": "Widget 表示設定",
  "widget.config.placement": "表示位置",
  "widget.config.compact": "コンパクト表示",
  "widget.config.showModel": "モデル名を表示",
  "widget.config.showProgress": "プログレスバーを表示",
  "widget.config.showContext": "コンテキストウィンドウを表示",
  "widget.config.currency": "通貨記号",
  "widget.config.livePreview": "ライブプレビュー",
  "widget.config.hintNav": "← → タブ切替    ESC 終了",
  "widget.config.hintEdit": "/budget widget で対話的に編集",
  "widget.config.mode": "表示モード",
  "widget.config.modeFull": "フル",
  "widget.config.modeCustom": "カスタム",
  "widget.config.modeDescription": "• {compact}: コストのみ 1行。\n• {full}: モデル + プログレスバー + コンテキストウィンドウ。\n• {custom}: 各項目を個別に切替。",
  "widget.config.placementDescription": "Widget を表示する位置。推奨: 入力欄の下（コードを隠さない）。",
  "widget.config.currencyDescription": "コストの前に付く記号。表示のみ（pi は内部的に USD 使用）。\nプレビュー: {sym}0.42",
  "widget.config.showModelDescription": "Widget に現在の AI モデル名を表示。\nプレビュー: {on}",
  "widget.config.showProgressDescription": "Widget に █ と ░ で予算バーを表示。色変化: 緑→シアン→オレンジ→赤。\nプレビュー: {on}",
  "widget.config.showContextDescription": "コンテキストウィンドウの使用状況を表示。\nプレビュー: │ 28K/200K (14%)",
  "value.on": "オン",
  "value.off": "オフ",
  "settingsList.empty": "設定項目はありません",
  "settingsList.hint": "↑↓ 選択 · Enter/Space 変更 · ESC 終了",
  "settingsList.position": "{current}/{total}",

  "alert.softLimit.title": "⚠️ ソフトリミット到達",
  "alert.softLimit.message": "使用量 {used} / {budget}（{pct}%）\n予算上限に近づいています。",
  "alert.softLimit.raiseBudget": "予算を上げる",
  "alert.softLimit.continue": "続行",
  "alert.softLimit.endSession": "セッション終了",
  "alert.hardLimit.title": "🛑 ハードリミット到達",
  "alert.hardLimit.message": "予算を使い切りました: {used} / {budget}\n以降のリクエストはブロックされます。",
  "alert.hardLimit.raiseBudget": "予算を上げる",
  "alert.hardLimit.cancel": "キャンセル",
  "alert.newBudget.title": "新しい予算額",
  "alert.newBudget.message": "新しい予算額を入力してください（{currency}）:",
  "alert.newBudget.cancel": "キャンセル",

  "export.title": "データエクスポート",
  "export.generating": "エクスポートファイルを生成中...",
  "export.savedTo": "エクスポート先: {path}",
  "export.error": "エクスポート失敗",
  "export.unsupported": "未対応の形式: {format}",
  "export.usage": "使い方: /budget export [csv|json]",
  "cmd.budget.description": "AI コスト予算管理: /budget | /budget set <金額> | /budget report [範囲] | /budget by <次元>",
  "cmd.unknownSub": "不明なサブコマンド: {sub}\n対応: widget / set / unset / report / by / config / export",
  "cmd.byUsage": "使い方: /budget by <model|tool|session> [today|week|month|all]",
  "error.sliceFailed": "スライス生成に失敗",
  "error.settingsFailed": "設定エラー",
  "error.rangeInvalid": "無効な範囲",

  "log.costMissing": "usage.cost.total が見つかりません（model={model}）",
  "log.messageEndError": "message_end 処理エラー",
  "log.sessionStartError": "session_start 処理エラー",
  "log.modelSelectError": "model_select 処理エラー",
  "log.hardLimitError": "ハードリミットポップアップエラー",
  "log.softLimitError": "ソフトリミットポップアップエラー",
  "log.configLoadError": "loadConfig 失敗、デフォルト値を使用",
  "fx.mode": "為替モード",
  "fx.mode.description": "毎日自動更新または固定。/budget fx fixed <レート> で設定。",
  "fx.fixed": "固定",
  "fx.auto": "自動",
  "fx.rate": "USD/CNY レート",
  "fx.rate.description": "設定: /budget fx fixed 7.1。自動に戻す: /budget fx auto。",
  "fx.status": "為替状態",
  "fx.failure": "更新失敗。前回のレートまたは内蔵値を使用。/budget fx refresh で再試行。",
  "fx.source.description": "Frankfurter の日次参考レート。決済レートではありません。未取得時は内蔵値。",
  "fx.failed": "更新失敗",
  "fx.cached": "Frankfurter（保存済み）",
  "fx.builtin": "内蔵参考値",
  "fx.ready": "更新可能",
  "fx.updated": "為替を更新しました。",
  "fx.usage": "使い方: /budget fx [auto | fixed <CNY/USD> | refresh]。有限の正数を入力。",
  "fx.offline": "オフライン: 保存済みレートまたは内蔵値を使用。",
  "fx.refreshing": "為替を更新中…",
  "fx.fixedRefresh": "固定モードです。/budget fx auto で自動更新を有効に。",
};

const ko: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "개요",
  "dashboard.tab.report": "리포트",
  "dashboard.tab.appearance": "표시",
  "dashboard.tab.settings": "설정",
  "dashboard.hint": "← → 탭 전환    ESC 종료",
  "dashboard.tab.budget": "예산",
  "dashboard.tab.pricing": "가격표",
  "dashboard.hint.overview": "← → 탭 전환    ESC 종료",
  "dashboard.hint.interactive": "← → 탭 전환    ↑↓ 선택    Enter 변경    ESC 종료",
  "dashboard.truncated": "... (총 {total}줄, 잘림)",

  "overview.session": "会话",
  "overview.model": "模型",
  "overview.last": "上次请求",
  "overview.status": "状态",
  "overview.noBudget": "예산 없음",
  "overview.hintSetBudget": "예산이 없으면 ‘예산’ 탭에서 바로 설정할 수 있습니다.",
  "overview.estRemaining": "약 {count}회 유사 요청 가능",
  "overview.statusOk": "정상",
  "status.ok": "정상",
  "status.soft": "예산 근접",
  "status.hard": "한도 도달",
  "overview.sessionCost": "세션 비용",
  "overview.sessionContext": "세션 컨텍스트",
  "overview.modelContext": "모델 컨텍스트",
  "overview.contextUnavailable": "가져올 수 없음",
  "overview.contextPercent": "{pct}% 사용",
  "overview.inputTokens": "입력 {count}",
  "overview.outputTokens": "출력 {count}",
  "budget.sessionBudget": "세션 예산",
  "budget.sessionBudget.description": "이 세션의 예산을 설정합니다. 프리셋은 현재 표시 통화({currency})를 따릅니다.",
  "budget.clearSession": "세션 예산 해제",
  "budget.clearSession.description": "현재 세션 예산을 제거합니다. 비용 기록은 계속되지만 제한은 적용되지 않습니다.",
  "budget.value.unset": "미설정",
  "budget.action.ready": "대기",
  "budget.action.clear": "해제",
  "pricing.anchor": "가격 기준",
  "pricing.anchor.followModel": "모델 따름",
  "pricing.anchor.cny": "CNY 통일",
  "pricing.anchor.usd": "USD 통일",
  "pricing.anchor.description": "모델 따름은 중국 모델은 CNY, 해외 모델은 USD로 표시합니다. 통일 모드는 표시 통화를 고정합니다.",
  "pricing.currentModel": "현재 모델",
  "pricing.currentModel.description": "현재 세션에서 감지한 모델명입니다.",
  "pricing.provider": "제공사",
  "pricing.provider.description": "모델명에서 추정한 제공사입니다.",
  "pricing.provider.unknown": "알 수 없는 제공사",
  "pricing.nativeCurrency": "원래 과금 통화",
  "pricing.nativeCurrency.description": "모델 제공사의 원래 청구 통화입니다.",
  "pricing.displayCurrency": "표시 통화",
  "pricing.displayCurrency.description": "TUI와 Widget에서 표시할 통화입니다.",
  "pricing.currency.cny": "CNY / ¥",
  "pricing.currency.usd": "USD / $",
  "pricing.priceDate": "가격표 날짜",
  "pricing.priceDate.description": "이 확장에 내장된 가격표 날짜입니다.",
  "pricing.fxDate": "환율 날짜",
  "pricing.fxDate.description": "참고 환율 데이터의 실제 날짜. 고정 환율에는 없습니다.",
  "pricing.fxDate.notNeeded": "고정 환율",
  "pricing.updateToday": "환율 업데이트",
  "pricing.updateToday.description": "최신 USD/CNY 참고 환율을 가져옵니다. 모델 가격은 변경하지 않습니다.",
  "pricing.status.latest": "최신",
  "pricing.action.update": "업데이트",

  "report.title": "예산 리포트",
  "report.col.model": "모델",
  "report.col.tool": "도구",
  "report.col.session": "세션",
  "report.col.usd": "USD",
  "report.col.requests": "요청 수",
  "report.col.pct": "비율",
  "report.summary": "요약",
  "report.noData": "해당 기간 데이터 없음",
  "report.generationFailed": "리포트 생성 실패",
  "report.range.today": "오늘",
  "report.range.week": "이번 주",
  "report.range.month": "이번 달",
  "report.range.all": "전체 기간",
  "report.header.total": "합계",
  "report.header.sessions": "세션",
  "report.header.requests": "요청",
  "report.header.avgPerSession": "평균/세션",
  "report.byModel": "모델별",
  "report.byTool": "도구별",
  "report.byDim": "{dim}별",
  "report.unknown": "(알 수 없음)",
  "report.noTool": "(도구 없음)",
  "report.unknownRange": "알 수 없는 범위: {arg}. 지원: today/week/month/all",
  "report.byUsage": "사용법: /budget by <model|tool|session> [today|week|month|all]",

  "set.scope.session": "세션",
  "set.scope.project": "프로젝트",
  "set.scope.global": "글로벌",
  "set.budgetSet": "{scope} 예산 설정됨 = {amount}",
  "set.budgetCleared": "{scope} 예산 해제됨",
  "set.budgetClearedAll": "모든 예산 해제됨",
  "set.usage": "사용법 (금액 단위: USD):\n  /budget set <금액>\n  /budget set project <금액>\n  /budget set global <금액>",
  "set.raisedTo": "예산이 {amount}로 인상됨",
  "set.sessionEnded": "세션 종료됨 (사용자 종료)",
  "set.continued": "계속 진행 (하드 리밋에서 다시 차단)",
  "set.hardLimitBlocked": "하드 리밋 도달 — 메시지 전송 안 됨 (/budget set으로 예산 인상 가능)",

  "config.title": "예산 설정",
  "config.softLimitBehavior": "소프트 리밋 동작",
  "config.softLimitThreshold": "소프트 리밋 임계값",
  "config.hardLimitBehavior": "하드 리밋 동작",
  "config.projectId": "프로젝트 ID",
  "config.custom": "사용자 정의",
  "config.auto": "자동 (git remote)",
  "config.debugLog": "디버그 로그",
  "config.locale": "언어",
  "config.settingsError": "설정 오류",
  "config.widgetSummary.onSoftLimit.notify": "알림",
  "config.widgetSummary.onSoftLimit.pause": "팝업",
  "config.widgetSummary.onSoftLimit.downgrade": "다운그레이드",
  "config.widgetSummary.onHardLimit.pause": "팝업",
  "config.widgetSummary.onHardLimit.terminate": "종료",
  "config.widgetSummary.projectId.override": "사용자 정의",
  "config.widgetSummary.projectId.auto": "자동 (git remote)",
  "config.widgetSummary.debug.on": "켜짐",
  "config.widgetSummary.debug.off": "꺼짐",
  "config.softLimit.description": "예산의 {pct}%에서 트리거.\n{notify}: 알림만.\n{pause}: 선택 팝업.",
  "config.softLimitRatio.description": "경고를 낼 예산 소비 비율.",
  "config.hardLimit.description": "예산 100%에서 트리거.\n{pause}: 선택 팝업.\n{terminate}: 새 메시지 즉시 거부.",
  "config.debug.description": " ~/.pi/logs/에 상세 로그를 기록합니다. 일반 사용시 불필요.",
  "config.locale.description": "표시 언어를 변경합니다. 설정에 저장됩니다.",

  "widget.placement.aboveEditor": "에디터 위",
  "widget.placement.belowEditor": "입력창 아래",
  "widget.config.title": "Widget 표시 설정",
  "widget.config.placement": "표시 위치",
  "widget.config.compact": "컴팩트 모드",
  "widget.config.showModel": "모델명 표시",
  "widget.config.showProgress": "진행률 표시",
  "widget.config.showContext": "컨텍스트 창 표시",
  "widget.config.currency": "통화 기호",
  "widget.config.livePreview": "실시간 미리보기",
  "widget.config.hintNav": "← → 탭 전환    ESC 종료",
  "widget.config.hintEdit": "/budget widget으로 대화식 편집",
  "widget.config.mode": "표시 모드",
  "widget.config.modeFull": "풀",
  "widget.config.modeCustom": "사용자 정의",
  "widget.config.modeDescription": "• {compact}: 비용만 한 줄.\n• {full}: 모델 + 진행률 + 컨텍스트 창.\n• {custom}: 아래 항목을 개별적으로 토글.",
  "widget.config.placementDescription": "Widget 표시 위치. 추천: 입력창 아래 (코드 가리지 않음).",
  "widget.config.currencyDescription": "비용 앞에 붙는 기호. 표시 전용 (pi는 내부적으로 USD 사용).\n미리보기: {sym}0.42",
  "widget.config.showModelDescription": "현재 AI 모델명을 Widget에 표시.\n미리보기: {on}",
  "widget.config.showProgressDescription": "Widget에 █, ░로 예산 진행률 표시. 색 변화: 녹→시안→주→적.\n미리보기: {on}",
  "widget.config.showContextDescription": "컨텍스트 창 사용량 표시.\n미리보기: │ 28K/200K (14%)",
  "value.on": "켬",
  "value.off": "끔",
  "settingsList.empty": "설정 항목 없음",
  "settingsList.hint": "↑↓ 선택 · Enter/Space 변경 · ESC 종료",
  "settingsList.position": "{current}/{total}",

  "alert.softLimit.title": "⚠️ 소프트 리밋 도달",
  "alert.softLimit.message": "사용량 {used} / {budget} ({pct}%)\n예산 한도에 근접했습니다.",
  "alert.softLimit.raiseBudget": "예산 인상",
  "alert.softLimit.continue": "계속",
  "alert.softLimit.endSession": "세션 종료",
  "alert.hardLimit.title": "🛑 하드 리밋 도달",
  "alert.hardLimit.message": "예산 소진: {used} / {budget}\n이후 요청은 차단됩니다.",
  "alert.hardLimit.raiseBudget": "예산 인상",
  "alert.hardLimit.cancel": "취소",
  "alert.newBudget.title": "새 예산 금액",
  "alert.newBudget.message": "새 예산 금액을 입력하세요 ({currency}):",
  "alert.newBudget.cancel": "취소",

  "export.title": "데이터 내보내기",
  "export.generating": "내보내기 파일 생성 중...",
  "export.savedTo": "내보내기 위치: {path}",
  "export.error": "내보내기 실패",
  "export.unsupported": "지원하지 않는 형식: {format}",
  "export.usage": "사용법: /budget export [csv|json]",
  "cmd.budget.description": "AI 비용 예산 관리: /budget | /budget set <금액> | /budget report [범위] | /budget by <차원>",
  "cmd.unknownSub": "알 수 없는 하위 명령: {sub}\n지원: widget / set / unset / report / by / config / export",
  "cmd.byUsage": "사용법: /budget by <model|tool|session> [today|week|month|all]",
  "error.sliceFailed": "슬라이스 생성 실패",
  "error.settingsFailed": "설정 오류",
  "error.rangeInvalid": "잘못된 범위",

  "log.costMissing": "usage.cost.total 누락, 기록 건너뜀 (model={model})",
  "log.messageEndError": "message_end 처리 오류",
  "log.sessionStartError": "session_start 처리 오류",
  "log.modelSelectError": "model_select 처리 오류",
  "log.hardLimitError": "하드 리밋 팝업 오류",
  "log.softLimitError": "소프트 리밋 팝업 오류",
  "log.configLoadError": "loadConfig 실패, 기본값 사용",
  "fx.mode": "환율 모드",
  "fx.mode.description": "매일 자동 업데이트 또는 고정. /budget fx fixed <환율>로 설정.",
  "fx.fixed": "고정",
  "fx.auto": "자동",
  "fx.rate": "USD/CNY 환율",
  "fx.rate.description": "설정: /budget fx fixed 7.1. 자동 복귀: /budget fx auto.",
  "fx.status": "환율 상태",
  "fx.failure": "업데이트 실패. 이전 환율 또는 내장 값을 유지합니다. /budget fx refresh로 재시도.",
  "fx.source.description": "Frankfurter 일별 참고 환율이며 결제 환율이 아닙니다. 캐시가 없으면 내장 값을 사용합니다.",
  "fx.failed": "업데이트 실패",
  "fx.cached": "Frankfurter (캐시)",
  "fx.builtin": "내장 참고값",
  "fx.ready": "업데이트 가능",
  "fx.updated": "환율이 업데이트되었습니다.",
  "fx.usage": "사용법: /budget fx [auto | fixed <CNY/USD> | refresh]. 유한한 양수를 입력하세요.",
  "fx.offline": "오프라인: 저장된 환율 또는 내장 값을 사용합니다.",
  "fx.refreshing": "환율 업데이트 중…",
  "fx.fixedRefresh": "고정 모드입니다. /budget fx auto로 온라인 업데이트를 켜세요.",
};

/** 所有翻译数据 */
const LOCALE_DATA: Record<Locale, Translations> = {
  en,
  "zh-CN": zhCN,
  ja,
  ko,
};

export {
  en,
  zhCN,
  ja,
  ko,
  LOCALE_DATA,
};
