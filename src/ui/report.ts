/**
 * /budget report 文本报表渲染
 *
 * 设计文档：../../design.md §5.3
 *
 * MVP 阶段：纯文本 + ASCII 条形图（不做 TUI 图表）
 */

import { t } from "../i18n/index.js";
import type { Translations } from "../i18n/locales.js";

import { formatUsdInCurrency, type CurrencyCode } from "../core/pricing.js";

export type ReportRange = "today" | "week" | "month" | "all";

export interface ReportInput {
  currency?: CurrencyCode;
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

/** range 标题（i18n）。 */
function rangeTitle(range: ReportRange): string {
  const key: keyof Translations = `report.range.${range}` as keyof Translations;
  return t(key);
}

/** 维度标签（i18n）。 */
function dimLabel(dim: "model" | "tool" | "session"): string {
  const key: keyof Translations = `report.col.${dim}` as keyof Translations;
  return t(key);
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
function renderRow(label: string, total: number, sum: number, maxLabelWidth: number, currency: CurrencyCode): string {
  const pct = sum > 0 ? (total / sum) * 100 : 0;
  const pctStr = pct.toFixed(0).padStart(2, " ");
  const bar = renderBar(pct / 100, 12);
  return `  ${padRight(label, maxLabelWidth)}  ${formatUsdInCurrency(total, currency).padStart(7)}  (${pctStr}%) ${bar}`;
}

/** 主渲染函数：返回多行字符串。 */
export function renderReport(input: ReportInput): string {
  const lines: string[] = [];
  const money = (usd: number) => formatUsdInCurrency(usd, input.currency ?? "USD");

  // header
  lines.push(`📦 ${rangeTitle(input.range)} (${fmtDate(input.until)})`);
  lines.push("─".repeat(40));

  // totals
  const avg = input.totals.sessions > 0 ? input.totals.usd / input.totals.sessions : 0;
  lines.push(
    `${t("report.header.total")}: ${money(input.totals.usd)}  ` +
    `${t("report.header.sessions")}: ${input.totals.sessions}  ` +
    `${t("report.header.requests")}: ${input.totals.requests}  ` +
    `${t("report.header.avgPerSession")}: ${money(avg)}`,
  );

  // by model
  if (input.byModel.length > 0) {
    lines.push("");
    lines.push(`${t("report.byModel")}:`);
    const sum = input.byModel.reduce((s, r) => s + r.total, 0);
    const maxLabel = Math.max(...input.byModel.map((r) => r.key.length), 8);
    for (const r of input.byModel) {
      lines.push(renderRow(r.key || t("report.unknown"), r.total, sum, maxLabel, input.currency ?? "USD"));
    }
  } else {
    lines.push("");
    lines.push(`${t("report.byModel")}: (${t("report.noData")})`);
  }

  // by tool
  if (input.byTool.length > 0) {
    lines.push("");
    lines.push(`${t("report.byTool")}:`);
    const sum = input.byTool.reduce((s, r) => s + r.total, 0);
    const visible = input.byTool.filter((r) => r.key);
    const maxLabel = Math.max(...visible.map((r) => r.key.length), 8);
    for (const r of input.byTool) {
      if (!r.key) continue;
      lines.push(renderRow(r.key, r.total, sum, maxLabel, input.currency ?? "USD"));
    }
    const noTool = input.byTool.find((r) => !r.key);
    if (noTool) {
      lines.push(renderRow(t("report.noTool"), noTool.total, sum, maxLabel, input.currency ?? "USD"));
    }
  } else {
    lines.push("");
    lines.push(`${t("report.byTool")}: (${t("report.noData")})`);
  }

  return lines.join("\n");
}

/** 单维度切片子报表（用于 /budget by <dim>）。 */
export interface ByDimensionInput {
  currency?: CurrencyCode;
  dim: "model" | "tool" | "session";
  since: number;
  until: number;
  totalUsd: number;
  rows: Array<{ key: string; total: number; count: number }>;
}

export function renderByDimension(input: ByDimensionInput): string {
  const money = (usd: number) => formatUsdInCurrency(usd, input.currency ?? "USD");
  const label = dimLabel(input.dim);
  const lines: string[] = [];

  lines.push(`📊 ${t("report.byDim", { dim: label })} (${fmtDate(input.since)} → ${fmtDate(input.until)})`);
  lines.push("─".repeat(40));
  lines.push(
    `${t("report.header.total")}: ${money(input.totalUsd)}  ` +
    `${t("report.header.requests")}: ${input.rows.reduce((s, r) => s + r.count, 0)}`,
  );

  if (input.rows.length === 0) {
    lines.push("");
    lines.push(`(${t("report.noData")})`);
    return lines.join("\n");
  }

  lines.push("");
  const visible = input.rows.filter((r) => r.key);
  const noKey = input.rows.find((r) => !r.key);
  const maxLabel = Math.max(...visible.map((r) => r.key.length), 8);

  for (const r of visible) {
    lines.push(renderRow(r.key, r.total, input.totalUsd, maxLabel, input.currency ?? "USD"));
  }
  if (noKey) {
    lines.push(renderRow(`(${label.toLowerCase()}?)`, noKey.total, input.totalUsd, maxLabel, input.currency ?? "USD"));
  }

  return lines.join("\n");
}
