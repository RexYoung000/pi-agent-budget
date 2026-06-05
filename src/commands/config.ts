/**
 * /budget widget / /budget config — TUI 设置面板
 *
 * 用法：
 *   /budget widget   → Widget 外观设置（推荐入口）
 *   /budget config   → 完整设置（含限值、调试等高级项）
 *
 * 特点：
 *   - 显示模式三档：compact / full / custom
 *   - 每项有通俗说明 + 实时预览
 *   - 方向键导航、Enter 切换、ESC 退出提交
 *   - 切换立刻写入 ~/.pi/budget.json
 *   - 支持多语言（en / zh-CN / ja / ko）
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { SettingsList, type SettingItem, type SettingsListTheme } from "@earendil-works/pi-tui";

import type { BudgetConfig, WidgetConfig } from "../config.js";
import { DEFAULT_WIDGET_CONFIG, saveConfig, DEFAULT_CONFIG } from "../config.js";
import { t, getSupportedLocales } from "../i18n/index.js";
import { LOCALE_LABELS, type Locale } from "../i18n/locales.js";

// ═══════════════════════════════════════════════════════════════
// 值映射（内部 key → 各语言显示标签在 locales.ts 中定义）
// ═══════════════════════════════════════════════════════════════

/** 用于 applyChange 的内部 key，不依赖显示文本 */
type InternalKey = string;
type SettingId =
  | "mode" | "placement" | "currencySymbol"
  | "showModel" | "showProgressBar" | "showContextWindow"
  | "softLimit" | "softLimitRatio" | "hardLimit"
  | "debug" | "locale";

// 内部 key → 布尔值映射
const ON_KEY = "on";
const OFF_KEY = "off";

function boolDisplay(v: boolean): string {
  return v ? t("value.on") : t("value.off");
}

// 模式
const MODE_COMPACT = "compact";
const MODE_FULL = "full";
const MODE_CUSTOM = "custom";
const MODE_KEYS = [MODE_COMPACT, MODE_FULL, MODE_CUSTOM] as const;

function modeLabel(key: string): string {
  switch (key) {
    case MODE_COMPACT: return t("widget.config.compact");
    case MODE_FULL: return t("widget.config.modeFull");
    case MODE_CUSTOM: return t("widget.config.modeCustom");
    default: return key;
  }
}

// 摆放位置
const PLACEMENT_BELOW = "belowEditor";
const PLACEMENT_ABOVE = "aboveEditor";

function placementLabel(key: string): string {
  return key === PLACEMENT_ABOVE ? t("widget.placement.aboveEditor") : t("widget.placement.belowEditor");
}

// 软限行为
const SOFT_NOTIFY = "notify";
const SOFT_PAUSE = "pause";

function softLimitLabel(key: string): string {
  return key === SOFT_PAUSE ? t("config.widgetSummary.onSoftLimit.pause") : t("config.widgetSummary.onSoftLimit.notify");
}

// 硬限行为
const HARD_PAUSE = "pause";
const HARD_ABORT = "abort";

function hardLimitLabel(key: string): string {
  return key === HARD_ABORT ? t("config.widgetSummary.onHardLimit.terminate") : t("config.widgetSummary.onHardLimit.pause");
}

// ═══════════════════════════════════════════════════════════════
// 模式 → 预设
// ═══════════════════════════════════════════════════════════════

function applyMode(modeKey: string): Partial<WidgetConfig> {
  switch (modeKey) {
    case MODE_COMPACT:
      return { compact: true, showModel: false, showProgressBar: false, showContextWindow: false };
    case MODE_FULL:
      return { compact: false, showModel: true, showProgressBar: true, showContextWindow: true };
    default:
      return {};
  }
}

