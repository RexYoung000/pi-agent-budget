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

export const BUILTIN_PRICE_DATE = "2026-06-07";
export const BUILTIN_FX_DATE = "2026-06-07";

/** 内置模型价格表（USD / 1M tokens，2026-06-07 更新）。 */
const BUILTIN_PRICES: Record<string, ModelPrice> = {
  // ── Anthropic Claude ──
  "claude-opus":           { input: 5,    output: 25,   cacheWrite: 6.25, cacheRead: 0.50 },
  "claude-sonnet":         { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-haiku":          { input: 1,    output: 5,    cacheWrite: 1.25, cacheRead: 0.10 },

  // ── OpenAI ──
  "gpt-5.5":               { input: 5,    output: 30,   cacheWrite: 5,    cacheRead: 0.50 },
  "gpt-5.4":               { input: 2.50, output: 15,   cacheWrite: 2.50, cacheRead: 0.25 },
  "gpt-5.4-mini":          { input: 0.75, output: 4.50, cacheWrite: 0.75, cacheRead: 0.075 },
  "gpt-4.1":               { input: 2,    output: 8,    cacheWrite: 2,    cacheRead: 0.20 },
  "gpt-4.1-mini":          { input: 0.40, output: 1.60, cacheWrite: 0.40, cacheRead: 0.04 },
  "gpt-4.1-nano":          { input: 0.10, output: 0.40, cacheWrite: 0.10, cacheRead: 0.01 },
  "gpt-4o":                { input: 2.50, output: 10,   cacheWrite: 2.50, cacheRead: 0.25 },
  "gpt-4o-mini":           { input: 0.15, output: 0.60, cacheWrite: 0.15, cacheRead: 0.015 },
  "o3":                    { input: 2,    output: 8,    cacheWrite: 2,    cacheRead: 0.20 },
  "o4-mini":               { input: 1.10, output: 4.40, cacheWrite: 1.10, cacheRead: 0.11 },

  // ── Google Gemini ──
  "gemini-3.5-flash":      { input: 1.50, output: 9,    cacheWrite: 1.50, cacheRead: 0.15 },
  "gemini-3.1-pro":        { input: 2,    output: 12,   cacheWrite: 2,    cacheRead: 0.20 },
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.50, cacheWrite: 0.25, cacheRead: 0.025 },
  "gemini-2.5-pro":        { input: 1.25, output: 10,   cacheWrite: 1.25, cacheRead: 0.125 },
  "gemini-2.5-flash":      { input: 0.30, output: 1.50, cacheWrite: 0.30, cacheRead: 0.03 },
  "gemini-2.0-flash":      { input: 0.10, output: 0.40, cacheWrite: 0.10, cacheRead: 0.01 },

  // ── DeepSeek ──
  "deepseek-v4-pro":     { input: 0.435, output: 0.87,  cacheWrite: 0.435, cacheRead: 0.0036 },
  "deepseek-v4-flash":   { input: 0.14,  output: 0.28,  cacheWrite: 0.14,  cacheRead: 0.0028 },
  "deepseek-chat":       { input: 0.14,  output: 0.28,  cacheWrite: 0.14,  cacheRead: 0.0028 },
  "deepseek-reasoner":   { input: 0.55,  output: 2.20,  cacheWrite: 0.55,  cacheRead: 0.014 },

  // ── Qwen 通义千问 ──
  "qwen-max":             { input: 1.2,   output: 6,     cacheWrite: 1.2,   cacheRead: 0.12 },
  "qwen-plus":            { input: 0.4,   output: 2.4,   cacheWrite: 0.4,   cacheRead: 0.04 },
  "qwen-turbo":           { input: 0.1,   output: 0.4,   cacheWrite: 0.1,   cacheRead: 0.01 },

  // ── Kimi / Moonshot ──
  "kimi":                 { input: 0.95,  output: 4,     cacheWrite: 0.95,  cacheRead: 0.095 },

  // ── 豆包 / ByteDance ──
  "doubao":               { input: 0.11,  output: 0.28,  cacheWrite: 0.11,  cacheRead: 0.011 },

  // ── GLM / 智谱 ──
  "glm":                  { input: 0.014, output: 0.014, cacheWrite: 0.014, cacheRead: 0.0014 },

  // ── MiMo / 小米 ──
  "mimo":                 { input: 0.14,  output: 0.28,  cacheWrite: 0.14,  cacheRead: 0.014 },
};

/** 默认价格（未匹配到模型时）：约 Claude Sonnet 级别 $3/$15 */
const DEFAULT_PRICE: ModelPrice = { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30 };

