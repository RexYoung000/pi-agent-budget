/**
 * /budget widget / /budget config — TUI 设置面板
 *
 * 用法：
 *   /budget widget   → Widget 外观设置（推荐入口）
 *   /budget config   → 完整设置（含限值、调试等高级项）
 *
 * 特点：
 *   - 显示模式三档：极简 / 丰富 / 自定义
 *   - 每项有通俗中文说明 + 实时预览
 *   - 方向键导航、Enter 切换、ESC 退出提交
 *   - 切换立刻写入 ~/.pi/budget.json
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { SettingsList, type SettingItem, type SettingsListTheme } from "@earendil-works/pi-tui";

import type { BudgetConfig, WidgetConfig } from "../config.js";
import { DEFAULT_WIDGET_CONFIG, saveConfig, DEFAULT_CONFIG } from "../config.js";

// ═══════════════════════════════════════════════════════════════
// 值映射
// ═══════════════════════════════════════════════════════════════

const PLACEMENT_LABELS: Record<string, string> = {
  belowEditor: "输入框下方   ",
  aboveEditor: "编辑器上方",
};
const PLACEMENT_VALUES = ["输入框下方   ", "编辑器上方"];
const PLACEMENT_REV: Record<string, string> = { "输入框下方   ": "belowEditor", "编辑器上方": "aboveEditor" };

const MODE_VALUES = ["极简", "丰富", "自定义"];

const ONOFF_REV = (v: boolean) => (v ? "显示" : "隐藏");
const CURRENCY_VALUES = ["$", "US$", "¥", "€", "£"];

// ═══════════════════════════════════════════════════════════════
// 模式 → 预设
// ═══════════════════════════════════════════════════════════════

function applyMode(mode: string): Partial<WidgetConfig> {
  switch (mode) {
    case "极简":
      return { compact: true, showModel: false, showProgressBar: false, showContextWindow: false };
    case "丰富":
      return { compact: false, showModel: true, showProgressBar: true, showContextWindow: true };
    default: // 自定义
      return {};
  }
}

/** 根据当前 config 反推当前模式（用于初始渲染）。 */
function currentMode(wc: WidgetConfig): string {
  const c = wc.compact ?? false;
  const sm = wc.showModel !== false;
  const sb = wc.showProgressBar !== false;
  const sc = wc.showContextWindow !== false;
  if (!c && sm && sb && sc) return "丰富";
  if (c && !sm && !sb && !sc) return "极简";
  return "自定义";
}

// ═══════════════════════════════════════════════════════════════
// 预览文本生成
// ═══════════════════════════════════════════════════════════════

function previewWidget(wc: WidgetConfig, sym: string): string {
  const modelName = wc.showModel !== false ? "sonnet" : "";
  const cost = `${sym}0.42/${sym}1.00`;
  const bar = wc.showProgressBar !== false ? " ████░░░░░░" : "";

  let preview = "🟢 ";
  if (modelName) preview += `${modelName} │ `;
  preview += cost + bar;

  if (wc.showContextWindow !== false) {
    preview += "\n   📊 28K/200K (14%)";
  }

  return preview;
}

// ═══════════════════════════════════════════════════════════════
// 构建 SettingItem 列表
// ═══════════════════════════════════════════════════════════════

