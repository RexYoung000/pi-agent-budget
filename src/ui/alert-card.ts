/**
 * 限值弹窗（软/硬限）
 *
 * 设计文档：../../design.md §5.2
 *
 * MVP 简化版：用 ctx.ui.select(title, options) 做选项式弹窗。
 * v2 可换 ctx.ui.custom() 渲染更复杂的卡片（进度条/历史曲线）。
 */

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";

import type { LimitStatus } from "../core/limits.js";

export type SoftLimitAction = "continue" | "abort" | "raise";
export type HardLimitAction = "raise_and_continue" | "abort";

const SOFT_OPTIONS: Array<{ label: string; value: SoftLimitAction }> = [
  { label: "继续（不提醒到硬限）", value: "continue" },
  { label: "调高预算", value: "raise" },
  { label: "结束会话", value: "abort" },
];

const HARD_OPTIONS: Array<{ label: string; value: HardLimitAction }> = [
  { label: "本次放行 + 调高预算", value: "raise_and_continue" },
  { label: "结束会话", value: "abort" },
];

function formatTitle(prefix: string, status: LimitStatus): string {
  const pct = Math.round(status.ratio * 100);
  return `${prefix}：已用 $${status.current.toFixed(2)} / $${status.budget.toFixed(2)} (${pct}%)`;
}

/** 弹出软限选项，等待用户选择。无 ui / 用户取消 → 默认 "continue"。 */
export async function showSoftLimitCard(
  ui: Pick<ExtensionUIContext, "select">,
  status: LimitStatus,
): Promise<SoftLimitAction> {
  const title = formatTitle("预算警告", status);
  const labels = SOFT_OPTIONS.map((o) => o.label);
  const choice = await ui.select(title, labels);
  if (choice == null) return "continue"; // 用户取消默认放行
  return SOFT_OPTIONS.find((o) => o.label === choice)?.value ?? "continue";
}

/** 弹出硬限选项，等待用户选择。无 ui / 用户取消 → 默认 "abort"（更安全）。 */
export async function showHardLimitCard(
  ui: Pick<ExtensionUIContext, "select">,
  status: LimitStatus,
): Promise<HardLimitAction> {
  const title = formatTitle("硬限触发", status);
  const labels = HARD_OPTIONS.map((o) => o.label);
  const choice = await ui.select(title, labels);
  if (choice == null) return "abort"; // 用户取消默认拒绝
  return HARD_OPTIONS.find((o) => o.label === choice)?.value ?? "abort";
}

/**
 * 让用户输入新的预算金额。返回数字（USD），用户取消或解析失败 → undefined。
 */
export async function askNewBudget(
  ui: Pick<ExtensionUIContext, "input">,
  current?: number,
): Promise<number | undefined> {
  const placeholder = current ? `当前 $${current.toFixed(2)}，输入新金额` : "输入新预算金额（USD）";
  const raw = await ui.input("调高预算", placeholder);
  if (raw == null) return undefined;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}
