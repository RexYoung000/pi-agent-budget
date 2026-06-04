/**
 * 模型降级（v2）
 *
 * 设计文档：../../design.md §5.2 / §8（不在 MVP 内）
 *        修订：§13 #5
 *
 * 状态：🚧 scaffold-only / deferred
 *
 * 用法（修订后）：当 state.shouldDowngrade=true 时，主动调用
 *                `pi.setModel(config.downgradeTo)` 切换到便宜模型。
 *                pi 没有 `provider_request` 钩子，且 `before_provider_request`
 *                返回的是完整 payload 替换（不推荐用来改 model）。
 *                通过 `pi.setModel()` 触发 `model_select` 事件让其他扩展感知。
 *
 *                恢复原模型时再次 `pi.setModel(state.originalModel)`。
 */

export interface DowngradeState {
  shouldDowngrade: boolean;
  originalModel?: string;
  downgradedTo?: string;
  since: number;
}

export function createDowngradeState(): DowngradeState {
  return { shouldDowngrade: false, since: 0 };
}

/** 启用降级：记录原模型，标记 shouldDowngrade。 */
export function enableDowngrade(_state: DowngradeState, _to: string, _originalModel: string): void {
  // TODO(v2): state.shouldDowngrade = true; state.downgradedTo = to; ...
  throw new Error("enableDowngrade() not implemented (scaffold-only / v2)");
}

/** 关闭降级。 */
export function disableDowngrade(_state: DowngradeState): void {
  throw new Error("disableDowngrade() not implemented (scaffold-only / v2)");
}
