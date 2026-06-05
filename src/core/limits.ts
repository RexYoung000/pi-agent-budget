/**
 * 软限 / 硬限判断
 *
 * 设计文档：../../design.md §5.2
 */

import type { BudgetConfig } from "../config.js";

export type LimitLevel = "ok" | "soft" | "hard";

export interface LimitStatus {
  level: LimitLevel;
  dimension: "session" | "project" | "global";
  current: number; // 已用 USD
  threshold: number; // 触发阈值（按 ratio 算出）
  budget: number; // 原始预算
  ratio: number; // current / budget
}

/**
 * 比较 current/budget 与 softLimitRatio、hardLimitRatio，返回当前 Level。
 *
 *  - budget <= 0           → "ok"（未设预算，永不触发）
 *  - ratio ≥ hardLimitRatio → "hard"
 *  - ratio ≥ softLimitRatio → "soft"
 *  - 否则                   → "ok"
 */
export function evaluateLimit(current: number, budget: number, config: BudgetConfig): LimitLevel {
  if (!budget || budget <= 0) return "ok";
  const ratio = current / budget;
  if (ratio >= config.hardLimitRatio) return "hard";
  if (ratio >= config.softLimitRatio) return "soft";
  return "ok";
}

/**
 * 检查 session 维度限额，返回状态（MVP 只做 session；project/global 留 v2）。
 *
 * 调用方需要传入 sumSessionUsd 的结果（避免 limits 模块直接依赖 db）。
 */
export function checkSessionLimit(
  usedUsd: number,
  budgetUsd: number,
  config: BudgetConfig,
): LimitStatus | undefined {
  if (!budgetUsd || budgetUsd <= 0) return undefined;
  const ratio = usedUsd / budgetUsd;
  const level = evaluateLimit(usedUsd, budgetUsd, config);
  const threshold =
    level === "hard" ? budgetUsd * config.hardLimitRatio : budgetUsd * config.softLimitRatio;
  return {
    level,
    dimension: "session",
    current: usedUsd,
    threshold,
    budget: budgetUsd,
    ratio,
  };
}
