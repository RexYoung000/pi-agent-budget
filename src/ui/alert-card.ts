/**
 * 限值弹窗（软/硬限）
 *
 * 设计文档：../../design.md §5.2
 *
 * MVP 简化版：用 ctx.ui.select(title, options) 做选项式弹窗。
 * v2 可换 ctx.ui.custom() 渲染更复杂的卡片（进度条/历史曲线）。
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import { t } from "../i18n/index.js";

import type { LimitStatus } from "../core/limits.js";

export type SoftLimitAction = "continue" | "abort" | "raise";
export type HardLimitAction = "raise_and_continue" | "abort";

function softOptions(): Array<{ label: string; value: SoftLimitAction }> {
  return [
    { label: t("alert.softLimit.continue"), value: "continue" },
    { label: t("alert.softLimit.raiseBudget"), value: "raise" },
    { label: t("alert.softLimit.endSession"), value: "abort" },
  ];
}

function hardOptions(): Array<{ label: string; value: HardLimitAction }> {
  return [
    { label: t("alert.hardLimit.raiseBudget"), value: "raise_and_continue" },
    { label: t("alert.hardLimit.cancel"), value: "abort" },
  ];
}

function formatTitle(prefix: string, status: LimitStatus, symbol: string = "$"): string {
  const pct = Math.round(status.ratio * 100);
  const usedStr = `${symbol}${status.current.toFixed(2)}`;
  const budgetStr = `${symbol}${status.budget.toFixed(2)}`;
  return `${prefix} — ${usedStr} / ${budgetStr} (${pct}%)`;
}

/** 弹出软限选项，等待用户选择。无 ui / 用户取消 → 默认 "continue"。 */
export async function showSoftLimitCard(
  ui: Pick<ExtensionUIContext, "select">,
  status: LimitStatus,
  symbol?: string,
): Promise<SoftLimitAction> {
  const title = formatTitle(t("alert.softLimit.title"), status, symbol);
  const options = softOptions();
  const labels = options.map((o) => o.label);
  const choice = await ui.select(title, labels);
  if (choice == null) return "continue";
  return options.find((o) => o.label === choice)?.value ?? "continue";
}

/** 弹出硬限选项，等待用户选择。无 ui / 用户取消 → 默认 "abort"（更安全）。 */
export async function showHardLimitCard(
  ui: Pick<ExtensionUIContext, "select">,
  status: LimitStatus,
  symbol?: string,
): Promise<HardLimitAction> {
  const title = formatTitle(t("alert.hardLimit.title"), status, symbol);
  const options = hardOptions();
  const labels = options.map((o) => o.label);
  const choice = await ui.select(title, labels);
  if (choice == null) return "abort";
  return options.find((o) => o.label === choice)?.value ?? "abort";
}

/**
 * 让用户输入新的预算金额。返回数字（与当前显示币种相同），用户取消或解析失败 → undefined。
 */
export async function askNewBudget(
  ui: Pick<ExtensionUIContext, "input">,
  current?: number,
  symbol?: string,
): Promise<number | undefined> {
  const sym = symbol ?? "$";
  const placeholder = current
    ? t("alert.newBudget.message", { currency: sym === "¥" ? "CNY / ¥" : "USD / $" }) + ` (${t("set.scope.session")} ${sym}${current.toFixed(2)})`
    : t("alert.newBudget.message", { currency: sym === "¥" ? "CNY / ¥" : "USD / $" });
  const raw = await ui.input(t("alert.newBudget.title"), placeholder);
  if (raw == null) return undefined;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}
