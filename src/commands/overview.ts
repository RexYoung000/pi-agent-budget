/**
 * /budget 总览命令
 *
 * 设计文档：../../design.md §6（命令清单第一条）/ §5.1
 *
 * 用法：
 *   /budget              # 当前会话实时概览（本命令）
 */

import type { LimitStatus } from "../core/limits.js";
import { t } from "../i18n/index.js";
import { renderProgressBar } from "../ui/widget.js";

export interface OverviewInput {
  sessionId: string;
  usedUsd: number;
  budgetUsd?: number;
  model?: string;
  lastRequest?: {
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
  };
  status?: LimitStatus;
}

/** 根据 LimitLevel + ratio 返回 emoji icon（与 widget 颜色映射一致）。 */
export function iconForLevel(level?: LimitStatus["level"], ratio?: number): string {
  if (level === "hard") return "🔴";
  if (level === "soft") return "🟠";
  if ((ratio ?? 0) >= 0.6) return "🟡";
  return "🟢";
}

/** 1000 → "1.0k"，1500 → "1.5k"，便于在状态行里节省宽度。 */
export function fmtTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * 渲染 /budget 总览（多行字符串）。纯展示函数，便于单元测试。
 */
export function renderOverview(input: OverviewInput): string {
  const lines: string[] = [];

  if (input.budgetUsd && input.budgetUsd > 0) {
    const ratio = input.usedUsd / input.budgetUsd;
    const pct = Math.round(ratio * 100);
    const bar = renderProgressBar(ratio, 12);
    lines.push(
      `${t("overview.session")}:  $${input.usedUsd.toFixed(2)} / $${input.budgetUsd.toFixed(2)}  (${pct}%) ${bar}`,
    );
    if (input.model) lines.push(`${t("overview.model")}:    ${input.model}`);
    if (input.lastRequest) {
      lines.push(
        `${t("overview.last")}:     $${input.lastRequest.costUsd.toFixed(4)} (in ${fmtTokens(
          input.lastRequest.inputTokens,
        )} / out ${fmtTokens(input.lastRequest.outputTokens)})`,
      );
    }
    const icon = iconForLevel(input.status?.level, ratio);
    lines.push(`${t("overview.status")}:   ${icon} ${input.status?.level ?? "ok"}`);

    if (input.lastRequest && input.lastRequest.costUsd > 0) {
      const remaining = Math.max(0, input.budgetUsd - input.usedUsd);
      const est = Math.floor(remaining / input.lastRequest.costUsd);
      lines.push("");
      lines.push(t("overview.estRemaining", { count: est }));
    }
  } else {
    lines.push(`${t("overview.session")}:  $${input.usedUsd.toFixed(2)} (${t("overview.noBudget")})`);
    if (input.model) lines.push(`${t("overview.model")}:    ${input.model}`);
    lines.push("");
    lines.push(t("overview.hintSetBudget"));
  }

  return lines.join("\n");
}
