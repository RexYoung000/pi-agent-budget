/**
 * 洞察规则引擎（v2）
 *
 * 设计文档：../../design.md §5.3
 *
 * 状态：🚧 scaffold-only / deferred（不在 MVP 内）
 *
 * 规则库：
 * | 规则         | 触发条件                              | 建议                                  |
 * |--------------|---------------------------------------|---------------------------------------|
 * | 重复读取     | 同文件被 read > 5 次/session          | "考虑加入 .piignore 或主动 compact"   |
 * | 工具偏重     | bash 单工具占比 > 40%                 | "切便宜模型跑 bash 循环"              |
 * | 缓存未启用   | cacheRead / inputTokens < 10%         | "检查 prompt cache 是否启用"          |
 * | 模型浪费     | 简单 read/edit 用了 opus/sonnet       | "为简单工具配置 model router"         |
 * | 月度超限     | run-rate > 月度预算                   | "考虑订阅制（Claude Max / Cursor）"   |
 * | 异常 spike   | 单次请求成本 > 历史 P99 × 3           | "可能上下文爆炸，建议 compact"        |
 */

export interface Insight {
  rule: string;
  severity: "info" | "warn" | "critical";
  message: string;
  estimatedSaving?: string; // 例如 "-$0.30/day"
}

export interface RuleContext {
  sessionId: string;
  projectId: string;
  since: number; // ms
}

export type Rule = (ctx: RuleContext) => Promise<Insight | null>;

/** 注册的规则列表。 */
export const RULES: Rule[] = [
  // TODO(v2): add rules here
];

/** 串行执行所有规则，过滤掉 null。 */
export async function runInsights(_ctx: RuleContext): Promise<Insight[]> {
  // TODO(v2):
  //   const out: Insight[] = [];
  //   for (const rule of RULES) {
  //     const r = await rule(ctx);
  //     if (r) out.push(r);
  //   }
  //   return out;
  throw new Error("runInsights() not implemented (scaffold-only / v2)");
}
