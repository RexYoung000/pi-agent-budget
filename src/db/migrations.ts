/**
 * SQLite schema migrations
 *
 * 设计文档：../design.md §9（手写 migration，不用 ORM）
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { Database as BetterSqlite3Database } from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "schema.sql");

/** 当前 schema 版本号。变更 schema 时递增。 */
export const CURRENT_VERSION = 1;

/**
 * 跑所有未应用的 migration。
 *
 * v1: 直接 exec schema.sql（CREATE TABLE IF NOT EXISTS）+ 写 schema_migrations
 *
 * 后续版本（v2+）应该改成按 version 顺序应用 ALTER / INSERT。
 */
export function migrate(db: BetterSqlite3Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const applied = new Set(
    db
      .prepare<unknown[], { version: number }>("SELECT version FROM schema_migrations")
      .all()
      .map((r) => r.version),
  );

  if (!applied.has(CURRENT_VERSION)) {
    const sql = readFileSync(SCHEMA_PATH, "utf8");
    db.exec(sql);
    db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
      CURRENT_VERSION,
      Date.now(),
    );
  }
}
