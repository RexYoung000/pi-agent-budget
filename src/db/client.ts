/**
 * SQLite 客户端封装（better-sqlite3）
 *
 * 设计文档：../design.md §4.4 / §9
 *
 * 状态：🚧 scaffold-only
 *
 * 注意：better-sqlite3 是原生模块，安装需要编译环境，详见 README "安装须知"。
 */

import type { Database as BetterSqlite3Database } from "better-sqlite3";

// ──────────────────────────────────────────────────────────────────────────
// Types（与 schema.sql 一一对应）
// ──────────────────────────────────────────────────────────────────────────

/** design.md §4.2 */
export interface CostRecord {
  id: string;
  sessionId: string;
  projectId: string;
  timestamp: number;

  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;

  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };

  toolName?: string;
  taskId?: string;
}

export interface BudgetRow {
  scope: "session" | "project" | "global";
  scopeId: string;
  dimension: string;
  amount: number;
  updatedAt: number;
}

export interface AlertRow {
  id: string;
  timestamp: number;
  level: "soft" | "hard" | "anomaly";
  dimension: "session" | "project" | "global";
  currentValue: number;
  threshold: number;
  message: string;
  resolvedAction?: "continue" | "downgrade" | "abort" | "raised_budget";
}

// ──────────────────────────────────────────────────────────────────────────
// Client
// ──────────────────────────────────────────────────────────────────────────

export class BudgetDb {
  /** SQLite file path. Default: ~/.pi/budget.db */
  static defaultPath = "~/.pi/budget.db"; // TODO: resolve home dir at runtime

  private constructor(private readonly db: BetterSqlite3Database) {}

  /** Open (or create) the database and run migrations. */
  static async open(_path?: string): Promise<BudgetDb> {
    // TODO(MVP): 动态 import("better-sqlite3") 后 new Database(path)
    //            并调用 migrations.ts 跑 schema.sql
    throw new Error("BudgetDb.open() not implemented (scaffold-only)");
  }

  // ── CostRecord ───────────────────────────────────────────────────────
  insertCost(_record: CostRecord): void {
    // TODO(MVP): INSERT INTO costs ...
    throw new Error("not implemented");
  }

  /** 按 session 累计 USD。 */
  sumSessionUsd(_sessionId: string): number {
    // TODO(MVP): SELECT SUM(cost_total) FROM costs WHERE session_id = ?
    throw new Error("not implemented");
  }

  /** 按 project + 时间窗口累计。 */
  sumProjectUsd(_projectId: string, _since: number): number {
    throw new Error("not implemented");
  }

  /** 按 model/tool 维度切片（用于 /budget report）。 */
  aggregateBy(_dimension: "model" | "tool" | "session", _since: number): Array<{ key: string; total: number; count: number }> {
    throw new Error("not implemented");
  }

  // ── Budgets ──────────────────────────────────────────────────────────
  setBudget(_row: Omit<BudgetRow, "updatedAt">): void {
    throw new Error("not implemented");
  }

  getBudget(_scope: BudgetRow["scope"], _scopeId: string): BudgetRow[] {
    throw new Error("not implemented");
  }

  unsetBudget(_scope: BudgetRow["scope"], _scopeId: string, _dimension?: string): void {
    throw new Error("not implemented");
  }

  // ── Alerts ───────────────────────────────────────────────────────────
  insertAlert(_row: AlertRow): void {
    throw new Error("not implemented");
  }

  listAlerts(_since?: number, _limit?: number): AlertRow[] {
    throw new Error("not implemented");
  }

  close(): void {
    // TODO(MVP): this.db.close()
    throw new Error("not implemented");
  }
}