function buildWidgetItems(config: BudgetConfig): SettingItem[] {
  const wc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(config.widget ?? {}) };
  const mode = currentMode(wc);
  const sym = wc.currencySymbol ?? "$";

  return [
    {
      id: "mode",
      label: "显示模式",
      description: [
        `当前预览：`,
        `  ${previewWidget(wc, sym).split("\n").join("\n  ")}`,
        "",
        "「极简」只显示一行成本数字。",
        "「丰富」显示模型名 + 进度条 + 上下文窗口。",
        "「自定义」自由开关下面每一项。",
      ].join("\n"),
      currentValue: mode,
      values: MODE_VALUES,
    },
    {
      id: "placement",
      label: "Widget 显示在哪",
      description: "选择 Widget 出现在编辑器上方还是输入框下面。推荐放在输入框下面，不遮挡代码。",
      currentValue: (PLACEMENT_LABELS[wc.placement ?? "belowEditor"] ?? "输入框下方   ") as string,
      values: PLACEMENT_VALUES,
    },
    {
      id: "currencySymbol",
      label: "货币符号",
      description: `成本数字前面的符号。只是显示样式，不做汇率换算（pi 内部统一用 USD 计价）。\n预览：${sym}0.42`,
      currentValue: sym,
      values: CURRENCY_VALUES,
    },
    {
      id: "showModel",
      label: "显示当前模型名",
      description: `打开后 Widget 第一行会显示当前使用的 AI 模型（如 claude-sonnet-4.5）。\n预览：${wc.showModel !== false ? "sonnet │ $0.42/$1.00" : "$0.42/$1.00"}`,
      currentValue: ONOFF_REV(wc.showModel !== false),
      values: ["显示", "隐藏"],
    },
    {
      id: "showProgressBar",
      label: "显示预算进度条",
      description: `打开后 Widget 用 █ 和 ░ 直观展示预算消耗进度。颜色随消耗自动变化：绿→青→橙→红。\n预览：${wc.showProgressBar !== false ? "$0.42/$1.00 ████░░░░░░" : "$0.42/$1.00"}`,
      currentValue: ONOFF_REV(wc.showProgressBar !== false),
      values: ["显示", "隐藏"],
    },
    {
      id: "showContextWindow",
      label: "显示上下文窗口用量",
      description: `打开后 Widget 第二行显示当前会话的上下文使用情况。数据自动从当前模型读取，不写死。\n预览：📊 28K/200K (14%)`,
      currentValue: ONOFF_REV(wc.showContextWindow !== false),
      values: ["显示", "隐藏"],
    },
  ];
}

