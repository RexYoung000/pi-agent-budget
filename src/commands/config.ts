/**
 * /budget config 命令 — TUI 配置界面
 *
 * 用法：/budget config
 * 用 ctx.ui.select 逐级交互，让用户调整 widget 外观 & 预算行为。
 */

import type { ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";

import type { BudgetConfig, WidgetConfig } from "../config.js";
import { DEFAULT_WIDGET_CONFIG, saveConfig } from "../config.js";

type NotifyUi = Pick<ExtensionUIContext, "select" | "notify" | "confirm">;

/**
 * 打开配置器主菜单 → 逐级引导。
 * 返回更新后的 config。
 */
export async function openConfig(
  config: BudgetConfig,
  ui: NotifyUi,
): Promise<BudgetConfig> {
  const mainChoice = await ui.select("⚙️ pi-budget 设置", [
    "Widget 外观",
    "Widget 内容",
    "软限 / 硬限",
    "恢复默认",
  ]);

  switch (mainChoice) {
    case "Widget 外观":
      return configureWidgetAppearance(config, ui);
    case "Widget 内容":
      return configureWidgetContent(config, ui);
    case "软限 / 硬限":
      return configureLimits(config, ui);
    case "恢复默认":
      return resetConfig(config, ui);
    default:
      return config; // 取消
  }
}

async function configureWidgetAppearance(
  config: BudgetConfig,
  ui: NotifyUi,
): Promise<BudgetConfig> {
  const wc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(config.widget ?? {}) };

  const placement = await ui.select("Widget 位置", ["编辑器上方", "输入框下方"]);
  if (placement) {
    wc.placement = placement === "输入框下方" ? "belowEditor" : "aboveEditor";
  }

  const compact = await ui.select("显示模式", ["标准（模型 + 成本 + 进度条）", "极简（只显示成本）"]);
  if (compact) {
    wc.compact = compact === "极简（只显示成本）";
  }

  const symbol = await ui.select("货币符号", ["$", "US$", "¥", "€", "£"]);
  if (symbol) wc.currencySymbol = symbol;

  return saveWidgetConfig(config, wc, ui);
}

async function configureWidgetContent(
  config: BudgetConfig,
  ui: NotifyUi,
): Promise<BudgetConfig> {
  const wc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(config.widget ?? {}) };

  const showModel = await ui.select("显示当前模型名", ["显示", "隐藏"]);
  if (showModel) wc.showModel = showModel === "显示";

  const showBar = await ui.select("显示进度条", ["显示", "隐藏"]);
  if (showBar) wc.showProgressBar = showBar === "显示";

  const showCtx = await ui.select("显示上下文窗口用量", ["显示", "隐藏"]);
  if (showCtx) wc.showContextWindow = showCtx === "显示";

  return saveWidgetConfig(config, wc, ui);
}

async function configureLimits(
  config: BudgetConfig,
  ui: NotifyUi,
): Promise<BudgetConfig> {
  const next = { ...config };

  const softChoice = await ui.select("软限行为（达到 80% 时）", [
    "通知提醒",
    "弹窗让用户选",
    "自动降级（v2 实现）",
  ]);
  if (softChoice === "通知提醒") next.onSoftLimit = "notify";
  else if (softChoice === "弹窗让用户选") next.onSoftLimit = "pause";
  else if (softChoice === "自动降级（v2 实现）") next.onSoftLimit = "downgrade";

  const hardChoice = await ui.select("硬限行为（达到 100% 时）", [
    "弹窗让用户选",
    "直接终止",
  ]);
  if (hardChoice === "弹窗让用户选") next.onHardLimit = "pause";
  else if (hardChoice === "直接终止") next.onHardLimit = "abort";

  const softRatio = await ui.select("软限触发阈值", ["70%", "80%", "90%"]);
  if (softRatio) {
    next.softLimitRatio = Number(softRatio.replace("%", "")) / 100;
  }

  saveConfig(next);
  ui.notify("软/硬限配置已更新", "info");
  return next;
}

async function resetConfig(
  config: BudgetConfig,
  ui: NotifyUi,
): Promise<BudgetConfig> {
  const ok = await ui.confirm(
    "恢复默认配置",
    "将恢复所有 widget 外观、内容和限值设置为默认值。确定？",
  );
  if (!ok) return config;

  // 保留 session/project/global 预算和 projectId（用户数据）
  const next: BudgetConfig = {
    onSoftLimit: "notify",
    onHardLimit: "pause",
    softLimitRatio: 0.8,
    hardLimitRatio: 1.0,
    widget: { ...DEFAULT_WIDGET_CONFIG },
    session: config.session,
    project: config.project,
    global: config.global,
    projectIdOverride: config.projectIdOverride,
    debug: false,
  };

  saveConfig(next);
  ui.notify("已恢复默认配置，预算保留未动", "info");
  return next;
}

function saveWidgetConfig(
  config: BudgetConfig,
  wc: WidgetConfig,
  ui: NotifyUi,
): BudgetConfig {
  const next = { ...config, widget: wc };
  saveConfig(next);
  ui.notify("Widget 配置已更新（用 /reload 重新加载扩展立即生效）", "info");
  return next;
}
