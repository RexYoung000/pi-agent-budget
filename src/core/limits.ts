/**
 * 软限 / 硬限判断
 *
 * 设计文档：../../design.md §5.2
 *
 * 状态：🚧 scaffold-only
 */

import type { BudgetConfig } from "../config.js";

export type LimitLevel = "ok" | "soft" | "hard";

export interface LimitStatus {
  level: LimitLevel;
  dimension: "session" | "project" | "global";
  current: number;     // 已用 USD
  threshold: number;   // 触发阈值（按 ratio 算出）
  budget: number;      // 原始预算
  ratio: number;       // current / budget
}

/**
 * 比较 current/budget 与 softLimitRatio、hardLimitRatio，返回当前 Level。
 *
 *  - ratio < softLimitRatio → "ok"
 *  - softLimitRatio ≤ ratio < hardLimitRatio → "soft"
 *  - ratio ≥ hardLimitRatio → "hard"
 */
export function evaluateLimit(current: number, budget: number, config: BudgetConfig): LimitLevel {
  // TODO(MVP):
  //   if (budget <= 0) return "ok";
  //   const ratio = current / budget;
  //   if (ratio >= config.hardLimitRatio) return "hard";
  //   if (ratio >= config.softLimitRatio) return "soft";
  //   return "ok";
  void current;
  void budget;
  void config;
  throw new Error("evaluateLimit() not implemented (scaffold-only)");
}

/**
 * 跨 session / project / global 三个维度评估，返回最严重的状态。
 * 用于每次 message_end 后调用。
 */
export function checkLimits(_sessionId: string, _projectId: string, _config: BudgetConfig): LimitStatus | undefined {
  // TODO(MVP): 查 db.sumSessionUsd / sumProjectUsd / global，逐维度评估
  throw new Error("checkLimits() not implemented (scaffold-only)");
}

/**
 * 颜色映射，供 ui/widget.ts 使用。
 *
 *  ok    → "success"
 *  soft  → "warning"
 *  hard  → "error"
 *  < 60% → "accent"（绿色基调）
 */
export function levelToThemeColor(_level: LimitLevel, _ratio: number): string {
  throw new Error("levelToThemeColor() not implemented (scaffold-only)");
}
