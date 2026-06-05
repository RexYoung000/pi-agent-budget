/**
 * /budget config 命令 — TUI 配置面板
 *
 * 用法：/budget config
 * 用 SettingsList 组件替代原来逐级对话框，方向键导航、Enter 切换、实时生效。
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { SettingsList, type SettingItem, type SettingsListTheme } from "@earendil-works/pi-tui";

import type { BudgetConfig, WidgetConfig } from "../config.js";
import {
  DEFAULT_WIDGET_CONFIG,
  saveConfig,
  DEFAULT_CONFIG,
} from "../config.js";

// ──────────────────────────────────────────────────────────────────
// 值映射（display ← → code）
// ──────────────────────────────────────────────────────────────────

const PLACEMENT_MAP: Record<string, string> = {
  "输入框下方": "belowEditor",
  "编辑器上方": "aboveEditor",
};
const PLACEMENT_REV: Record<string, string> = { belowEditor: "输入框下方", aboveEditor: "编辑器上方" };

const MODE_MAP: Record<string, boolean> = { "标准": false, "极简": true };
const MODE_REV = (c: boolean) => (c ? "极简" : "标准");

const ONOFF: Record<string, boolean> = { "显示": true, "开启": true, "隐藏": false, "关闭": false };
const ONOFF_REV = (v: boolean) => (v ? "显示" : "隐藏");

const CURRENCY_VALUES = ["$", "US$", "¥", "€", "£"];
const SOFT_LIMIT_MAP: Record<string, string> = { "通知": "notify", "弹窗": "pause" };
const SOFT_LIMIT_REV: Record<string, string> = { notify: "通知", pause: "弹窗" };
const HARD_LIMIT_MAP: Record<string, string> = { "弹窗": "pause", "终止": "abort" };
const HARD_LIMIT_REV: Record<string, string> = { pause: "弹窗", abort: "终止" };
const RATIO_VALUES = ["70%", "80%", "90%"];

function ratioToLabel(r: number): string {
  return `${Math.round(r * 100)}%`;
}
function labelToRatio(label: string): number {
  return Number(label.replace("%", "")) / 100;
}

// ──────────────────────────────────────────────────────────────────
// 构建 SettingItem 列表
// ──────────────────────────────────────────────────────────────────

function buildItems(config: BudgetConfig): SettingItem[] {
  const wc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(config.widget ?? {}) };

  return [
    {
      id: "placement",
      label: "Widget 位置",
      description: "Widget 显示在编辑器上方还是输入框下方",
      currentValue: PLACEMENT_REV[wc.placement ?? "belowEditor"] ?? "输入框下方",
      values: ["输入框下方", "编辑器上方"],
    },
    {
      id: "compact",
      label: "显示模式",
      description: "标准：模型名 + 成本 + 进度条 + 上下文。极简：只显示成本",
      currentValue: MODE_REV(wc.compact ?? false),
      values: ["标准", "极简"],
    },
    {
      id: "showModel",
      label: "显示模型名",
      description: "Widget 里是否显示当前 AI 模型名称",
      currentValue: ONOFF_REV(wc.showModel !== false),
      values: ["显示", "隐藏"],
    },
    {
      id: "showProgressBar",
      label: "显示进度条",
      description: "Widget 里是否显示成本消耗进度条",
      currentValue: ONOFF_REV(wc.showProgressBar !== false),
      values: ["显示", "隐藏"],
    },
    {
      id: "showContextWindow",
      label: "显示上下文窗口",
      description: "Widget 第二行显示上下文 token 使用量（📊 28K/200K 14%）",
      currentValue: ONOFF_REV(wc.showContextWindow !== false),
      values: ["显示", "隐藏"],
    },
    {
      id: "currencySymbol",
      label: "货币符号",
      description: "成本展示前缀（仅显示，不做汇率换算）",
      currentValue: wc.currencySymbol ?? "$",
      values: CURRENCY_VALUES,
    },
    {
      id: "softLimit",
      label: "软限行为",
      description: "达到预算 80% 时的反应：通知提醒 或 弹窗让用户选择",
      currentValue: SOFT_LIMIT_REV[config.onSoftLimit] ?? "通知",
      values: ["通知", "弹窗"],
    },
    {
      id: "softLimitRatio",
      label: "软限触发阈值",
      description: "达到预算多少百分比时触发软限",
      currentValue: ratioToLabel(config.softLimitRatio),
      values: RATIO_VALUES,
    },
    {
      id: "hardLimit",
      label: "硬限行为",
      description: "达到预算 100% 时的反应：弹窗让用户选 或 直接拒绝新消息",
      currentValue: HARD_LIMIT_REV[config.onHardLimit] ?? "弹窗",
      values: ["弹窗", "终止"],
    },
    {
      id: "debug",
      label: "调试日志",
      description: "开启后写入 ~/.pi/logs/budget.log",
      currentValue: ONOFF_REV(!!config.debug),
      values: ["关闭", "开启"],
    },
  ];
}

// ──────────────────────────────────────────────────────────────────
// 应用变更
// ──────────────────────────────────────────────────────────────────

function applyChange(config: BudgetConfig, id: string, displayValue: string): BudgetConfig {
  const next = JSON.parse(JSON.stringify(config)) as BudgetConfig;
  const wc = { ...DEFAULT_WIDGET_CONFIG, ...(next.widget ?? {}) };

  const onoff = (v: string) => ONOFF[v] ?? false;

  switch (id) {
    case "placement":     wc.placement = PLACEMENT_MAP[displayValue] as "belowEditor" | "aboveEditor"; break;
    case "compact":       wc.compact = MODE_MAP[displayValue] as boolean; break;
    case "showModel":     wc.showModel = onoff(displayValue); break;
    case "showProgressBar": wc.showProgressBar = onoff(displayValue); break;
    case "showContextWindow": wc.showContextWindow = onoff(displayValue); break;
    case "currencySymbol": wc.currencySymbol = displayValue; break;
    case "softLimit":     next.onSoftLimit = SOFT_LIMIT_MAP[displayValue] as BudgetConfig["onSoftLimit"]; break;
    case "softLimitRatio": next.softLimitRatio = labelToRatio(displayValue); break;
    case "hardLimit":     next.onHardLimit = HARD_LIMIT_MAP[displayValue] as BudgetConfig["onHardLimit"]; break;
    case "debug":         next.debug = onoff(displayValue); break;
  }

  next.widget = wc;
  return next;
}

// ──────────────────────────────────────────────────────────────────
// 入口：打开 TUI 配置面板
// ──────────────────────────────────────────────────────────────────

export async function openConfigTUI(
  config: BudgetConfig,
  ui: ExtensionUIContext,
): Promise<BudgetConfig> {
  // 默认用 pi 内置主题样式
  const stheme = await importSettingsListTheme();

  const result = await ui.custom<BudgetConfig>((tui, theme, keybindings, done) => {
    let current = JSON.parse(JSON.stringify(config)) as BudgetConfig;

    const items = buildItems(current);

    const list = new SettingsList(
      items,
      12,                   // maxVisible
      stheme,               // 用 pi 内置主题
      (id, newValue) => {
        // 每次切换立刻更新
        current = applyChange(current, id, newValue);
        saveConfig(current);

        // 同步刷新 list 中的显示值
        if (id.startsWith("show") || id === "compact" || id === "placement" || id === "currencySymbol") {
          list.updateValue(id, newValue);
        } else {
          list.updateValue(id, newValue);
        }
        // 如果 compact 变了，关联显隐其他项
        if (id === "compact") {
          const compact = newValue === "极简";
          for (const sub of ["showModel", "showProgressBar", "showContextWindow"]) {
            list.updateValue(sub, compact ? "隐藏" : "显示");
          }
        }
      },
      () => {
        // ESC / cancel → 提交当前 config
        done(current);
      },
    );

    return list;
  });

  return result ?? config;
}

async function importSettingsListTheme(): Promise<SettingsListTheme> {
  try {
    // pi 提供了标准 SettingsList 主题，自动跟随当前终端主题
    const mod = await import("@earendil-works/pi-coding-agent");
    return mod.getSettingsListTheme();
  } catch {
    // 回退：简单字符串染色
    return {
      label: (text: string, _selected: boolean) => text,
      value: (text: string, _selected: boolean) => text,
      description: (text: string) => `  ${text}`,
      cursor: "› ",
      hint: (text: string) => `── ${text} ──`,
    };
  }
}
