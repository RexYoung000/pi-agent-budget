/**
 * 价格锚点与轻量价格表
 *
 * 说明：
 * - 优先使用 Pi/provider 返回的 usage.cost.total。
 * - 若 provider 未返回 cost，本模块按 tokens × 内置价格表兜底计算。
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

/** 模型价格（单位：USD / 1M tokens） */
export interface ModelPrice {
  input: number;
  output: number;
  /** 缓存写入价格（通常 = input 的 50%，绝大多数模型适用） */
  cacheWrite?: number;
  /** 缓存读取价格（通常 = input 的 10%，绝大多数模型适用） */
  cacheRead?: number;
}

/** 单次请求成本计算结果 */
export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  total: number;
  method: "provider" | "tokens";
}

export const BUILTIN_PRICE_DATE = "2026-06-06";
export const BUILTIN_FX_DATE = "2026-06-06";

/** 内置模型价格表（USD / 1M tokens）。后续可扩展为远程拉取。 */
const BUILTIN_PRICES: Record<string, ModelPrice> = {
  // ── Anthropic ──
  "claude-sonnet-4":      { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-sonnet-4-5":    { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-3-5-sonnet":    { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-3-5-haiku":     { input: 0.80, output: 4,    cacheWrite: 1.00, cacheRead: 0.08 },
  "claude-3-opus":        { input: 15,   output: 75,   cacheWrite: 18.75,cacheRead: 1.50 },

  // ── OpenAI ──
  "gpt-4o":               { input: 2.50, output: 10,   cacheWrite: 2.50, cacheRead: 0.25 },
  "gpt-4o-mini":          { input: 0.15, output: 0.60, cacheWrite: 0.15, cacheRead: 0.015 },
  "gpt-4.1":              { input: 2,    output: 8,    cacheWrite: 2,    cacheRead: 0.20 },
  "gpt-4.1-mini":         { input: 0.40, output: 1.60, cacheWrite: 0.40, cacheRead: 0.04 },
  "gpt-4.1-nano":         { input: 0.10, output: 0.40, cacheWrite: 0.10, cacheRead: 0.01 },
  "o3":                   { input: 10,   output: 40,   cacheWrite: 10,   cacheRead: 1 },
  "o4-mini":              { input: 1.10, output: 4.40, cacheWrite: 1.10, cacheRead: 0.11 },

  // ── Google Gemini ──
  "gemini-2.5-pro":       { input: 1.25, output: 10,   cacheWrite: 1.25, cacheRead: 0.125 },
  "gemini-2.5-flash":     { input: 0.15, output: 0.60, cacheWrite: 0.15, cacheRead: 0.015 },
  "gemini-2.0-flash":     { input: 0.10, output: 0.40, cacheWrite: 0.10, cacheRead: 0.01 },

  // ── DeepSeek (CNY / 1M tokens → 按 1USD≈7.25CNY 转 USD 计价) ──
  "deepseek-chat":        { input: 0.14, output: 0.28, cacheWrite: 0.14, cacheRead: 0.014 },
  "deepseek-reasoner":    { input: 0.55, output: 2.20, cacheWrite: 0.55, cacheRead: 0.055 },

  // ── Qwen 通义千问 (CNY → USD) ──
  "qwen-max":             { input: 0.28, output: 0.84, cacheWrite: 0.28, cacheRead: 0.028 },
  "qwen-plus":            { input: 0.11, output: 0.28, cacheWrite: 0.11, cacheRead: 0.011 },
  "qwen-turbo":           { input: 0.04, output: 0.08, cacheWrite: 0.04, cacheRead: 0.004 },

  // ── Kimi (CNY → USD) ──
  "kimi":                 { input: 1.66, output: 1.66, cacheWrite: 1.66, cacheRead: 0.166 },

  // ── 豆包 (CNY → USD) ──
  "doubao-pro":           { input: 0.11, output: 0.28, cacheWrite: 0.11, cacheRead: 0.011 },

  // ── GLM (CNY → USD) ──
  "glm-4":                { input: 0.014,output: 0.014,cacheWrite: 0.014,cacheRead: 0.0014 },

  // ── MiMo (CNY → USD) ──
  "mimo":                 { input: 0.14, output: 0.28, cacheWrite: 0.14, cacheRead: 0.014 },
};

/** 默认价格（未匹配到模型时使用）：约等于中等模型价格 $2/$8 per 1M */
const DEFAULT_PRICE: ModelPrice = { input: 2, output: 8, cacheWrite: 2, cacheRead: 0.20 };

/** 按模型名模糊匹配价格表，返回 USD 价格。 */
export function lookupModelPrice(model?: string): ModelPrice {
  const name = (model ?? "unknown").toLowerCase().replace(/[\s.@\/]/g, "-");
  for (const [key, price] of Object.entries(BUILTIN_PRICES)) {
    if (name.includes(key)) return price;
  }
  return DEFAULT_PRICE;
}

/**
 * 按 tokens 计算单次请求成本（USD）。
 * 返回完整的费用明细和计算方式（"tokens" 或 "provider"）。
 */
export function calculateCostFromTokens(
  inputTokens: number,
  outputTokens: number,
  cacheRead: number,
  cacheWrite: number,
  model?: string,
): CostBreakdown {
  const price = lookupModelPrice(model);
  const ONE_M = 1_000_000;
  const inputCost = (inputTokens / ONE_M) * price.input;
  const outputCost = (outputTokens / ONE_M) * price.output;
  const cacheWriteCost = (cacheWrite / ONE_M) * (price.cacheWrite ?? price.input);
  const cacheReadCost = (cacheRead / ONE_M) * (price.cacheRead ?? price.input * 0.1);
  return {
    inputCost,
    outputCost,
    cacheReadCost,
    cacheWriteCost,
    total: inputCost + outputCost + cacheWriteCost + cacheReadCost,
    method: "tokens",
  };
};

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
