/**
 * /budget export 命令
 *
 * 设计文档：../../design.md §6
 *
 * 用法：
 *   /budget export           # 默认 CSV
 *   /budget export csv
 *   /budget export json
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

import type { BudgetDb, CostRecord } from "../db/client.js";
import { t } from "../i18n/index.js";

export type ExportFormat = "csv" | "json";

export function parseExportFormat(arg: string | undefined): ExportFormat {
  if (arg === "json") return "json";
  return "csv";
}

/**
 * 导出 CostRecord 到文件。
 * 输出位置：~/.pi/budget-export-<timestamp>.{csv|json}
 */
export async function runExport(
  db: BudgetDb,
  format: ExportFormat,
  sessionId: string,
): Promise<string> {
  const rows = db.getAllCosts();

  if (rows.length === 0) {
    return t("report.noData");
  }

  const exportDir = join(homedir(), ".pi");
  mkdirSync(exportDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filePath = join(exportDir, `budget-export-${ts}.${format}`);

  if (format === "json") {
    writeJson(filePath, rows);
  } else {
    writeCsv(filePath, rows);
  }

  return t("export.savedTo", { path: filePath });
}

// ── CSV writer ──

const CSV_HEADER = [
  "id", "sessionId", "projectId", "timestamp",
  "model", "inputTokens", "outputTokens", "cacheRead", "cacheWrite",
  "costInput", "costOutput", "costCacheRead", "costCacheWrite", "costTotal",
  "toolName", "taskId",
].join(",");

function escapeCsvField(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  // 包含逗号、引号或换行 → 用引号包裹，内部引号加倍
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(path: string, rows: CostRecord[]): void {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push([
      escapeCsvField(r.id),
      escapeCsvField(r.sessionId),
      escapeCsvField(r.projectId),
      escapeCsvField(r.timestamp),
      escapeCsvField(r.model),
      escapeCsvField(r.inputTokens),
      escapeCsvField(r.outputTokens),
      escapeCsvField(r.cacheRead),
      escapeCsvField(r.cacheWrite),
      escapeCsvField(r.cost.input),
      escapeCsvField(r.cost.output),
      escapeCsvField(r.cost.cacheRead),
      escapeCsvField(r.cost.cacheWrite),
      escapeCsvField(r.cost.total),
      escapeCsvField(r.toolName ?? ""),
      escapeCsvField(r.taskId ?? ""),
    ].join(","));
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
}

function writeJson(path: string, rows: CostRecord[]): void {
  writeFileSync(path, JSON.stringify(rows, null, 2), "utf8");
}
