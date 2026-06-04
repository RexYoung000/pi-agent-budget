/**
 * 状态栏 widget
 *
 * 设计文档：../../design.md §5.1
 *
 * 渲染样例（带颜色）：
 *   ◉ claude-sonnet-4-5 │ $0.42/$1.00 ████░░░░░░░░
 *
 * 颜色映射：
 *   < 60%       success（绿）
 *   60–80%      accent（青）
 *   80–100%     warning（橙黄）
 *   > 100%      error（红）
 */

import type { ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";

export type WidgetLevel = "ok" | "warn" | "soft" | "hard";

export interface WidgetState {
  model: string;
  usedUsd: number;
  budgetUsd: number; // 0 表示未设置预算，按 "ok" 处理（不显示分母/进度条）
}

/** 根据 used/budget 算出等级。 */
export function computeLevel(state: WidgetState): WidgetLevel {
  const { usedUsd, budgetUsd } = state;
  if (!budgetUsd || budgetUsd <= 0) return "ok";
  const ratio = usedUsd / budgetUsd;
  if (ratio >= 1.0) return "hard";
  if (ratio >= 0.8) return "soft";
  if (ratio >= 0.6) return "warn";
  return "ok";
}

const LEVEL_COLOR: Record<WidgetLevel, "success" | "accent" | "warning" | "error"> = {
  ok: "success",
  warn: "accent",
  soft: "warning",
  hard: "error",
};

/** 简化模型名展示：取最后一段。 */
export function shortModelName(model: string): string {
  if (!model) return "?";
  const last = model.split("/").pop() ?? model;
  return last;
}

/**
 * 渲染进度条：
 *   ratio 0.33, width 12 → "████░░░░░░░░"
 *   ratio > 1            → 仍按 100% 渲染，颜色由外部决定
 */
export function renderProgressBar(ratio: number, width: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

/**
 * 用主题颜色渲染一行 widget 内容。
 * theme 可选 —— 缺省（例如单元测试时）退化为纯文本。
 */
export function renderWidgetLine(state: WidgetState, theme?: Theme): string {
  const model = shortModelName(state.model);
  const level = computeLevel(state);
  const color = LEVEL_COLOR[level];

  // 圆点指示等级
  const dot = level === "hard" ? "🔴" : level === "soft" ? "🟠" : level === "warn" ? "🟡" : "🟢";

  if (!state.budgetUsd || state.budgetUsd <= 0) {
    // 无预算：只显示已用
    const core = `${dot} ${model} │ $${state.usedUsd.toFixed(2)}`;
    if (!theme) return core;
    return theme.fg(color, core);
  }

  const ratio = state.usedUsd / state.budgetUsd;
  const bar = renderProgressBar(ratio, 12);
  const core = `${dot} ${model} │ $${state.usedUsd.toFixed(2)}/$${state.budgetUsd.toFixed(2)} ${bar}`;
  if (!theme) return core;
  return theme.fg(color, core);
}

/**
 * 注册 / 注销 widget 的回调句柄，便于在 message_end / model_select 后调用 setWidget。
 *
 * 设计：直接接 ctx.ui 形状的对象，类型对齐 pi 实际签名（重载 setWidget）。
 */
export interface WidgetRefresher {
  /** 用新 state 重绘。state = null 表示清空 widget（例如 session 结束）。 */
  refresh(state: WidgetState | null): void;
  /** 清空 widget。 */
  clear(): void;
}

export function createWidgetRenderer(opts: {
  ui: Pick<ExtensionUIContext, "setWidget">;
}): WidgetRefresher {
  return {
    refresh(state) {
      if (!state) {
        opts.ui.setWidget("pi-budget", undefined);
        return;
      }
      // 用 renderer 形式才能拿到 theme；pi 文档允许 (tui, theme) => Component
      opts.ui.setWidget("pi-budget", (_tui, theme) => {
        const line = renderWidgetLine(state, theme);
        return {
          render(_width: number) {
            return [line];
          },
          invalidate() {
            // widget 是元状态驱动，不需要缓存失效
          },
        };
      });
    },
    clear() {
      opts.ui.setWidget("pi-budget", undefined);
    },
  };
}
