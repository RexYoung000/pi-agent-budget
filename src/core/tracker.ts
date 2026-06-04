/**
 * CostRecord 累计器
 *
 * 设计文档：../../design.md §5.1
 *
 * 状态：🚧 scaffold-only
 */

import type { CostRecord } from "../db/client.js";

export interface Tracker {
  /** 累加一条 CostRecord 到 SQLite。 */
  record(rec: CostRecord): void;

  /** 本会话已花费 USD。 */
  sessionUsd(sessionId: string): number;

  /** 刷新状态栏 widget（由 ui/widget.ts 提供实现）。 */
  refreshWidget(sessionId: string): void;
}

/**
 * 推断触发本次 assistant 消息的 tool（粗粒度）。
 * 实现思路（设计 §5.1）：从 message.content 里的 tool_use block 取最后一条。
 */
export function inferLastTool(_message: { content?: unknown }): string | undefined {
  // TODO(MVP): 遍历 message.content，取最后一个 type === 'tool_use' 的 name
  return undefined;
}

export function createTracker(/* db: BudgetDb, widget: WidgetRenderer */): Tracker {
  // TODO(MVP):
  //   - 注入 db
  //   - 注入 widget renderer
  //   - 提供 in-memory session 累计缓存，避免每条都查 SQL
  throw new Error("createTracker() not implemented (scaffold-only)");
}
