/**
 * SQLite 客户端封装（node:sqlite，Node 22.13+ 内置模块）
 *
 * 设计文档：../design.md §4.4 / §9
 */

import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

import { type DatabaseSync } from "node:sqlite";
import { migrate } from "./migrations.js";

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

export interface AggregateRow {
  key: string;
  total: number;
  count: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Client
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_DB_DIR = join(homedir(), ".pi");
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, "budget.db");

export class BudgetDb {
  /** SQLite file path. Default: ~/.pi/budget.db */
  static defaultPath = DEFAULT_DB_PATH;

  private constructor(private readonly db: DatabaseSync) {}

  /** Open (or create) the database and run migrations. */
  static async open(path: string = DEFAULT_DB_PATH): Promise<BudgetDb> {
    // 确保目录存在
    const dir = resolve(path, "..");
    mkdirSync(dir, { recursive: true });

    // node:sqlite 是 Node 内置模块，零原生依赖、零编译、零网络
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(path);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = NORMAL");

    migrate(db);
    return new BudgetDb(db);
  }

  // ── CostRecord ───────────────────────────────────────────────────────

  insertCost(rec: CostRecord): void {
    this.db.prepare(`
      INSERT INTO costs (
        id, session_id, project_id, timestamp,
        model, input_tokens, output_tokens, cache_read, cache_write,
        cost_input, cost_output, cost_cache_read, cost_cache_write, cost_total,
        tool_name, task_id
      ) VALUES (
        @id, @sessionId, @projectId, @timestamp,
        @model, @inputTokens, @outputTokens, @cacheRead, @cacheWrite,
        @costInput, @costOutput, @costCacheRead, @costCacheWrite, @costTotal,
        @toolName, @taskId
      )
    `).run({
      id: rec.id,
      sessionId: rec.sessionId,
      projectId: rec.projectId,
      timestamp: rec.timestamp,
      model: rec.model,
      inputTokens: rec.inputTokens,
      outputTokens: rec.outputTokens,
      cacheRead: rec.cacheRead,
      cacheWrite: rec.cacheWrite,
      costInput: rec.cost.input,
      costOutput: rec.cost.output,
      costCacheRead: rec.cost.cacheRead,
      costCacheWrite: rec.cost.cacheWrite,
      costTotal: rec.cost.total,
      toolName: rec.toolName ?? null,
      taskId: rec.taskId ?? null,
    });
  }

  /** 按 session 累计 USD。 */
  sumSessionUsd(sessionId: string): number {
    const row = this.db
      .prepare("SELECT COALESCE(SUM(cost_total), 0) AS total FROM costs WHERE session_id = ?")
      .get(sessionId) as { total: number | null } | undefined;
    return row?.total ?? 0;
  }

  /** 按 session + model 累计 USD（当前模型在当前会话的消耗）。 */
  sumSessionModelUsd(sessionId: string, model: string): number {
    const row = this.db
      .prepare("SELECT COALESCE(SUM(cost_total), 0) AS total FROM costs WHERE session_id = ? AND model = ?")
      .get(sessionId, model) as { total: number | null } | undefined;
    return row?.total ?? 0;
  }

  /** 按 project + 时间窗口累计。since = 0 表示不限制。 */
  sumProjectUsd(projectId: string, since: number = 0): number {
    const row = this.db
      .prepare("SELECT COALESCE(SUM(cost_total), 0) AS total FROM costs WHERE project_id = ? AND timestamp >= ?")
      .get(projectId, since) as { total: number | null } | undefined;
    return row?.total ?? 0;
  }

  /** 按 model/tool/session 维度切片（用于 /budget report）。since = 0 表示不限制。 */
  aggregateBy(dimension: "model" | "tool" | "session", since: number = 0): AggregateRow[] {
    const column =
      dimension === "model" ? "model" : dimension === "tool" ? "tool_name" : "session_id";
    const stmt = this.db.prepare(`
      SELECT ${column} AS key, COALESCE(SUM(cost_total), 0) AS total, COUNT(*) AS count
      FROM costs
      WHERE timestamp >= ?
      GROUP BY ${column}
      ORDER BY total DESC
    `);
    return stmt.all(since) as unknown as AggregateRow[];
  }

