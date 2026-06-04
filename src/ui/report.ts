/**
 * /budget report 文本报表渲染
 *
 * 设计文档：../../design.md §5.3
 *
 * 状态：🚧 scaffold-only
 *
 * 输出格式（MVP 只做纯文本，不做 TUI 图表）：
 *
 *   📦 Today (2026-06-04)
 *   ─────────────────────────────────────
 *   Total: $4.20  Sessions: 3  Avg: $1.40
 *
 *   By Model:
 *     claude-sonnet-4.5   $3.10  (74%) ████████████
 *     gpt-5               $0.85  (20%) ███
 *     claude-haiku-3.5    $0.25  ( 6%) █
 *
 *   By Tool:
 *     bash                $1.80  (43%) ██████████
 *     read                $0.90  (21%) ████
 *     ...
 */

export type ReportRange = "today" | "week" | "month" | "all";

export interface ReportInput {
  range: ReportRange;
  since: number;
  until: number;
  totals: {
    usd: number;
    sessions: number;
    requests: number;
  };
  byModel: Array<{ key: string; total: number; count: number }>;
  byTool: Array<{ key: string; total: number; count: number }>;
}

/** 格式化 USD，保留 2 位小数。 */
export function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** 渲染 0–1 比例的纯文本进度条，最多 maxWidth 格。 */
export function renderBar(ratio: number, maxWidth = 12): string {
  const r = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(r * maxWidth);
  return "█".repeat(filled) + "░".repeat(maxWidth - filled);
}

/** 主渲染函数：返回多行字符串。 */
export function renderReport(_input: ReportInput): string {
  // TODO(MVP):
  //   - header（日期 / range）
  //   - 总计 + 会话数 + 平均
  //   - by model 横向 bar chart
  //   - by tool  横向 bar chart
  //   - 占比百分比
  throw new Error("renderReport() not implemented (scaffold-only)");
}

/** 按维度（model / tool / session）切片的子报表。 */
export function renderByDimension(_dim: "model" | "tool" | "session", _since: number): string {
  throw new Error("renderByDimension() not implemented (scaffold-only)");
}
