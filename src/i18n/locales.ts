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
  "dashboard.hint": "← → switch tab    ESC exit    /budget widget edit appearance",
  "dashboard.truncated": "... (truncated from {total} lines)",

  "overview.session": "Session",
  "overview.model": "Model",
  "overview.last": "Last",
  "overview.status": "Status",
  "overview.noBudget": "no budget",
  "overview.hintSetBudget": 'Tip: use `/budget set <usd>` to set session budget',
  "overview.estRemaining": "~{count} more similar requests estimated",
  "overview.statusOk": "ok",

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
  "set.usage": 'Usage:\n  /budget set <amount>\n  /budget set project <amount>\n  /budget set global <amount>',
  "set.raisedTo": "Budget raised to {amount}",
  "set.sessionEnded": "Session ended (user terminated)",
  "set.continued": "Continuing, will block again at hard limit",
  "set.hardLimitBlocked": "Hard limit reached — message not sent (use /budget set to raise budget)",

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
  "widget.config.hintNav": "← → switch tab    ESC exit    /budget widget edit appearance",
  "widget.config.hintEdit": "/budget widget to edit interactively",
  "widget.config.mode": "Display mode",
  "widget.config.modeFull": "Full",
  "widget.config.modeCustom": "Custom",
  "widget.config.modeDescription": "• {compact}: cost only, one line.\n• {full}: model + progress bar + context window.\n• {custom}: toggle each item below.",
  "widget.config.placementDescription": "Where the widget appears. Recommended: below input (doesn’t obscure code).",
  "widget.config.currencyDescription": "Prefix before cost numbers. Cosmetic only (pi uses USD internally).\nPreview: {sym}0.42",
  "widget.config.showModelDescription": "Show current AI model name on widget.\nPreview: {on}",
  "widget.config.showProgressDescription": "Show budget bar with █ and ░. Color changes: green → cyan → orange → red.\nPreview: {on}",
  "widget.config.showContextDescription": "Show context window usage (tokens / limit + %).\nPreview: 📊 28K/200K (14%)",
  "value.on": "On",
  "value.off": "Off",

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
  "alert.newBudget.message": "Enter new budget amount in USD:",
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
};

const zhCN: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "概览",
  "dashboard.tab.report": "报表",
  "dashboard.tab.appearance": "外观",
  "dashboard.tab.settings": "设置",
  "dashboard.hint": "← → 切换标签    ESC 退出    /budget widget 编辑外观",
  "dashboard.truncated": "... (共 {total} 行，已截断)",

  "overview.session": "Session",
  "overview.model": "Model",
  "overview.last": "Last",
  "overview.status": "Status",
  "overview.noBudget": "无预算",
  "overview.hintSetBudget": "提示：用 `/budget set <usd>` 设置本会话预算",
  "overview.estRemaining": "预计还可发起 ~{count} 次类似请求",
  "overview.statusOk": "正常",

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
  "set.usage": "用法：\n  /budget set <金额>\n  /budget set project <金额>\n  /budget set global <金额>",
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
  "widget.config.showContextDescription": "打开后 Widget 显示当前会话的上下文使用情况。\n预览：📊 28K/200K (14%)",
  "value.on": "开启",
  "value.off": "关闭",

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
  "alert.newBudget.message": "请输入新预算金额（美元）：",
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
};

const ja: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "概要",
  "dashboard.tab.report": "レポート",
  "dashboard.tab.appearance": "表示",
  "dashboard.tab.settings": "設定",
  "dashboard.hint": "← → タブ切替    ESC 終了    /budget widget 表示編集",
  "dashboard.truncated": "... ({total}行中、切り捨て)",

  "overview.session": "Session",
  "overview.model": "Model",
  "overview.last": "Last",
  "overview.status": "Status",
  "overview.noBudget": "予算なし",
  "overview.hintSetBudget": "ヒント: `/budget set <usd>` でセッション予算を設定",
  "overview.estRemaining": "あと約{count}回の類似リクエストが可能",
  "overview.statusOk": "正常",

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
  "set.usage": "使い方:\n  /budget set <金額>\n  /budget set project <金額>\n  /budget set global <金額>",
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
  "widget.config.showContextDescription": "コンテキストウィンドウの使用状況を表示。\nプレビュー: 📊 28K/200K (14%)",
  "value.on": "オン",
  "value.off": "オフ",

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
  "alert.newBudget.message": "新しい予算額をUSDで入力してください:",
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
};

const ko: Translations = {
  "widget.prefix": "pi-budget",

  "dashboard.title": "pi-budget",
  "dashboard.tab.overview": "개요",
  "dashboard.tab.report": "리포트",
  "dashboard.tab.appearance": "표시",
  "dashboard.tab.settings": "설정",
  "dashboard.hint": "← → 탭 전환    ESC 종료    /budget widget 표시 편집",
  "dashboard.truncated": "... (총 {total}줄, 잘림)",

  "overview.session": "Session",
  "overview.model": "Model",
  "overview.last": "Last",
  "overview.status": "Status",
  "overview.noBudget": "예산 없음",
  "overview.hintSetBudget": "팁: `/budget set <usd>`로 세션 예산 설정",
  "overview.estRemaining": "약 {count}회 유사 요청 가능",
  "overview.statusOk": "정상",

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
  "set.usage": "사용법:\n  /budget set <금액>\n  /budget set project <금액>\n  /budget set global <금액>",
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
  "widget.config.showContextDescription": "컨텍스트 창 사용량 표시.\n미리보기: 📊 28K/200K (14%)",
  "value.on": "켬",
  "value.off": "끔",

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
  "alert.newBudget.message": "새 예산 금액을 USD로 입력하세요:",
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
