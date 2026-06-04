/**
 * 配置读写
 *
 * 设计文档：../design.md §4.1 / §9
 * 存储位置：~/.pi/budget.json
 *
 * 状态：🚧 scaffold-only
 */

import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_PATH = join(homedir(), ".pi", "budget.json");

/** design.md §4.1 */
export interface BudgetConfig {
  session?: { usd?: number; tokens?: number; minutes?: number };
  project?: { usdPerDay?: number; usdPerWeek?: number };
  global?: { usdPerMonth?: number };

  onSoftLimit: "notify" | "pause" | "downgrade";
  onHardLimit: "pause" | "abort";
  downgradeTo?: string;

  softLimitRatio: number; // default 0.8
  hardLimitRatio: number; // default 1.0
}

export const DEFAULT_CONFIG: BudgetConfig = {
  onSoftLimit: "notify",
  onHardLimit: "pause",
  softLimitRatio: 0.8,
  hardLimitRatio: 1.0,
};

/** 读配置；文件不存在则返回 DEFAULT_CONFIG。 */
export function loadConfig(_path: string = CONFIG_PATH): BudgetConfig {
  // TODO(MVP): readFile + JSON.parse + merge with DEFAULT_CONFIG
  //            文件不存在 / 解析失败 → 返回 DEFAULT_CONFIG 并 warn
  throw new Error("loadConfig() not implemented (scaffold-only)");
}

/** 写配置（原子写入：tmp + rename）。 */
export function saveConfig(_config: BudgetConfig, _path: string = CONFIG_PATH): void {
  // TODO(MVP): JSON.stringify + fs.writeFile(tmp) + fs.rename
  throw new Error("saveConfig() not implemented (scaffold-only)");
}
