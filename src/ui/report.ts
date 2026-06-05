/**
 * /budget report 文本报表渲染
 *
 * 设计文档：../../design.md §5.3
 *
 * MVP 阶段：纯文本 + ASCII 条形图（不做 TUI 图表）
 */

export type ReportRange = "today" | "week" | "month" | "all";

export interface ReportInput {
  range: ReportRange;
  since: number; // unix ms
  until: number; // unix ms
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

/** range 标题（中文化）。 */
function rangeTitle(range: ReportRange): string {
  switch (range) {
    case "today":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "all":
      return "All Time";
  }
}

/** 把时间戳转成 yyyy-mm-dd 字符串（本地时区）。 */
function fmtDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 对齐的工具函数：把字符串左对齐到固定宽度。 */
function padRight(s: string, width: number): string {
  if (s.length >= width) return s;
  return s + " ".repeat(width - s.length);
}

/** 渲染单条 by-xxx 行（含百分比 + 进度条）。 */
function renderRow(label: string, total: number, sum: number, maxLabelWidth: number): string {
  const pct = sum > 0 ? (total / sum) * 100 : 0;
  const pctStr = pct.toFixed(0).padStart(2, " ");
  const bar = renderBar(pct / 100, 12);
  return `  ${padRight(label, maxLabelWidth)}  ${fmtUsd(total).padStart(7)}  (${pctStr}%) ${bar}`;
}

/** 主渲染函数：返回多行字符串。 */
export function renderReport(input: ReportInput): string {
  const lines: string[] = [];

  // header
  lines.push(`📦 ${rangeTitle(input.range)} (${fmtDate(input.until)})`);
  lines.push("─".repeat(40));

  // totals
  const avg = input.totals.sessions > 0 ? input.totals.usd / input.totals.sessions : 0;
  lines.push(
    `Total: ${fmtUsd(input.totals.usd)}  Sessions: ${input.totals.sessions}  Requests: ${input.totals.requests}  Avg/Session: ${fmtUsd(avg)}`,
  );

  // by model
  if (input.byModel.length > 0) {
    lines.push("");
    lines.push("By Model:");
    const sum = input.byModel.reduce((s, r) => s + r.total, 0);
    const maxLabel = Math.max(...input.byModel.map((r) => r.key.length), 8);
    for (const r of input.byModel) {
      lines.push(renderRow(r.key || "(unknown)", r.total, sum, maxLabel));
    }
  } else {
    lines.push("");
    lines.push("By Model: (no data)");
  }

  // by tool
  if (input.byTool.length > 0) {
    lines.push("");
    lines.push("By Tool:");
    const sum = input.byTool.reduce((s, r) => s + r.total, 0);
    // tool_name 可能是 null（聚合后会得到空 key），过滤
    const visible = input.byTool.filter((r) => r.key);
    const maxLabel = Math.max(...visible.map((r) => r.key.length), 8);
    for (const r of input.byTool) {
      if (!r.key) continue; // 跳过无 tool 的请求
      lines.push(renderRow(r.key, r.total, sum, maxLabel));
    }
    // 把无 tool 的累计单独显示
    const noTool = input.byTool.find((r) => !r.key);
    if (noTool) {
      lines.push(renderRow("(no tool)", noTool.total, sum, maxLabel));
    }
  } else {
    lines.push("");
    lines.push("By Tool: (no data)");
  }

  return lines.join("\n");
}

/** 单维度切片子报表（用于 /budget by <dim>）。 */
export interface ByDimensionInput {
  dim: "model" | "tool" | "session";
  since: number;
  until: number;
  totalUsd: number;
  rows: Array<{ key: string; total: number; count: number }>;
}

export function renderByDimension(input: ByDimensionInput): string {
  const dimLabel = { model: "Model", tool: "Tool", session: "Session" }[input.dim];
  const lines: string[] = [];

  lines.push(`📊 By ${dimLabel} (${fmtDate(input.since)} → ${fmtDate(input.until)})`);
  lines.push("─".repeat(40));
  lines.push(`Total: ${fmtUsd(input.totalUsd)}  Requests: ${input.rows.reduce((s, r) => s + r.count, 0)}`);

  if (input.rows.length === 0) {
    lines.push("");
    lines.push("(no data)");
    return lines.join("\n");
  }

  lines.push("");
  const visible = input.rows.filter((r) => r.key);
  const noKey = input.rows.find((r) => !r.key);
  const maxLabel = Math.max(...visible.map((r) => r.key.length), 8);

  for (const r of visible) {
    lines.push(renderRow(r.key, r.total, input.totalUsd, maxLabel));
  }
  if (noKey) {
    lines.push(renderRow(`(no ${dimLabel.toLowerCase()})`, noKey.total, input.totalUsd, maxLabel));
  }

  return lines.join("\n");
}