function currentModeKey(wc: WidgetConfig): string {
  const c = wc.compact ?? false;
  const sm = wc.showModel !== false;
  const sb = wc.showProgressBar !== false;
  const sc = wc.showContextWindow !== false;
  if (!c && sm && sb && sc) return MODE_FULL;
  if (c && !sm && !sb && !sc) return MODE_COMPACT;
  return MODE_CUSTOM;
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
  const currentMode = currentModeKey(wc);
  const sym = wc.currencySymbol ?? "$";

  return [
    {
      id: "mode",
      label: t("widget.config.mode"),
      description: [
        `${t("widget.config.livePreview")}:`,
        `  ${previewWidget(wc, sym).split("\n").join("\n  ")}`,
        "",
        t("widget.config.modeDescription", {
          compact: modeLabel(MODE_COMPACT),
          full: modeLabel(MODE_FULL),
          custom: modeLabel(MODE_CUSTOM),
        }),
      ].join("\n"),
      currentValue: modeLabel(currentMode),
      values: MODE_KEYS.map(modeLabel),
    },
    {
      id: "placement",
      label: t("widget.config.placement"),
      description: t("widget.config.placementDescription"),
      currentValue: placementLabel(wc.placement ?? PLACEMENT_BELOW),
      values: [PLACEMENT_BELOW, PLACEMENT_ABOVE].map(placementLabel),
    },
    {
      id: "currencySymbol",
      label: t("widget.config.currency"),
      description: t("widget.config.currencyDescription", { sym }),
      currentValue: sym,
      values: ["$", "US$", "¥", "€", "£"],
    },
    {
      id: "showModel",
      label: t("widget.config.showModel"),
      description: t("widget.config.showModelDescription", {
        on: wc.showModel !== false ? "sonnet │ $0.42/$1.00" : "$0.42/$1.00",
      }),
      currentValue: boolDisplay(wc.showModel !== false),
      values: [t("value.on"), t("value.off")],
    },
    {
      id: "showProgressBar",
      label: t("widget.config.showProgress"),
      description: t("widget.config.showProgressDescription", {
        on: wc.showProgressBar !== false ? "$0.42/$1.00 ████░░░░░░" : "$0.42/$1.00",
      }),
      currentValue: boolDisplay(wc.showProgressBar !== false),
      values: [t("value.on"), t("value.off")],
    },
    {
      id: "showContextWindow",
      label: t("widget.config.showContext"),
      description: t("widget.config.showContextDescription"),
      currentValue: boolDisplay(wc.showContextWindow !== false),
      values: [t("value.on"), t("value.off")],
    },
  ];
}

