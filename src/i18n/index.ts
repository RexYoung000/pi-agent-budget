/**
 * i18n 管理器
 *
 * 全局单例。locale 来源优先级：
 *   1. config.locale（用户手动设置）
 *   2. process.env.PI_LANG 环境变量
 *   3. 默认 "en"
 */

import type { Locale, Translations } from "./locales.js";
import { LOCALE_DATA, SUPPORTED_LOCALES } from "./locales.js";

/** 翻译函数类型 */
export type TFunction = (key: keyof Translations, vars?: Record<string, string | number>) => string;

// ── 内部状态 ──

let currentLocale: Locale = "en";
let currentTranslations: Translations = LOCALE_DATA.en;

// ── 公开 API ──

/** 获取当前 locale */
export function getLocale(): Locale {
  return currentLocale;
}

/** 获取支持的语言列表 */
export function getSupportedLocales(): Locale[] {
  return [...SUPPORTED_LOCALES];
}

/** 设置 locale。不存在的 locale 回退到 "en"。 */
export function setLocale(locale: string): void {
  const normalized = locale.trim();
  if (SUPPORTED_LOCALES.includes(normalized as Locale)) {
    currentLocale = normalized as Locale;
  } else {
    currentLocale = "en";
  }
  currentTranslations = LOCALE_DATA[currentLocale];
}

/** 从 config 或环境变量初始化 locale。调用一次即可，后续用 setLocale 切换。 */
export function initLocale(configLocale?: string): void {
  const envLang = process.env.PI_LANG?.trim();
  const candidate = configLocale || envLang || "en";
  setLocale(candidate);
}

/**
 * 翻译函数 t()
 *
 * 用法：
 *   t("overview.hintSetBudget")                       → "Tip: use `/budget set <usd>`..."
 *   t("alert.softLimit.message", { used: "$0.42", budget: "$1.00", pct: "42" })
 */
export function t(key: keyof Translations, vars?: Record<string, string | number>): string {
  let text = currentTranslations[key] ?? LOCALE_DATA.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/** 重新加载翻译（locale 改变后内部已自动切换，此函数用于显式刷新） */
export function reload(): void {
  currentTranslations = LOCALE_DATA[currentLocale];
}
