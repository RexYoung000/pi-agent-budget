/**
 * CostRecord 累计器
 *
 * 设计文档：../../design.md §5.1
 */

import { randomUUID } from "node:crypto";

import type { BudgetDb, CostRecord } from "../db/client.js";

export interface Tracker {
  /** 累加一条 CostRecord 到 SQLite。 */
  record(rec: Omit<CostRecord, "id" | "timestamp"> & Partial<Pick<CostRecord, "id" | "timestamp">>): void;

  /** 本会话已花费 USD（走内存缓存，避免每条都查 SQL）。 */
  sessionUsd(sessionId: string): number;

  /** 让缓存立即与 DB 对齐（例如 widget 刷新前调用）。 */
  refreshSession(sessionId: string): number;

  /** 注入 widget 刷新回调。 */
  setWidgetRefresher(fn: ((sessionId: string) => void) | null): void;

  /** 刷新状态栏 widget（如果有）。 */
  refreshWidget(sessionId: string): void;
}

/**
 * 从 assistant message.content 中取最后一条 tool_use 块的 name。
 * 设计 §5.1：message_end 时 content 已完整，无需"推断"。
 */
export function lastToolName(message: { content?: unknown }): string | undefined {
  const content = message.content;
  if (!Array.isArray(content)) return undefined;
  for (let i = content.length - 1; i >= 0; i--) {
    const block = content[i] as { type?: string; name?: string } | null;
    if (block && block.type === "tool_use" && typeof block.name === "string") {
      return block.name;
    }
  }
  return undefined;
}

export function createTracker(db: BudgetDb): Tracker {
  // session 级 USD 内存缓存，避免每条 cost 都查 SUM
  const sessionCache = new Map<string, number>();
  let widgetRefresher: ((sessionId: string) => void) | null = null;

  return {
    record(rec) {
      const full: CostRecord = {
        id: rec.id ?? randomUUID(),
        timestamp: rec.timestamp ?? Date.now(),
        sessionId: rec.sessionId,
        projectId: rec.projectId,
        model: rec.model,
        inputTokens: rec.inputTokens,
        outputTokens: rec.outputTokens,
        cacheRead: rec.cacheRead,
        cacheWrite: rec.cacheWrite,
        cost: rec.cost,
        toolName: rec.toolName,
        taskId: rec.taskId,
      };
      db.insertCost(full);
      sessionCache.set(
        full.sessionId,
        (sessionCache.get(full.sessionId) ?? 0) + full.cost.total,
      );
    },

    sessionUsd(sessionId) {
      if (sessionCache.has(sessionId)) return sessionCache.get(sessionId)!;
      const sum = db.sumSessionUsd(sessionId);
      sessionCache.set(sessionId, sum);
      return sum;
    },

    refreshSession(sessionId) {
      const sum = db.sumSessionUsd(sessionId);
      sessionCache.set(sessionId, sum);
      return sum;
    },

    setWidgetRefresher(fn) {
      widgetRefresher = fn;
    },

    refreshWidget(sessionId) {
      try {
        widgetRefresher?.(sessionId);
      } catch {
        // widget 刷新失败不影响主流程
      }
    },
  };
}
