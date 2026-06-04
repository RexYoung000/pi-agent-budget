/**
 * 限值弹窗（软/硬限）
 *
 * 设计文档：../../design.md §5.2
 *
 * 状态：🚧 scaffold-only
 *
 * 软限弹窗（80%）：
 *   ┌─ 预算警告 ──────────────────────────┐
 *   │ 已用 $0.80 / $1.00 (80%)            │
 *   │ 预计还能跑 ~4 次类似请求             │
 *   │                                      │
 *   │ [继续]  [切到 Haiku]  [结束]  [调高] │
 *   └──────────────────────────────────────┘
 *
 * 硬限弹窗（100%）：
 *   ┌─ 硬限触发 ──────────────────────────┐
 *   │ 已达 $1.00 上限，已暂停新请求        │
 *   │                                      │
 *   │ [本次放行 + 调高预算]  [结束会话]    │
 *   │ [导出报告]                           │
 *   └──────────────────────────────────────┘
 */

import type { LimitStatus } from "../core/limits.js";

export type SoftLimitAction = "continue" | "downgrade" | "abort" | "raise";
export type HardLimitAction = "raise_and_continue" | "abort" | "export";

/**
 * 弹出软限卡片，等待用户选择。
 *
 * 实现：用 ctx.ui.select(title, options) 选项式弹窗（MVP 简化版）。
 * v2 可换成 ctx.ui.custom() 渲染更复杂的卡片。
 */
export async function showSoftLimitCard(_status: LimitStatus): Promise<SoftLimitAction> {
  // TODO(MVP):
  //   const title = `预算警告：已用 $${used}/${budget} (${pct}%)`;
  //   const choice = await ctx.ui.select(title, ["继续", "切到 Haiku", "结束", "调高"]);
  //   return mapToAction(choice);
  throw new Error("showSoftLimitCard() not implemented (scaffold-only)");
}

/**
 * 弹出硬限卡片。返回前会阻塞新的 user message 提交。
 */
export async function showHardLimitCard(_status: LimitStatus): Promise<HardLimitAction> {
  // TODO(MVP):
  //   const title = `硬限触发：已达 $${budget} 上限，已暂停新请求`;
  //   const choice = await ctx.ui.select(title, ["本次放行 + 调高预算", "结束会话", "导出报告"]);
  throw new Error("showHardLimitCard() not implemented (scaffold-only)");
}