function buildAllItems(config: BudgetConfig): SettingItem[] {
  const widgetItems = buildWidgetItems(config);

  return [
    // 第一节：Widget
    ...widgetItems,
    // 第二节：限值行为
    {
      id: "softLimit",
      label: "━━ 预算警告（软限）",
      description: `达到预算的 ${Math.round(config.softLimitRatio * 100)}% 时触发。\n「通知」只在状态栏提示。「弹窗」跳出选项让你选择继续/调高/结束。`,
      currentValue: config.onSoftLimit === "notify" ? "仅通知" : "弹窗询问",
      values: ["仅通知", "弹窗询问"],
    },
    {
      id: "softLimitRatio",
      label: "  警告触发阈值",
      description: "预算消耗到多少百分比时警告你。",
      currentValue: `${Math.round(config.softLimitRatio * 100)}%`,
      values: ["70%", "80%", "90%"],
    },
    {
      id: "hardLimit",
      label: "━━ 强制限额（硬限）",
      description: `达到预算 100% 时触发。\n「弹窗」跳出选项让你选择放行/结束。「终止」直接拒绝发送新消息到 AI。`,
      currentValue: config.onHardLimit === "pause" ? "弹窗询问" : "直接终止",
      values: ["弹窗询问", "直接终止"],
    },
    {
      id: "debug",
      label: "调试日志",
      description: "开启后会在 ~/.pi/logs/ 下记录详细运行日志。正常使用无需开启。",
      currentValue: config.debug ? "开启" : "关闭",
      values: ["关闭", "开启"],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// 变更应用
// ═══════════════════════════════════════════════════════════════

function applyChange(config: BudgetConfig, id: string, displayValue: string): BudgetConfig {
  const next = JSON.parse(JSON.stringify(config)) as BudgetConfig;
  const wc = { ...DEFAULT_WIDGET_CONFIG, ...(next.widget ?? {}) };

  switch (id) {
    case "mode": {
      const patch = applyMode(displayValue);
      Object.assign(wc, patch);
      break;
    }
    case "placement":
      wc.placement = PLACEMENT_REV[displayValue] as "belowEditor" | "aboveEditor";
      break;
    case "currencySymbol":
      wc.currencySymbol = displayValue;
      break;
    case "showModel":
      wc.showModel = displayValue === "显示";
      break;
    case "showProgressBar":
      wc.showProgressBar = displayValue === "显示";
      break;
    case "showContextWindow":
      wc.showContextWindow = displayValue === "显示";
      break;
    case "softLimit":
      next.onSoftLimit = displayValue === "弹窗询问" ? "pause" : "notify";
      break;
    case "softLimitRatio":
      next.softLimitRatio = Number(displayValue.replace("%", "")) / 100;
      break;
    case "hardLimit":
      next.onHardLimit = displayValue === "直接终止" ? "abort" : "pause";
      break;
    case "debug":
      next.debug = displayValue === "开启";
      break;
  }

  next.widget = wc;
  return next;
}

// ═══════════════════════════════════════════════════════════════
// 公共入口：打开 TUI 面板
// ═══════════════════════════════════════════════════════════════

async function openSettingsPanel(
  title: string,
  items: SettingItem[],
  initialConfig: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
): Promise<BudgetConfig> {
  const stheme = await getSettingsTheme();

  return (await ui.custom<BudgetConfig>((_tui, _theme, _kb, done) => {
    let current = JSON.parse(JSON.stringify(initialConfig)) as BudgetConfig;

    const list = new SettingsList(
      items,
      12,
      stheme,
      (id, newValue) => {
        current = applyChange(current, id, newValue);
        saveConfig(current);
        onSave(current);

        // 模式变了 → 同步关联项
        if (id === "mode") {
          const patch = applyMode(newValue);
          const nextWc = { ...DEFAULT_WIDGET_CONFIG, ...(current.widget ?? {}) };
          list.updateValue("showModel", patch.showModel !== false ? "显示" : "隐藏");
          list.updateValue("showProgressBar", patch.showProgressBar !== false ? "显示" : "隐藏");
          list.updateValue("showContextWindow", patch.showContextWindow !== false ? "显示" : "隐藏");
          if (patch.compact !== undefined) {
            // compact 不直接显示为一条，但影响预览
          }
        }

        // 单项变了 → 反推新模式并刷新
        if (["showModel", "showProgressBar", "showContextWindow"].includes(id)) {
          const refreshedWc = { ...DEFAULT_WIDGET_CONFIG, ...(current.widget ?? {}) };
          const newMode = currentMode(refreshedWc);
          list.updateValue("mode", newMode);
        }

        list.updateValue(id, newValue);
      },
      () => done(current),
    );

    return list;
  })) ?? initialConfig;
}

// ═══════════════════════════════════════════════════════════════
// 两个对外入口
// ═══════════════════════════════════════════════════════════════

/** /budget widget —— Widget 外观设置（推荐主入口） */
export async function openWidgetSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
): Promise<BudgetConfig> {
  return openSettingsPanel("Widget 外观", buildWidgetItems(config), config, ui, onSave);
}

/** /budget config —— 完整设置（含限值等） */
export async function openFullSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
): Promise<BudgetConfig> {
  return openSettingsPanel("pi-budget 设置", buildAllItems(config), config, ui, onSave);
}

// ═══════════════════════════════════════════════════════════════
// 主题
// ═══════════════════════════════════════════════════════════════

async function getSettingsTheme(): Promise<SettingsListTheme> {
  try {
    const mod = await import("@earendil-works/pi-coding-agent");
    return mod.getSettingsListTheme();
  } catch {
    return {
      label: (t) => t,
      value: (t) => t,
      description: (t) => `  ${t}`,
      cursor: "› ",
      hint: (t) => `── ${t} ──`,
    };
  }
}
