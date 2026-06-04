-- pi-agent-budget SQLite schema
-- 存储路径：~/.pi/budget.db
--
-- 设计文档：../../design.md §4
--
-- ⚠️ scaffold-only：此 schema 尚未被 client.ts 加载。

-- ──────────────────────────────────────────────────────────────────────────
-- costs: 每一次 assistant message 的成本快照
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS costs (
  id              TEXT PRIMARY KEY,            -- uuid
  session_id      TEXT NOT NULL,
  project_id      TEXT NOT NULL,               -- git remote hash 或 cwd hash
  timestamp       INTEGER NOT NULL,            -- unix ms

  model           TEXT NOT NULL,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  cache_read      INTEGER NOT NULL DEFAULT 0,
  cache_write     INTEGER NOT NULL DEFAULT 0,

  cost_input      REAL NOT NULL DEFAULT 0,
  cost_output     REAL NOT NULL DEFAULT 0,
  cost_cache_read REAL NOT NULL DEFAULT 0,
  cost_cache_write REAL NOT NULL DEFAULT 0,
  cost_total      REAL NOT NULL DEFAULT 0,

  tool_name       TEXT,                        -- 触发本次成本的 tool（粗粒度）
  task_id         TEXT                         -- 关联 plan step（可选）
);

CREATE INDEX IF NOT EXISTS idx_costs_session_ts ON costs (session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_costs_project_ts ON costs (project_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_costs_model_ts   ON costs (model, timestamp);

-- ──────────────────────────────────────────────────────────────────────────
-- budgets: 用户配置的预算（按 scope 区分）
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  scope        TEXT NOT NULL,                  -- 'session' | 'project' | 'global'
  scope_id     TEXT NOT NULL,                  -- session_id / project_id / 'global'
  dimension    TEXT NOT NULL,                  -- 'usd' | 'tokens' | 'minutes' | 'usdPerDay' ...
  amount       REAL NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (scope, scope_id, dimension)
);

-- ──────────────────────────────────────────────────────────────────────────
-- alerts: 历史告警（用于 /budget alerts）
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT PRIMARY KEY,
  timestamp       INTEGER NOT NULL,
  level           TEXT NOT NULL,               -- 'soft' | 'hard' | 'anomaly'
  dimension       TEXT NOT NULL,               -- 'session' | 'project' | 'global'
  current_value   REAL NOT NULL,
  threshold       REAL NOT NULL,
  message         TEXT NOT NULL,
  resolved_action TEXT                         -- 'continue' | 'downgrade' | 'abort' | 'raised_budget'
);

CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts (timestamp);
