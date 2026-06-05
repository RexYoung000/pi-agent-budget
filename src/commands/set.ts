/**
 * /budget set / unset 命令
 *
 * 设计文档：../../design.md §6
 *
 * 用法：
 *   /budget set 2.00              # 设置本会话预算 $2
 *   /budget set project 10        # 设置项目日预算 $10（v2 才完整生效，MVP 仅记录）
 *   /budget unset                 # 清除本会话预算
 *   /budget unset all             # 清除所有预算
 */

import type { BudgetConfig } from "../config.js";
import { saveConfig } from "../config.js";

export interface SetArgs {
  scope: "session" | "project" | "global";
  amount: number;
}

/**
 * 解析 "/budget set ..." 后的 args 字符串。
 *
 *   "2"             → { scope: "session", amount: 2 }
 *   "2.50"          → { scope: "session", amount: 2.5 }
 *   "project 10"    → { scope: "project", amount: 10 }
 *   "global 100"    → { scope: "global", amount: 100 }
 *   其他            → undefined
 */
export function parseSetArgs(args: string): SetArgs | undefined {
  const trimmed = (args ?? "").trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split(/\s+/);
  // 形如 "project 10" / "global 100"
  if (parts.length === 2 && (parts[0] === "project" || parts[0] === "global")) {
    const n = Number(parts[1]);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return { scope: parts[0] as "project" | "global", amount: n };
  }
  // 形如 "2.50"
  if (parts.length === 1) {
    const n = Number(parts[0]);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return { scope: "session", amount: n };
  }
  return undefined;
}

/** 解析 "/budget unset ..." */
export function parseUnsetArgs(args: string): "session" | "project" | "global" | "all" {
  const trimmed = (args ?? "").trim().toLowerCase();
  if (!trimmed || trimmed === "all") return "all";
  if (trimmed === "session" || trimmed === "project" || trimmed === "global") return trimmed;
  // 默认按 session 处理（最常用）
  return "session";
}

/**
 * 应用 set 到 config（写文件）。返回新 config。
 *
 * 注意：MVP 只让 session 预算在 widget / 限值判断中生效；
 * project/global 预算被存下来但不影响 widget（v2 再用）。
 */
export function applySet(args: SetArgs, current: BudgetConfig): BudgetConfig {
  const next: BudgetConfig = { ...current };
  if (args.scope === "session") {
    next.session = { ...(current.session ?? {}), usd: args.amount };
  } else if (args.scope === "project") {
    next.project = { ...(current.project ?? {}), usdPerDay: args.amount };
  } else if (args.scope === "global") {
    next.global = { ...(current.global ?? {}), usdPerMonth: args.amount };
  }
  saveConfig(next);
  return next;
}

/** /budget unset [scope|all] —— 清除配置中的预算字段。 */
export function applyUnset(
  scope: "session" | "project" | "global" | "all",
  current: BudgetConfig,
): BudgetConfig {
  const next: BudgetConfig = { ...current };
  if (scope === "all" || scope === "session") {
    if (next.session) {
      const { usd: _u, ...rest } = next.session;
      next.session = Object.keys(rest).length ? rest : undefined;
    }
  }
  if (scope === "all" || scope === "project") {
    if (next.project) {
      const { usdPerDay: _u, ...rest } = next.project;
      next.project = Object.keys(rest).length ? rest : undefined;
    }
  }
  if (scope === "all" || scope === "global") {
    if (next.global) {
      const { usdPerMonth: _u, ...rest } = next.global;
      next.global = Object.keys(rest).length ? rest : undefined;
    }
  }
  saveConfig(next);
  return next;
}

/** 格式化金额展示。 */
export function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}
