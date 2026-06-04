/**
 * /budget 总览命令
 *
 * 设计文档：../../design.md §6（命令清单第一条）/ §5.1
 *
 * 用法：
 *   /budget              # 当前会话实时概览（本命令）
 *   /budget set ...      # 设置预算（→ commands/set.ts）
 *   /budget report ...   # 完整报表（→ commands/report.ts）
 *
 * 状态：🚧 scaffold-only
 *
 * 设计意图：
 *   - `/budget` 是用户最常用的入口。任何时刻按一下就知道：
 *     1. 当前会话花了多少
 *     2. 预算上限是多少、剩多少
 *     3. 当前进度条 / 颜色（绿/黄/橙/红）
 *     4. 当前用的模型
 *     5. 最近一次请求的成本（直观感受"一次多少钱"）
 *
 *   - MVP 阶段只展示 session 维度。project / global 维度留给后续。
 *   - 输出格式参考 widget.ts，但这里允许更长一些（多行文本）。
 *
 * 渲染样例（MVP 文本版）：
 *
 *   ┌─ pi-budget ────────────────────────────────┐
 *   │ Session:  $0.42 / $1.00  (42%) ████░░░░░░░ │
 *   │ Model:    claude-sonnet-4.5                │
 *   │ Last:     $0.03 (in 1.2k / out 350)        │
 *   │ Status:   🟢 ok                            │
 *   │                                              │
 *   │ 预计还可发起 ~19 次类似请求                  │
 *   └──────────────────────────────────────────────┘
 *
 *   若未设置预算：
 *   ┌─ pi-budget ────────────────────────────────┐
 *   │ Session:  $0.42 (no budget)                │
 *   │ Model:    claude-sonnet-4.5                │
 *   │                                              │
 *   │ 提示：用 `/budget set <usd>` 设置本会话预算 │
 *   └──────────────────────────────────────────────┘
 */

import type { LimitStatus } from "../core/limits.js";
import { renderProgressBar } from "../ui/widget.js";

export interface OverviewInput {
  sessionId: string;
  /** 本会话累计 USD（来自 db.sumSessionUsd 或内存缓存） */
  usedUsd: number;
  /** 本会话预算 USD；未设置时传 undefined。 */
  budgetUsd?: number;
  /** 当前模型名（来自 ctx.model 或最近一条 message_end）。 */
  model?: string;
  /** 最近一次请求的成本快照（可选，提升"每次花多少"的体感）。 */
  lastRequest?: {
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
  };
  /** 限额评估结果（可选）。 */
  status?: LimitStatus;
}

/**
 * 渲染 /budget 总览，返回多行字符串。
 *
 * 这是纯展示函数，不直接读 db / ctx，便于单元测试。
 * 上层（index.ts 里的 command handler）负责组装 OverviewInput。
 */
export function renderOverview(input: OverviewInput): string {
  // TODO(MVP):
  //   const lines: string[] = [];
  //   if (input.budgetUsd && input.budgetUsd > 0) {
  //     const ratio = input.usedUsd / input.budgetUsd;
  //     const pct = (ratio * 100).toFixed(0);
  //     const bar = renderProgressBar(ratio, 12);
  //     const statusIcon = iconForLevel(input.status?.level, ratio);
  //     lines.push(`Session:  $${input.usedUsd.toFixed(2)} / $${input.budgetUsd.toFixed(2)}  (${pct}%) ${bar}`);
  //     if (input.model) lines.push(`Model:    ${input.model}`);
  //     if (input.lastRequest) {
  //       lines.push(`Last:     $${input.lastRequest.costUsd.toFixed(4)} (in ${fmtTokens(input.lastRequest.inputTokens)} / out ${fmtTokens(input.lastRequest.outputTokens)})`);
  //     }
  //     lines.push(`Status:   ${statusIcon} ${input.status?.level ?? "ok"}`);
  //     // 剩余预算 / 最近一次平均成本 ≈ 还能跑几次
  //     if (input.lastRequest && input.lastRequest.costUsd > 0) {
  //       const remaining = Math.max(0, input.budgetUsd - input.usedUsd);
  //       const est = Math.floor(remaining / input.lastRequest.costUsd);
  //       lines.push("");
  //       lines.push(`预计还可发起 ~${est} 次类似请求`);
  //     }
  //   } else {
  //     lines.push(`Session:  $${input.usedUsd.toFixed(2)} (no budget)`);
  //     if (input.model) lines.push(`Model:    ${input.model}`);
  //     lines.push("");
  //     lines.push(`提示：用 \`/budget set <usd>\` 设置本会话预算`);
  //   }
  //   return lines.join("\n");
  void input;
  void renderProgressBar;
  throw new Error("renderOverview() not implemented (scaffold-only)");
}

/** 根据 LimitLevel + ratio 返回 emoji icon（与 widget 颜色映射一致）。 */
export function iconForLevel(_level?: LimitStatus["level"], _ratio?: number): string {
  // TODO(MVP):
  //   if (level === "hard") return "🔴";
  //   if (level === "soft") return "🟠";
  //   if ((ratio ?? 0) >= 0.6) return "🟡";
  //   return "🟢";
  throw new Error("iconForLevel() not implemented (scaffold-only)");
}

/** 1000 → "1.0k"，1500 → "1.5k"，便于在状态行里节省宽度。 */
export function fmtTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * /budget 命令入口（无参数时）。
 *
 * 上层调用：
 *   pi.registerCommand("budget", {
 *     handler: async (args, ctx) => {
 *       if (!args || args.trim() === "") {
 *         return runOverview({ sessionId: ctx.session.id, ...await gatherOverview(ctx) });
 *       }
 *       // 子命令分发：set / report / unset / downgrade / export ...
 *     }
 *   });
 */
export async function runOverview(_input: OverviewInput): Promise<string> {
  // TODO(MVP):
  //   const text = renderOverview(input);
  //   ctx.ui.notify(text, "info");   // 或 ctx.ui.custom() 渲染卡片
  //   return text;
  throw new Error("runOverview() not implemented (scaffold-only)");
}
