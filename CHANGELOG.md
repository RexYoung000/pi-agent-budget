# Changelog

本文件记录 pi-agent-budget 的用户可见变更。0.1.7 之前的版本未单独记录条目。

## [0.1.7] - 2026-11-01

### Changed

- **数据层从 `better-sqlite3` 迁移到 Node 内置 `node:sqlite`**：删掉唯一的原生依赖，
  安装不再需要编译工具链（Xcode CLT / build-essential）、不再联网下载预编译二进制，
  也不会因为网络或工具链缺失导致安装失败。数据库文件仍是 `~/.pi/budget.db`，
  已有数据无需迁移。
- README 与 `design.md` 同步移除原生依赖说明，改为声明 Node.js 22.13+ 要求
  （pi 本身要求 Node 22.19+，实际不影响现有用户）。

### Removed

- `dependencies.better-sqlite3`
- `devDependencies.@types/better-sqlite3`
