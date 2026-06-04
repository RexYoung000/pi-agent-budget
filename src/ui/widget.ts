/**
 * 状态栏 widget
 *
 * 设计文档：../../design.md §5.1
 *
 * 状态：🚧 scaffold-only
 *
 * 渲染样例：
 *   ┌──────────────────────────────────────────────┐
 *   │ ◉ claude-sonnet-4.5 │ $0.42/$1.00 ████░░ │  │
 *   └──────────────────────────────────────────────┘
 *
 * 颜色映射：
 *   < 60%       绿色
 *   60–80%      黄色
 *   80–100%     橙色（软限）
 *   > 100%      红色（硬限）
 */

import type { LimitStatus } from "../core/limits.js";

export interface WidgetState {
  model: string;
  usedUsd: number;
  budgetUsd: number;
  status?: LimitStatus;
}

/**
 * 生成 widget 行（数组形式，每元素一行）。
 *
 * 调用方式：
 *   ctx.ui.setWidget("pi-budget", renderWidgetLines(state));
 */
export function renderWidgetLines(_state: WidgetState): string[] {
  // TODO(MVP):
  //   const bar = renderProgressBar(state.usedUsd, state.budgetUsd, 12);
  //   const model = state.model.split("/").pop() ?? "?";
  //   const color = levelToThemeColor(state.status?.level, state.status?.ratio);
  //   return [`${icon} ${model} │ $${used.toFixed(2)}/$${budget.toFixed(2)} ${bar}`];
  throw new Error("renderWidgetLines() not implemented (scaffold-only)");
}

/**
 * 渲染进度条：
 *   ratio 0.33, width 12 → "████░░░░░░░░"
 */
export function renderProgressBar(_ratio: number, _width: number): string {
  // TODO(MVP): clamp [0, 1]; filled = round(ratio * width); empty = width - filled
  throw new Error("renderProgressBar() not implemented (scaffold-only)");
}

/**
 * 注册 / 注销 widget 的回调句柄，便于在 message_end 后调用 setWidget。
 */
export function createWidgetRenderer(/* ctx */) {
  return {
    refresh(_state: WidgetState): void {
      // TODO(MVP): ctx.ui.setWidget("pi-budget", renderWidgetLines(state))
      throw new Error("WidgetRenderer.refresh() not implemented (scaffold-only)");
    },
    clear(): void {
      // TODO(MVP): ctx.ui.setWidget("pi-budget", undefined)
      throw new Error("WidgetRenderer.clear() not implemented (scaffold-only)");
    },
  };
}