function buildAllItems(config: BudgetConfig): SettingItem[] {
  const widgetItems = buildWidgetItems(config);

  return [
    ...widgetItems,
    {
      id: "softLimit",
      label: t("config.softLimitBehavior"),
      description: t("config.softLimit.description", {
        pct: Math.round(config.softLimitRatio * 100),
        notify: softLimitLabel(SOFT_NOTIFY),
        pause: softLimitLabel(SOFT_PAUSE),
      }),
      currentValue: softLimitLabel(config.onSoftLimit),
      values: [SOFT_NOTIFY, SOFT_PAUSE].map(softLimitLabel),
    },
    {
      id: "softLimitRatio",
      label: t("config.softLimitThreshold"),
      description: t("config.softLimitRatio.description"),
      currentValue: `${Math.round(config.softLimitRatio * 100)}%`,
      values: ["70%", "80%", "90%"],
    },
    {
      id: "hardLimit",
      label: t("config.hardLimitBehavior"),
      description: t("config.hardLimit.description", {
        pause: hardLimitLabel(HARD_PAUSE),
        terminate: hardLimitLabel(HARD_ABORT),
      }),
      currentValue: hardLimitLabel(config.onHardLimit),
      values: [HARD_PAUSE, HARD_ABORT].map(hardLimitLabel),
    },
    {
      id: "debug",
      label: t("config.debugLog"),
      description: t("config.debug.description"),
      currentValue: boolDisplay(!!config.debug),
      values: [t("value.on"), t("value.off")],
    },
    {
      id: "locale",
      label: t("config.locale"),
      description: t("config.locale.description"),
      currentValue: (config.locale ?? "en") as string,
      values: getSupportedLocales().map((l) => l as string),
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// 变更应用（基于内部 key，不依赖显示文本）
// ═══════════════════════════════════════════════════════════════

function applyChange(config: BudgetConfig, id: string, displayValue: string): BudgetConfig {
  const next = JSON.parse(JSON.stringify(config)) as BudgetConfig;
  const wc = { ...DEFAULT_WIDGET_CONFIG, ...(next.widget ?? {}) };

  switch (id) {
    case "mode": {
      // 反向查找：displayValue → mode key
      const modeKey = MODE_KEYS.find(k => modeLabel(k) === displayValue) ?? MODE_FULL;
      const patch = applyMode(modeKey);
      Object.assign(wc, patch);
      break;
    }
    case "placement":
      wc.placement = (displayValue === placementLabel(PLACEMENT_ABOVE) ? PLACEMENT_ABOVE : PLACEMENT_BELOW) as "belowEditor" | "aboveEditor";
      break;
    case "currencySymbol":
      wc.currencySymbol = displayValue;
      break;
    case "showModel":
      wc.showModel = displayValue === t("value.on");
      break;
    case "showProgressBar":
      wc.showProgressBar = displayValue === t("value.on");
      break;
    case "showContextWindow":
      wc.showContextWindow = displayValue === t("value.on");
      break;
    case "softLimit":
      next.onSoftLimit = displayValue === softLimitLabel(SOFT_PAUSE) ? "pause" : "notify";
      break;
    case "softLimitRatio":
      next.softLimitRatio = Number(displayValue.replace("%", "")) / 100;
      break;
    case "hardLimit":
      next.onHardLimit = displayValue === hardLimitLabel(HARD_ABORT) ? "abort" : "pause";
      break;
    case "debug":
      next.debug = displayValue === t("value.on");
      break;
    case "locale":
      next.locale = displayValue;
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

        // mode 变更 → 同步关联布尔项
        if (id === "mode") {
          const modeKey = MODE_KEYS.find(k => modeLabel(k) === newValue) ?? MODE_FULL;
          const patch = applyMode(modeKey);
          list.updateValue("showModel", patch.showModel !== false ? t("value.on") : t("value.off"));
          list.updateValue("showProgressBar", patch.showProgressBar !== false ? t("value.on") : t("value.off"));
          list.updateValue("showContextWindow", patch.showContextWindow !== false ? t("value.on") : t("value.off"));
        }

        // 单项变更 → 反推 mode
        if (["showModel", "showProgressBar", "showContextWindow"].includes(id)) {
          const refreshedWc = { ...DEFAULT_WIDGET_CONFIG, ...(current.widget ?? {}) };
          const newMode = currentModeKey(refreshedWc);
          list.updateValue("mode", modeLabel(newMode));
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

export async function openWidgetSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
): Promise<BudgetConfig> {
  return openSettingsPanel(t("widget.config.title"), buildWidgetItems(config), config, ui, onSave);
}

export async function openFullSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
): Promise<BudgetConfig> {
  return openSettingsPanel(t("config.title"), buildAllItems(config), config, ui, onSave);
}

/**
 * 给仪表盘「设置」标签用的 SettingsList 工厂。返回独立实例（不带外层面板）。
 * 调用方负责把它嵌入到自己的容器里。
 */
export function createSettingsListForDashboard(
  initialConfig: BudgetConfig,
  onSave: (config: BudgetConfig) => void,
): SettingsList {
  // 注意：这是同步函数，主题走默认回退（label/value 不上色，但功能完整）
  const fallbackTheme: SettingsListTheme = {
    label: (text) => text,
    value: (text) => text,
    description: (text) => `  ${text}`,
    cursor: "› ",
    hint: (text) => `── ${text} ──`,
  };

  let current = JSON.parse(JSON.stringify(initialConfig)) as BudgetConfig;
  const items = buildAllItems(current);

  return new SettingsList(
    items,
    12,
    fallbackTheme,
    (id, newValue) => {
      current = applyChange(current, id, newValue);
      saveConfig(current);
      onSave(current);

      // 联动刷新
      if (id === "mode") {
        const modeKey = MODE_KEYS.find(k => modeLabel(k) === newValue) ?? MODE_FULL;
        const patch = applyMode(modeKey);
        // 这里拿不到 list 实例的引用（构造中），需要外部拿到返回值后调用
      }
    },
    () => {},
  );
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
