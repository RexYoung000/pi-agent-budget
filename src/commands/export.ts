/**
 * /budget export 命令
 *
 * 设计文档：../../design.md §6
 *
 * 用法：
 *   /budget export           # 默认 CSV
 *   /budget export csv
 *   /budget export json
 *
 * 状态：🚧 scaffold-only
 */

export type ExportFormat = "csv" | "json";

export function parseExportFormat(arg: string | undefined): ExportFormat {
  if (arg === "json") return "json";
  return "csv"; // default
}

/**
 * 导出当前 session 的全部 CostRecord。
 * 输出文件位置：~/.pi/budget-export-<sessionId>-<timestamp>.{csv|json}
 */
export async function runExport(_format: ExportFormat, _sessionId: string): Promise<string> {
  // TODO(MVP):
  //   - 从 db 取 rows
  //   - CSV: 写 header + 行（注意转义逗号 / 引号）
  //   - JSON: JSON.stringify(rows, null, 2)
  //   - 返回文件路径给用户
  throw new Error("runExport() not implemented (scaffold-only)");
}
