/**
 * 状态栏 widget
 *
 * 设计文档：../../design.md §5.1 + widget 可配置体系
 *
 * 支持：
 *   - 放置位置：aboveEditor / belowEditor
 *   - compact 模式：只显示成本
 *   - 可选：模型名、进度条、上下文窗口
 *   - 颜色随预算消耗变化
 */

import type { ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";

import type { WidgetConfig } from "../config.js";

export type WidgetLevel = "ok" | "warn" | "soft" | "hard";

export interface WidgetState {
  model: string;
  usedUsd: number;
  budgetUsd: number;
  /** 上下文窗口使用情况（来自 pi getContextUsage） */
  context?: {
    tokens: number | null;
    contextWindow: number;
    percent: number | null;
  };
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

export function shortModelName(model: string): string {
  if (!model) return "?";
  return model.split("/").pop() ?? model;
}

export function renderProgressBar(ratio: number, width: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

/** 渲染上下文窗口：📊 28K/200K (14%) */
export function renderContextLine(ctx: NonNullable<WidgetState["context"]>): string {
  const { tokens, contextWindow, percent } = ctx;
  const tokStr = tokens != null ? fmtContextTokens(tokens) : "?";
  const winStr = fmtContextTokens(contextWindow);
  const pctStr = percent != null ? ` (${Math.round(percent)}%)` : "";
  return `📊 ${tokStr}/${winStr}${pctStr}`;
}

function fmtContextTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** 核心：生成 widget 行列表（供 setWidget 消费） */
export function renderWidgetLines(state: WidgetState, wc: WidgetConfig, theme?: Theme): string[] {
  const level = computeLevel(state);
  const color = LEVEL_COLOR[level];
  const sym = wc.currencySymbol ?? "$";

  const dot = level === "hard" ? "🔴" : level === "soft" ? "🟠" : level === "warn" ? "🟡" : "🟢";

  // compact 模式：只显示成本
  if (wc.compact) {
    const parts: string[] = [];
    parts.push(dot);
    parts.push(`${sym}${state.usedUsd.toFixed(2)}`);
    if (state.budgetUsd > 0) {
      parts.push(`/${sym}${state.budgetUsd.toFixed(2)}`);
    }
    return [maybeColor(theme, color, parts.join(" "))];
  }

  // 完整模式：逐元素拼接
  const parts: string[] = [];

  // 模型名
  if (wc.showModel !== false) {
    parts.push(shortModelName(state.model));
  } else {
    parts.push(dot);
  }

  // 成本
  const costParts: string[] = [];
  if (wc.showModel === false) costParts.push(dot);
  costParts.push(`${sym}${state.usedUsd.toFixed(2)}`);
  if (state.budgetUsd > 0) {
    costParts.push(`/${sym}${state.budgetUsd.toFixed(2)}`);
    // 进度条
    if (wc.showProgressBar !== false) {
      const bar = renderProgressBar(state.usedUsd / state.budgetUsd, 10);
      costParts.push(bar);
    }
  }
  parts.push(costParts.join(" "));

  const mainLine = maybeColor(theme, color, parts.join(" │ "));
  const lines: string[] = [];

  // 上下文窗口（附加到同一行，横排）
  if (wc.showContextWindow && state.context) {
    const ctxLine = renderContextLine(state.context);
    // 主信息用 level 颜色，上下文窗口保持 dim
    lines.push(mainLine + "  " + maybeColor(theme, "dim", ctxLine));
  } else {
    lines.push(mainLine);
  }

  return lines;
}

function maybeColor(theme: Theme | undefined, color: string, text: string): string {
  if (!theme) return text;
  return theme.fg(color as Parameters<Theme["fg"]>[0], text);
}

// ──────────────────────────────────────────────────────────────────
// Widget 注册 / 刷新句柄
// ──────────────────────────────────────────────────────────────────

export interface WidgetRefresher {
  refresh(state: WidgetState | null): void;
  clear(): void;
}

export function createWidgetRenderer(opts: {
  ui: Pick<ExtensionUIContext, "setWidget">;
  config?: WidgetConfig;
}): WidgetRefresher {
  const wc = opts.config ?? {};
  const placement = wc.placement === "aboveEditor" ? "aboveEditor" : "belowEditor";

  return {
    refresh(state) {
      if (!state) {
        opts.ui.setWidget("pi-budget", undefined);
        return;
      }
      opts.ui.setWidget(
        "pi-budget",
        (_tui, theme) => {
          const lines = renderWidgetLines(state, wc, theme);
          return {
            render(_width: number) {
              return lines;
            },
            invalidate() {},
          };
        },
        { placement },
      );
    },
    clear() {
      opts.ui.setWidget("pi-budget", undefined);
    },
  };
}
