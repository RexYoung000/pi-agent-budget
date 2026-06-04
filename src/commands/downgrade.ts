/**
 * /budget downgrade 命令（v2）
 *
 * 设计文档：../../design.md §5.2 / §6 / §8（不在 MVP 内）
 *        修订：§13 #5
 *
 * 用法：
 *   /budget downgrade              # 查看可降级模型
 *   /budget downgrade haiku        # 手动切到 haiku
 *   /budget downgrade off          # 关闭降级
 *
 * 实现说明（修订后）：实际切换调用 `pi.setModel(target)`，
 *                  不再使用 `provider_request` payload override 方案。
 *
 * 状态：🚧 scaffold-only / deferred
 */

export type DowngradeArgs =
  | { action: "off" }
  | { action: "set"; model: string }
  | { action: "status" };

export function parseDowngradeArgs(args: string | undefined): DowngradeArgs {
  if (!args || args.trim() === "") return { action: "status" };
  if (args.trim() === "off") return { action: "off" };
  return { action: "set", model: args.trim() };
}

export async function runDowngrade(_args: DowngradeArgs): Promise<string> {
  // TODO(v2): 调 core/downgrade.ts 的 enableDowngrade / disableDowngrade
  throw new Error("runDowngrade() not implemented (scaffold-only / v2)");
}