  /** 拿时间窗口内的总 USD + 请求数。 */
  getTotals(since: number = 0): { usd: number; requests: number } {
    const row = this.db
      .prepare("SELECT COALESCE(SUM(cost_total), 0) AS usd, COUNT(*) AS requests FROM costs WHERE timestamp >= ?")
      .get(since) as { usd: number | null; requests: number } | undefined;
    return { usd: row?.usd ?? 0, requests: row?.requests ?? 0 };
  }

  /** 拿时间窗口内独立 session 数（DISTINCT session_id）。 */
  countSessions(since: number = 0): number {
    const row = this.db
      .prepare("SELECT COUNT(DISTINCT session_id) AS n FROM costs WHERE timestamp >= ?")
      .get(since) as { n: number } | undefined;
    return row?.n ?? 0;
  }

  /** 获取所有 CostRecord（用于导出）。支持按时间范围过滤。 */
  getAllCosts(since: number = 0): CostRecord[] {
    const rows = this.db.prepare("SELECT * FROM costs WHERE timestamp >= ? ORDER BY timestamp ASC").all(since) as {
      id: string; session_id: string; project_id: string; timestamp: number;
      model: string; input_tokens: number; output_tokens: number;
      cache_read: number; cache_write: number;
      cost_input: number; cost_output: number; cost_cache_read: number; cost_cache_write: number; cost_total: number;
      tool_name: string | null; task_id: string | null;
    }[];

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      projectId: r.project_id,
      timestamp: r.timestamp,
      model: r.model,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      cacheRead: r.cache_read,
      cacheWrite: r.cache_write,
      cost: {
        input: r.cost_input,
        output: r.cost_output,
        cacheRead: r.cost_cache_read,
        cacheWrite: r.cost_cache_write,
        total: r.cost_total,
      },
      toolName: r.tool_name ?? undefined,
      taskId: r.task_id ?? undefined,
    }));
  }

  // ── Budgets ──────────────────────────────────────────────────────────

  setBudget(row: Omit<BudgetRow, "updatedAt">): void {
    this.db.prepare(`
      INSERT INTO budgets (scope, scope_id, dimension, amount, updated_at)
      VALUES (@scope, @scopeId, @dimension, @amount, @updatedAt)
      ON CONFLICT(scope, scope_id, dimension) DO UPDATE SET
        amount = excluded.amount,
        updated_at = excluded.updated_at
    `).run({
      scope: row.scope,
      scopeId: row.scopeId,
      dimension: row.dimension,
      amount: row.amount,
      updatedAt: Date.now(),
    });
  }

  getBudget(scope: BudgetRow["scope"], scopeId: string): BudgetRow[] {
    return this.db
      .prepare("SELECT scope, scope_id AS scopeId, dimension, amount, updated_at AS updatedAt FROM budgets WHERE scope = ? AND scope_id = ?")
      .all(scope, scopeId) as unknown as BudgetRow[];
  }

  unsetBudget(scope: BudgetRow["scope"], scopeId: string, dimension?: string): void {
    if (dimension) {
      this.db
        .prepare("DELETE FROM budgets WHERE scope = ? AND scope_id = ? AND dimension = ?")
        .run(scope, scopeId, dimension);
    } else {
      this.db
        .prepare("DELETE FROM budgets WHERE scope = ? AND scope_id = ?")
        .run(scope, scopeId);
    }
  }

  // ── Alerts ───────────────────────────────────────────────────────────

  insertAlert(row: AlertRow): void {
    this.db.prepare(`
      INSERT INTO alerts (id, timestamp, level, dimension, current_value, threshold, message, resolved_action)
      VALUES (@id, @timestamp, @level, @dimension, @currentValue, @threshold, @message, @resolvedAction)
    `).run({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      dimension: row.dimension,
      currentValue: row.currentValue,
      threshold: row.threshold,
      message: row.message,
      resolvedAction: row.resolvedAction ?? null,
    });
  }

  listAlerts(since: number = 0, limit: number = 100): AlertRow[] {
    return this.db
      .prepare("SELECT id, timestamp, level, dimension, current_value AS currentValue, threshold, message, resolved_action AS resolvedAction FROM alerts WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ?")
      .all(since, limit) as unknown as AlertRow[];
  }

  close(): void {
    try {
      this.db.close();
    } catch {
      // 忽略重复 close / 已关闭
    }
  }
}