/** 按模型名模糊匹配价格表，返回 USD 价格。 */
export function lookupModelPrice(model?: string): ModelPrice {
  const name = (model ?? "unknown").toLowerCase().replace(/[\s._@\/]/g, "-");

  // 1. Claude 家族匹配
  if (/claude|anthropic/.test(name)) {
    if (/opus/i.test(name)) return BUILTIN_PRICES["claude-opus"]!;
    if (/haiku/i.test(name)) return BUILTIN_PRICES["claude-haiku"]!;
    if (/sonnet/i.test(name)) return BUILTIN_PRICES["claude-sonnet"]!;
    return BUILTIN_PRICES["claude-sonnet"]!; // default to sonnet pricing
  }

  // 2. OpenAI 家族匹配
  if (/openai|gpt|o[0-9]/.test(name)) {
    if (/gpt-5\.5/.test(name)) return BUILTIN_PRICES["gpt-5.5"]!;
    if (/gpt-5\.4.*mini/.test(name)) return BUILTIN_PRICES["gpt-5.4-mini"]!;
    if (/gpt-5\.4/.test(name)) return BUILTIN_PRICES["gpt-5.4"]!;
    if (/gpt-4\.1.*mini/.test(name)) return BUILTIN_PRICES["gpt-4.1-mini"]!;
    if (/gpt-4\.1.*nano/.test(name)) return BUILTIN_PRICES["gpt-4.1-nano"]!;
    if (/gpt-4\.1/.test(name)) return BUILTIN_PRICES["gpt-4.1"]!;
    if (/gpt-4o.*mini/.test(name)) return BUILTIN_PRICES["gpt-4o-mini"]!;
    if (/gpt-4o/.test(name)) return BUILTIN_PRICES["gpt-4o"]!;
    if (/o4.*mini/i.test(name)) return BUILTIN_PRICES["o4-mini"]!;
    if (/\bo3\b/i.test(name)) return BUILTIN_PRICES["o3"]!;
    return BUILTIN_PRICES["gpt-4o"]!;
  }

  // 3. Gemini 家族匹配
  if (/gemini|google/.test(name)) {
    if (/gemini-3\.5.*flash/.test(name)) return BUILTIN_PRICES["gemini-3.5-flash"]!;
    if (/gemini-3\.1.*pro/.test(name)) return BUILTIN_PRICES["gemini-3.1-pro"]!;
    if (/gemini-3\.1.*flash.*lite/.test(name)) return BUILTIN_PRICES["gemini-3.1-flash-lite"]!;
    if (/gemini-2\.5.*pro/.test(name)) return BUILTIN_PRICES["gemini-2.5-pro"]!;
    if (/gemini-2\.5.*flash/.test(name)) return BUILTIN_PRICES["gemini-2.5-flash"]!;
    if (/gemini-2\.0.*flash/.test(name)) return BUILTIN_PRICES["gemini-2.0-flash"]!;
    if (/flash.*lite/.test(name)) return BUILTIN_PRICES["gemini-3.1-flash-lite"]!;
    if (/flash/.test(name)) return BUILTIN_PRICES["gemini-3.5-flash"]!;
    if (/pro/.test(name)) return BUILTIN_PRICES["gemini-3.1-pro"]!;
    return BUILTIN_PRICES["gemini-2.5-pro"]!;
  }

  // 4. DeepSeek 家族匹配
  if (/deepseek/.test(name)) {
    if (/v4.*pro|pro/.test(name)) return BUILTIN_PRICES["deepseek-v4-pro"]!;
    if (/reasoner|r1/i.test(name)) return BUILTIN_PRICES["deepseek-reasoner"]!;
    return BUILTIN_PRICES["deepseek-v4-flash"]!;
  }

  // 5. Qwen 家族匹配
  if (/qwen|通义|tongyi|dashscope/.test(name)) {
    if (/max/i.test(name)) return BUILTIN_PRICES["qwen-max"]!;
    if (/plus/i.test(name)) return BUILTIN_PRICES["qwen-plus"]!;
    if (/turbo/i.test(name)) return BUILTIN_PRICES["qwen-turbo"]!;
    return BUILTIN_PRICES["qwen-plus"]!;
  }

  // 6. Kimi / Moonshot
  if (/kimi|moonshot/.test(name)) return BUILTIN_PRICES["kimi"]!;

  // 7. 豆包 / ByteDance
  if (/doubao|豆包|volc|火山/.test(name)) return BUILTIN_PRICES["doubao"]!;

  // 8. GLM / 智谱
  if (/glm|zhipu|智谱/.test(name)) return BUILTIN_PRICES["glm"]!;

  // 9. MiMo / 小米
  if (/mimo|xiaomi|小米/.test(name)) return BUILTIN_PRICES["mimo"]!;

  // 10. 通用：遍历内置 key 做子串匹配兜底
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
