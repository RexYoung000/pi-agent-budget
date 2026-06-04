/**
 * /budget report 命令
 *
 * 设计文档：../../design.md §6 / §5.3
 *
 * 用法：
 *   /budget report              # 默认 today
 *   /budget report today
 *   /budget report week
 *   /budget report month
 *   /budget by tool
 *   /budget by model
 *
 * 状态：🚧 scaffold-only
 */

import { renderReport, type ReportRange, fmtUsd } from "../ui/report.js";

export function parseRange(arg: string | undefined): ReportRange {
  switch (arg) {
    case "today":
    case undefined:
      return "today";
    case "week":
      return "week";
    case "month":
      return "month";
    case "all":
      return "all";
    default:
      throw new Error(`Unknown range: ${arg}. Use today/week/month/all.`);
  }
}

/** /budget report <range> 入口。 */
export async function runReport(_range: ReportRange, _sessionId: string): Promise<string> {
  // TODO(MVP):
  //   - 根据 range 算 since/until（now()）
  //   - 从 db 取 totals + byModel + byTool
  //   - 调 renderReport() 返回多行字符串
  //   - 通过 ctx.ui.notify(..., "info") 或 ctx.ui.custom() 渲染
  void renderReport;
  void fmtUsd;
  throw new Error("runReport() not implemented (scaffold-only)");
}

/** /budget by <dim> 入口。 */
export async function runBy(_dim: "model" | "tool" | "session", _sessionId: string): Promise<string> {
  throw new Error("runBy() not implemented (scaffold-only)");
}
