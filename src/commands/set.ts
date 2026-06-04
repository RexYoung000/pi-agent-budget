/**
 * /budget set 命令
 *
 * 设计文档：../../design.md §6
 *
 * 用法：
 *   /budget set 2.00              # 设置本会话预算 $2
 *   /budget set project 10        # 设置项目日预算 $10
 *   /budget set global 100        # 设置月度预算 $100（v2）
 *
 * 状态：🚧 scaffold-only
 */

import type { BudgetConfig } from "../config.js";

export interface SetArgs {
  scope: "session" | "project" | "global";
  amount: number;
}

/** 解析 "/budget set ..." 后的 args 字符串。 */
export function parseSetArgs(args: string): SetArgs | undefined {
  // TODO(MVP):
  //   - "/budget set 2" → { scope: "session", amount: 2 }
  //   - "/budget set project 10" → { scope: "project", amount: 10 }
  //   - 校验 amount > 0
  void args;
  throw new Error("parseSetArgs() not implemented (scaffold-only)");
}

/** 应用到配置 + db，返回更新后的 config。 */
export async function applySet(_args: SetArgs, _config: BudgetConfig): Promise<BudgetConfig> {
  // TODO(MVP):
  //   - 改 config.session.usd / config.project.usdPerDay / ...
  //   - 调 saveConfig()
  //   - 调 db.setBudget()
  throw new Error("applySet() not implemented (scaffold-only)");
}

/** /budget unset [scope] 命令。 */
export async function applyUnset(_scope: "session" | "project" | "global" | "all"): Promise<void> {
  // TODO(MVP): 反向操作
  throw new Error("applyUnset() not implemented (scaffold-only)");
}
