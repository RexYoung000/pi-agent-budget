/**
 * /budget TUI 设置构建器
 *
 * 主面板使用四个轻量列表：预算、价格表、设置。
 * 轻量本土化列表负责 ↑↓ / Enter 循环值，所有修改立即写入 ~/.pi/budget.json。
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { SettingsListTheme } from "@earendil-works/pi-tui";
import { Key, matchesKey } from "@earendil-works/pi-tui";
import { LocalizedSettingsList, type LocalizedSettingItem } from "../ui/localized-settings-list.js";

import type { BudgetConfig, WidgetConfig } from "../config.js";
import { DEFAULT_WIDGET_CONFIG, saveConfig } from "../config.js";
import { t, getSupportedLocales, setLocale } from "../i18n/index.js";
import { LOCALE_LABELS, type Locale } from "../i18n/locales.js";
import {
  anchorLabel,
  budgetPresets,
  currencyLabel,
  formatBudgetPreset,
  formatUsdInCurrency,
  usdToDisplay,
  displayToUsd,
  getPricingInfo,
  type PricingAnchor,
} from "../core/pricing.js";

const MODE_COMPACT = "compact";
const MODE_FULL = "full";
const MODE_CUSTOM = "custom";
const MODE_KEYS = [MODE_COMPACT, MODE_FULL, MODE_CUSTOM] as const;

const PLACEMENT_BELOW = "belowEditor";
const PLACEMENT_ABOVE = "aboveEditor";

const SOFT_NOTIFY = "notify";
const SOFT_PAUSE = "pause";
const HARD_PAUSE = "pause";
const HARD_ABORT = "abort";

const ANCHOR_KEYS: PricingAnchor[] = ["followModel", "cny", "usd"];

function fallbackTheme(): SettingsListTheme {
  return {
    label: (text) => text,
    value: (text) => text,
    description: (text) => `  ${text}`,
    cursor: "› ",
    hint: (text) => `── ${text} ──`,
  };
}

async function getSettingsTheme(): Promise<SettingsListTheme> {
  try {
    const mod = await import("@earendil-works/pi-coding-agent");
    return mod.getSettingsListTheme();
  } catch {
    return fallbackTheme();
  }
}

function boolDisplay(v: boolean): string {
  return v ? t("value.on") : t("value.off");
}

function modeLabel(key: string): string {
  switch (key) {
    case MODE_COMPACT: return t("widget.config.compact");
    case MODE_FULL: return t("widget.config.modeFull");
    case MODE_CUSTOM: return t("widget.config.modeCustom");
    default: return key;
  }
}

function placementLabel(key: string): string {
  return key === PLACEMENT_ABOVE ? t("widget.placement.aboveEditor") : t("widget.placement.belowEditor");
}

function softLimitLabel(key: string): string {
  return key === SOFT_PAUSE ? t("config.widgetSummary.onSoftLimit.pause") : t("config.widgetSummary.onSoftLimit.notify");
}

function hardLimitLabel(key: string): string {
  return key === HARD_ABORT ? t("config.widgetSummary.onHardLimit.terminate") : t("config.widgetSummary.onHardLimit.pause");
}

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

function localeLabel(locale?: string): string {
  const l = (locale ?? "en") as Locale;
  return LOCALE_LABELS[l] ?? locale ?? "en";
}

function localeFromLabel(label: string): Locale {
  return getSupportedLocales().find((l) => LOCALE_LABELS[l] === label) ?? "en";
}

function previewWidget(wc: WidgetConfig, cost: string): string {
  const modelName = wc.showModel !== false ? "sonnet" : "";
  const bar = wc.showProgressBar !== false ? " ████░░░░░░" : "";
  let preview = "🟢 ";
  if (modelName) preview += `${modelName} │ `;
  preview += cost + bar;
  if (wc.showContextWindow !== false) preview += " │ 28K/200K (14%)";
  return preview;
}

function clone(config: BudgetConfig): BudgetConfig {
  return JSON.parse(JSON.stringify(config)) as BudgetConfig;
}

function save(next: BudgetConfig, onSave: (config: BudgetConfig) => void): BudgetConfig {
  saveConfig(next);
  if (next.locale) setLocale(next.locale);
  onSave(next);
  return next;
}

export function createBudgetListForDashboard(
  initialConfig: BudgetConfig,
  model: string | undefined,
  onSave: (config: BudgetConfig) => void,
): LocalizedSettingsList {
  let current = clone(initialConfig);
  const pricing = getPricingInfo(current, model);
  const budgetCurrency = pricing.displayCurrency;
  const presets = budgetPresets(budgetCurrency);
  const budget = current.session?.usd ?? 0;
  const currentBudget = formatBudgetPreset(usdToDisplay(budget, budgetCurrency, pricing.exchangeRate), budgetCurrency);
  const budgetValues = presets.map((v) => formatBudgetPreset(v, budgetCurrency));

  const items: LocalizedSettingItem[] = [
    {
      id: "sessionBudget",
      label: t("budget.sessionBudget"),
      description: t("budget.sessionBudget.description", { currency: currencyLabel(pricing.displayCurrency) }),
      currentValue: currentBudget,
      values: budgetValues,
    },
    {
      id: "clearBudget",
      label: t("budget.clearSession"),
      description: t("budget.clearSession.description"),
      currentValue: t("budget.action.ready"),
      values: [t("budget.action.clear")],
    },
    {
      id: "softLimitRatio",
      label: t("config.softLimitThreshold"),
      description: t("config.softLimitRatio.description"),
      currentValue: `${Math.round(current.softLimitRatio * 100)}%`,
      values: ["70%", "80%", "90%"],
    },
    {
      id: "softLimit",
      label: t("config.softLimitBehavior"),
      description: t("config.softLimit.description", { pct: Math.round(current.softLimitRatio * 100), notify: softLimitLabel(SOFT_NOTIFY), pause: softLimitLabel(SOFT_PAUSE) }),
      currentValue: softLimitLabel(current.onSoftLimit),
      values: [SOFT_NOTIFY, SOFT_PAUSE].map(softLimitLabel),
    },
    {
      id: "hardLimit",
      label: t("config.hardLimitBehavior"),
      description: t("config.hardLimit.description", { pause: hardLimitLabel(HARD_PAUSE), terminate: hardLimitLabel(HARD_ABORT) }),
      currentValue: hardLimitLabel(current.onHardLimit),
      values: [HARD_PAUSE, HARD_ABORT].map(hardLimitLabel),
    },
  ];

  return new LocalizedSettingsList(items, 10, (id, newValue) => {
    const next = clone(current);
    if (id === "sessionBudget") {
      const idx = budgetValues.indexOf(newValue);
      const amount = presets[Math.max(0, idx)] ?? 0;
      if (amount <= 0) {
        if (next.session) {
          const { usd: _u, ...rest } = next.session;
          next.session = Object.keys(rest).length ? rest : undefined;
        }
      } else {
        next.session = { ...(next.session ?? {}), usd: displayToUsd(amount, budgetCurrency, pricing.exchangeRate) };
      }
    } else if (id === "clearBudget") {
      if (next.session) {
        const { usd: _u, ...rest } = next.session;
        next.session = Object.keys(rest).length ? rest : undefined;
      }
    } else if (id === "softLimitRatio") {
      next.softLimitRatio = Number(newValue.replace("%", "")) / 100;
    } else if (id === "softLimit") {
      next.onSoftLimit = newValue === softLimitLabel(SOFT_PAUSE) ? "pause" : "notify";
    } else if (id === "hardLimit") {
      next.onHardLimit = newValue === hardLimitLabel(HARD_ABORT) ? "abort" : "pause";
    }
    current = save(next, onSave);
  }, () => {});
}

export function createPricingListForDashboard(
  initialConfig: BudgetConfig,
  model: string | undefined,
  onSave: (config: BudgetConfig) => void,
  onRefresh: () => void = () => {},
): LocalizedSettingsList {
  let current = clone(initialConfig);
  const info = getPricingInfo(current, model);

  const items: LocalizedSettingItem[] = [
    { id: "anchor", label: t("pricing.anchor"), description: t("pricing.anchor.description"), currentValue: anchorLabel(info.anchor), values: ANCHOR_KEYS.map(anchorLabel) },
    { id: "model", label: t("pricing.currentModel"), description: t("pricing.currentModel.description"), currentValue: info.model },
    { id: "provider", label: t("pricing.provider"), description: t("pricing.provider.description"), currentValue: info.provider },
    { id: "nativeCurrency", label: t("pricing.nativeCurrency"), description: t("pricing.nativeCurrency.description"), currentValue: currencyLabel(info.nativeCurrency) },
    { id: "displayCurrency", label: t("pricing.displayCurrency"), description: t("pricing.displayCurrency.description"), currentValue: currencyLabel(info.displayCurrency) },
    { id: "priceDate", label: t("pricing.priceDate"), description: t("pricing.priceDate.description"), currentValue: info.priceDate },
    { id: "fxMode", label: t("fx.mode"), description: t("fx.mode.description"), currentValue: t(current.exchangeRate?.mode === "fixed" ? "fx.fixed" : "fx.auto"), values: [t("fx.auto"), t("fx.fixed")] },
    { id: "fxRate", label: t("fx.rate"), description: t("fx.rate.description"), currentValue: `1 USD = ${info.exchangeRate} CNY` },
    { id: "fxStatus", label: t("fx.status"), description: current.exchangeRate?.mode !== "fixed" && current.exchangeRate?.lastError ? t("fx.failure") : t("fx.source.description"), currentValue: `${current.exchangeRate?.mode !== "fixed" && current.exchangeRate?.lastError ? t("fx.failed") + " · " : ""}${t(info.fxSource === "fixed" ? "fx.fixed" : info.fxSource === "cached" ? "fx.cached" : "fx.builtin")}` },
    { id: "fxDate", label: t("pricing.fxDate"), description: t("pricing.fxDate.description"), currentValue: info.fxDate ?? t("pricing.fxDate.notNeeded") },
    { id: "updatePricing", label: t("pricing.updateToday"), description: t("pricing.updateToday.description"), currentValue: t("fx.ready"), values: [t("pricing.action.update")] },
  ];

  return new LocalizedSettingsList(items, 12, (id, newValue) => {
    const next = clone(current);
    if (id === "anchor") {
      const key = ANCHOR_KEYS.find((k) => anchorLabel(k) === newValue) ?? "followModel";
      next.pricingAnchor = key;
    } else if (id === "fxMode") {
      const mode = newValue === t("fx.fixed") ? "fixed" : "auto";
      next.exchangeRate = { ...next.exchangeRate, mode, fixedRate: next.exchangeRate?.fixedRate ?? info.exchangeRate };
    } else if (id === "updatePricing") {
      onRefresh();
      return;
    }
    current = save(next, onSave);
  }, () => {});
}

export function createSettingsListForDashboard(
  initialConfig: BudgetConfig,
  model: string | undefined,
  onSave: (config: BudgetConfig) => void,
): LocalizedSettingsList {
  let current = clone(initialConfig);
  const wc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(current.widget ?? {}) };
  const pricing = getPricingInfo(current, model);
  const currentMode = currentModeKey(wc);
  const costPreview = `${formatUsdInCurrency(0.42, pricing.displayCurrency, pricing.exchangeRate)}/${formatUsdInCurrency(1, pricing.displayCurrency, pricing.exchangeRate)}`;

  const items: LocalizedSettingItem[] = [
    { id: "locale", label: t("config.locale"), description: t("config.locale.description"), currentValue: localeLabel(current.locale), values: getSupportedLocales().map(localeLabel) },
    { id: "pricingAnchor", label: t("pricing.anchor"), description: t("pricing.anchor.description"), currentValue: anchorLabel(pricing.anchor), values: ANCHOR_KEYS.map(anchorLabel) },
    { id: "mode", label: t("widget.config.mode"), description: `${t("widget.config.livePreview")}:\n  ${previewWidget(wc, costPreview)}\n\n${t("widget.config.modeDescription", { compact: modeLabel(MODE_COMPACT), full: modeLabel(MODE_FULL), custom: modeLabel(MODE_CUSTOM) })}`, currentValue: modeLabel(currentMode), values: MODE_KEYS.map(modeLabel) },
    { id: "placement", label: t("widget.config.placement"), description: t("widget.config.placementDescription"), currentValue: placementLabel(wc.placement ?? PLACEMENT_BELOW), values: [PLACEMENT_BELOW, PLACEMENT_ABOVE].map(placementLabel) },
    { id: "showModel", label: t("widget.config.showModel"), description: t("widget.config.showModelDescription", { on: wc.showModel !== false ? `sonnet │ ${costPreview}` : costPreview }), currentValue: boolDisplay(wc.showModel !== false), values: [t("value.on"), t("value.off")] },
    { id: "showProgressBar", label: t("widget.config.showProgress"), description: t("widget.config.showProgressDescription", { on: wc.showProgressBar !== false ? `${costPreview} ████░░░░░░` : costPreview }), currentValue: boolDisplay(wc.showProgressBar !== false), values: [t("value.on"), t("value.off")] },
    { id: "showContextWindow", label: t("widget.config.showContext"), description: t("widget.config.showContextDescription"), currentValue: boolDisplay(wc.showContextWindow !== false), values: [t("value.on"), t("value.off")] },
    { id: "debug", label: t("config.debugLog"), description: t("config.debug.description"), currentValue: boolDisplay(!!current.debug), values: [t("value.on"), t("value.off")] },
  ];

  return new LocalizedSettingsList(items, 12, (id, newValue) => {
    const next = clone(current);
    const nextWc: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...(next.widget ?? {}) };
    if (id === "locale") {
      next.locale = localeFromLabel(newValue);
    } else if (id === "pricingAnchor") {
      next.pricingAnchor = ANCHOR_KEYS.find((k) => anchorLabel(k) === newValue) ?? "followModel";
    } else if (id === "mode") {
      const modeKey = MODE_KEYS.find((k) => modeLabel(k) === newValue) ?? MODE_FULL;
      Object.assign(nextWc, applyMode(modeKey));
    } else if (id === "placement") {
      nextWc.placement = newValue === placementLabel(PLACEMENT_ABOVE) ? "aboveEditor" : "belowEditor";
    } else if (id === "showModel") {
      nextWc.showModel = newValue === t("value.on");
    } else if (id === "showProgressBar") {
      nextWc.showProgressBar = newValue === t("value.on");
    } else if (id === "showContextWindow") {
      nextWc.showContextWindow = newValue === t("value.on");
    } else if (id === "debug") {
      next.debug = newValue === t("value.on");
    }
    next.widget = nextWc;
    current = save(next, onSave);
  }, () => {});
}

export async function openWidgetSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
  model?: string,
): Promise<BudgetConfig> {
  let current = clone(config);
  return (await ui.custom<BudgetConfig>((_tui, _theme, _kb, done) => {
    const buildList = (): LocalizedSettingsList => createSettingsListForDashboard(current, model, (c) => {
      current = c;
      onSave(c);
    });
    let base = buildList();
    return {
      render: (width: number) => base.render(width),
      handleInput: (data: string) => {
        // matchesKey 兼容传统序列与 Kitty / modifyOtherKeys 协议，否则 ESC 在部分终端无法退出。
        if (matchesKey(data, Key.escape)) done(current);
        else {
          base.handleInput(data);
          if (matchesKey(data, Key.enter) || matchesKey(data, Key.space)) {
            const selected = base.getSelectedIndex();
            base = buildList();
            base.setSelectedIndex(selected);
          }
          _tui.requestRender();
        }
      },
      invalidate: () => base.invalidate?.(),
    };
  })) ?? config;
}

export async function openFullSettings(
  config: BudgetConfig,
  ui: ExtensionUIContext,
  onSave: (config: BudgetConfig) => void,
  model?: string,
): Promise<BudgetConfig> {
  return openWidgetSettings(config, ui, onSave, model);
}
