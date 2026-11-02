/**
 * /budget report / /budget by 命令
 *
 * 设计文档：../../design.md §6 / §5.3
 *
 * 用法：
 *   /budget report              # 默认 today
 *   /budget report today
 *   /budget report week
 *   /budget report month
 *   /budget report all
 *   /budget by tool
 *   /budget by model
 *   /budget by session
 */

import type { ExtensionUIContext, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import type { BudgetDb } from "../db/client.js";
import { t } from "../i18n/index.js";
import {
  renderReport,
  renderByDimension,
  type ReportRange,
  type ReportInput,
  type ByDimensionInput,
} from "../ui/report.js";

import type { CurrencyCode } from "../core/pricing.js";

export type { ReportRange };
export function parseRange(arg: string | undefined): ReportRange {
  switch ((arg ?? "").trim().toLowerCase()) {
    case "":
    case "today":
      return "today";
    case "week":
      return "week";
    case "month":
      return "month";
    case "all":
      return "all";
    default:
      throw new Error(t("report.unknownRange", { arg: String(arg) }));
  }
}

/** 根据 range + now 算 since（unix ms）。 */
export function rangeToSince(range: ReportRange, now: number = Date.now()): number {
  if (range === "all") return 0;
  const d = new Date(now);
  // today：本地时区当天 00:00
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (range === "today") return startOfDay;
  // week：从本周一开始（周一 00:00）；若想周日开始可改 getDay() 计算
  const dayOfWeek = d.getDay(); // 0=Sun..6=Sat
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  if (range === "week") return startOfDay - mondayOffset * 24 * 60 * 3600 * 1000;
  // month：本月 1 号 00:00
  if (range === "month") return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return 0;
}

/** /budget report <range> 入口。 */
export async function runReport(
  db: BudgetDb,
  range: ReportRange,
  ctx: { ui: Pick<ExtensionUIContext, "notify"> },
  currency: CurrencyCode = "USD",
): Promise<string> {
  const now = Date.now();
  const since = rangeToSince(range, now);

  const totals = db.getTotals(since);
  const sessions = db.countSessions(since);
  const byModel = db.aggregateBy("model", since);
  const byTool = db.aggregateBy("tool", since);

  const input: ReportInput = {
    currency,
    range,
    since,
    until: now,
    totals: {
      usd: totals.usd,
      sessions,
      requests: totals.requests,
    },
    byModel,
    byTool,
  };

  const text = renderReport(input);
  ctx.ui.notify(text, "info");
  return text;
}

/** /budget by <dim> 入口。 */
export async function runBy(
  db: BudgetDb,
  dim: "model" | "tool" | "session",
  range: ReportRange,
  ctx: { ui: Pick<ExtensionUIContext, "notify"> },
  currency: CurrencyCode = "USD",
): Promise<string> {
  const now = Date.now();
  const since = rangeToSince(range, now);

  const totals = db.getTotals(since);
  const rows = db.aggregateBy(dim, since);

  const input: ByDimensionInput = {
    currency,
    dim,
    since,
    until: now,
    totalUsd: totals.usd,
    rows,
  };

  const text = renderByDimension(input);
  ctx.ui.notify(text, "info");
  return text;
}

/** 解析 /budget by 后面的维度参数。 */
export function parseByDim(arg: string | undefined): "model" | "tool" | "session" | undefined {
  switch ((arg ?? "").trim().toLowerCase()) {
    case "model":
    case "models":
      return "model";
    case "tool":
    case "tools":
      return "tool";
    case "session":
    case "sessions":
      return "session";
    default:
      return undefined;
  }
}
