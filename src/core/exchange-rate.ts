import type { BudgetConfig } from "../config.js";

export const DEFAULT_USD_TO_CNY = 7.2;
export const DEFAULT_FX_DATE = "2026-06-07";
export const FX_URL = "https://api.frankfurter.dev/v2/rate/USD/CNY";
const DAY = 24 * 60 * 60 * 1000;
const RETRY_DELAY = 60 * 60 * 1000;

export interface ExchangeRateConfig {
  mode?: "auto" | "fixed";
  fixedRate?: number;
  cachedRate?: number;
  rateDate?: string;
  fetchedAt?: string;
  attemptedAt?: string;
  lastError?: string;
}

export function validExchangeRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function effectiveExchangeRate(config: BudgetConfig): number {
  const fx = config.exchangeRate;
  if (fx?.mode === "fixed" && validExchangeRate(fx.fixedRate)) return fx.fixedRate;
  return validExchangeRate(fx?.cachedRate) ? fx.cachedRate : DEFAULT_USD_TO_CNY;
}

export function exchangeRateSource(config: BudgetConfig): "fixed" | "cached" | "builtin" {
  const fx = config.exchangeRate;
  if (fx?.mode === "fixed" && validExchangeRate(fx.fixedRate)) return "fixed";
  return validExchangeRate(fx?.cachedRate) ? "cached" : "builtin";
}

export function shouldRefreshExchangeRate(config: BudgetConfig, now = Date.now()): boolean {
  const fx = config.exchangeRate;
  if (fx?.mode === "fixed") return false;
  const attempted = Date.parse(fx?.attemptedAt ?? "");
  if (Number.isFinite(attempted) && now - attempted < RETRY_DELAY) return false;
  const fetched = Date.parse(fx?.fetchedAt ?? "");
  return !validExchangeRate(fx?.cachedRate) || !Number.isFinite(fetched) || now - fetched >= DAY;
}

/** Returns only the FX state so a slow response cannot overwrite other settings. */
export async function fetchExchangeRate(
  previous: ExchangeRateConfig = {},
  options: { fetcher?: typeof fetch; signal?: AbortSignal; now?: number } = {},
): Promise<ExchangeRateConfig> {
  const now = options.now ?? Date.now();
  const attemptedAt = new Date(now).toISOString();
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(5000)])
    : AbortSignal.timeout(5000);
  try {
    const response = await (options.fetcher ?? fetch)(FX_URL, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as { base?: string; quote?: string; rate?: unknown; date?: string };
    const date = data.date;
    const parsed = typeof date === "string" ? Date.parse(date) : NaN;
    if (data.base !== "USD" || data.quote !== "CNY" || !validExchangeRate(data.rate) ||
        !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed) ||
        new Date(parsed).toISOString().slice(0, 10) !== date || parsed > now + DAY) {
      throw new Error("Invalid USD/CNY reference rate");
    }
    return { ...previous, cachedRate: data.rate, rateDate: date, fetchedAt: attemptedAt, attemptedAt, lastError: undefined };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { ...previous, attemptedAt, lastError: (error instanceof Error ? error.message : String(error)).slice(0, 160) };
  }
}
