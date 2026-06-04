/**
 * 配置读写
 *
 * 设计文档：../../design.md §4.1 / §9
 * 存储位置：~/.pi/budget.json
 */

import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";

export const CONFIG_PATH = join(homedir(), ".pi", "budget.json");

/** design.md §4.1 + MVP 第 5 项逃生口 */
export interface BudgetConfig {
  session?: { usd?: number; tokens?: number; minutes?: number };
  project?: { usdPerDay?: number; usdPerWeek?: number };
  global?: { usdPerMonth?: number };

  onSoftLimit: "notify" | "pause" | "downgrade";
  onHardLimit: "pause" | "abort";
  downgradeTo?: string;

  softLimitRatio: number; // default 0.8
  hardLimitRatio: number; // default 1.0

  /** 手填 projectId，覆盖 git remote / cwd 自动识别。救命逃生口。 */
  projectIdOverride?: string;

  /** 调试日志开关。开启后写入 ~/.pi/logs/budget.log。 */
  debug?: boolean;
}

export const DEFAULT_CONFIG: BudgetConfig = {
  onSoftLimit: "notify",
  onHardLimit: "pause",
  softLimitRatio: 0.8,
  hardLimitRatio: 1.0,
};

/** 读配置；文件不存在 / 解析失败 → 返回 DEFAULT_CONFIG（不抛错，不让扩展崩）。 */
export function loadConfig(path: string = CONFIG_PATH): BudgetConfig {
  try {
    if (!existsSync(path)) return { ...DEFAULT_CONFIG };
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<BudgetConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    // 不让配置错误把扩展搞崩
    console.warn(`[pi-budget] loadConfig 失败，使用默认值: ${(err as Error).message}`);
    return { ...DEFAULT_CONFIG };
  }
}

/** 写配置（原子写入：tmp + rename）。 */
export function saveConfig(config: BudgetConfig, path: string = CONFIG_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(config, null, 2), "utf8");
  renameSync(tmp, path);
}
