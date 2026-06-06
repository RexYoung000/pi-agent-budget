/**
 * 价格锚点与轻量价格表
 *
 * MVP 说明：
 * - 当前成本累计仍优先使用 Pi/provider 返回的 usage.cost.total。
 * - 本模块先负责“显示锚点”和“模型原生币种识别”，不重写底层计费链路。
 */

import type { BudgetConfig } from "../config.js";
import { t } from "../i18n/index.js";

export type CurrencyCode = "USD" | "CNY";
export type PricingAnchor = "followModel" | "cny" | "usd";

export interface PricingInfo {
  anchor: PricingAnchor;
  model: string;
  provider: string;
  nativeCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  symbol: string;
  priceDate: string;
  fxDate?: string;
  source: "builtin";
  status: "latest" | "updated";
}

export const BUILTIN_PRICE_DATE = "2026-06-06";
export const BUILTIN_FX_DATE = "2026-06-06";

const CNY_MODEL_PATTERNS: Array<{ provider: string; patterns: RegExp[] }> = [
  { provider: "DeepSeek", patterns: [/deepseek/i] },
  { provider: "Alibaba Qwen", patterns: [/qwen/i, /通义/i, /tongyi/i, /dashscope/i] },
  { provider: "Moonshot Kimi", patterns: [/kimi/i, /moonshot/i] },
  { provider: "ByteDance Doubao", patterns: [/doubao/i, /豆包/i, /volc/i, /火山/i] },
  { provider: "Zhipu GLM", patterns: [/glm/i, /zhipu/i, /智谱/i] },
  { provider: "Xiaomi MiMo", patterns: [/\bmimo\b/i, /xiaomi[-_\s]?mimo/i, /小米.*mimo/i] },
];

const USD_MODEL_PATTERNS: Array<{ provider: string; patterns: RegExp[] }> = [
  { provider: "Anthropic", patterns: [/claude/i, /anthropic/i, /sonnet/i, /opus/i, /haiku/i] },
  { provider: "OpenAI", patterns: [/openai/i, /gpt/i, /o3/i, /o4/i] },
  { provider: "Google Gemini", patterns: [/gemini/i, /google/i] },
  { provider: "Meta", patterns: [/llama/i, /meta/i] },
];

export function normalizePricingAnchor(anchor?: string): PricingAnchor {
  if (anchor === "cny" || anchor === "usd" || anchor === "followModel") return anchor;
  return "followModel";
}

export function currencySymbol(currency: CurrencyCode): string {
  return currency === "CNY" ? "¥" : "$";
}

export function currencyLabel(currency: CurrencyCode): string {
  return currency === "CNY" ? t("pricing.currency.cny") : t("pricing.currency.usd");
}

export function anchorLabel(anchor: PricingAnchor): string {
  switch (anchor) {
    case "cny": return t("pricing.anchor.cny");
    case "usd": return t("pricing.anchor.usd");
    default: return t("pricing.anchor.followModel");
  }
}

export function detectModelProvider(model?: string): { provider: string; nativeCurrency: CurrencyCode } {
  const name = model?.trim() || "unknown";
  for (const item of CNY_MODEL_PATTERNS) {
    if (item.patterns.some((p) => p.test(name))) {
      return { provider: item.provider, nativeCurrency: "CNY" };
    }
  }
  for (const item of USD_MODEL_PATTERNS) {
    if (item.patterns.some((p) => p.test(name))) {
      return { provider: item.provider, nativeCurrency: "USD" };
    }
  }
  return { provider: t("pricing.provider.unknown"), nativeCurrency: "USD" };
}

export function resolveDisplayCurrency(anchor: PricingAnchor, nativeCurrency: CurrencyCode): CurrencyCode {
  if (anchor === "cny") return "CNY";
  if (anchor === "usd") return "USD";
  return nativeCurrency;
}

export function getPricingInfo(config: BudgetConfig, model?: string): PricingInfo {
  const anchor = normalizePricingAnchor(config.pricingAnchor);
  const detected = detectModelProvider(model);
  const displayCurrency = resolveDisplayCurrency(anchor, detected.nativeCurrency);
  return {
    anchor,
    model: model?.trim() || "unknown",
    provider: detected.provider,
    nativeCurrency: detected.nativeCurrency,
    displayCurrency,
    symbol: currencySymbol(displayCurrency),
    priceDate: config.pricingUpdatedAt ?? BUILTIN_PRICE_DATE,
    fxDate: displayCurrency === detected.nativeCurrency ? undefined : (config.fxUpdatedAt ?? BUILTIN_FX_DATE),
    source: "builtin",
    status: config.pricingUpdatedAt === todayIsoDate() ? "updated" : "latest",
  };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function markPricingUpdated(config: BudgetConfig): BudgetConfig {
  return {
    ...config,
    pricingUpdatedAt: todayIsoDate(),
    fxUpdatedAt: todayIsoDate(),
  };
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return `${currencySymbol(currency)}${amount.toFixed(2)}`;
}

export function budgetPresets(currency: CurrencyCode): number[] {
  return currency === "CNY" ? [0, 5, 10, 20, 50] : [0, 1, 2, 5, 10];
}

export function formatBudgetPreset(amount: number, currency: CurrencyCode): string {
  if (amount <= 0) return t("budget.value.unset");
  return formatMoney(amount, currency);
}
