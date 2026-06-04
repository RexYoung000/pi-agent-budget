/**
 * pi-agent-budget — 扩展入口
 *
 * 设计文档：../design.md
 *
 * 当前状态：🚧 脚手架（scaffold-only）
 *   - 注册一个最小可加载的扩展
 *   - 监听 `message_end` 仅打 log，不做任何业务逻辑
 *   - 后续按 design.md §8 MVP 范围逐步实现
 *
 * 加载方式：
 *   pi -e ./src/index.ts
 *   或放到 ~/.pi/agent/extensions/pi-budget/ 自动加载
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // ────────────────────────────────────────────────────────────────────────
  // Layer 1: Observability
  // ────────────────────────────────────────────────────────────────────────
  // TODO(MVP): 在 message_end 累计 CostRecord 到 SQLite，并刷新状态栏 widget
  // TODO(MVP): 在 session_start 初始化 / 恢复预算上下文
  // TODO(MVP): 在 session_shutdown 关闭 db 句柄
  //
  // pi.on("session_start", async (_event, ctx) => { ... });
  // pi.on("session_shutdown", async (_event, _ctx) => { ... });

  pi.on("message_end", async (event, _ctx) => {
    if (event.message.role !== "assistant") return;

    const usage = (event.message as { usage?: { cost?: { total?: number } } }).usage;
    if (!usage?.cost?.total) return;

    // Scaffold-only: 仅在 debug log 中留痕
    // TODO(MVP): await db.insertCost({ ... }); updateStatusBar(); checkLimits(ctx);
    console.log(
      `[pi-budget] scaffold log — model=${event.message.model ?? "?"} cost=$${usage.cost.total.toFixed(6)}`,
    );
  });

  // ────────────────────────────────────────────────────────────────────────
  // Layer 2: Control
  // ────────────────────────────────────────────────────────────────────────
  // TODO(MVP): 在 `input` 事件里判断是否触达硬限，返回 { action: "handled" }
  //            阻止消息进入 agent；pi 无 `user_message_submit` 钩子（见 §13 #4）
  // TODO(v2):  降级 / before_provider_request payload 重写
  //            —— pi 没有 `provider_request` 钩子，
  //            降级用 pi.setModel()（见 §13 #5）；
  //            `before_provider_request` 返回完整 payload 替换，
  //            MVP 不用，v2 再评估是否值得。

  // ────────────────────────────────────────────────────────────────────────
  // Layer 3: Optimization
  // ────────────────────────────────────────────────────────────────────────
  // TODO(v2): 洞察规则引擎在 /budget report 中输出建议

  // ────────────────────────────────────────────────────────────────────────
  // Commands
  // ────────────────────────────────────────────────────────────────────────
  // TODO(MVP): 注册 `/budget` 命令族，分发到下列子模块：
  //            - 无参数 → commands/overview.ts  （当前会话快照）
  //            - `set [scope] <usd>` → commands/set.ts
  //            - `unset [scope]`      → commands/set.ts
  //            - `report [range]`     → commands/report.ts
  //            - `by <dim>`           → commands/report.ts
  //            - `export [format]`    → commands/export.ts （v2 / 可选）
  //            - `downgrade ...`      → commands/downgrade.ts （v2）
  //
  // pi.registerCommand("budget", {
  //   description: "AI cost budget management",
  //   handler: async (args, ctx) => {
  //     const trimmed = (args ?? "").trim();
  //     if (trimmed === "") return runOverview(await gatherOverview(ctx));
  //     const [sub, ...rest] = trimmed.split(/\s+/);
  //     switch (sub) {
  //       case "set":    return runSet(rest.join(" "), ctx);
  //       case "unset":  return runUnset(rest.join(" "), ctx);
  //       case "report": return runReport(parseRange(rest[0]), ctx.session.id);
  //       case "by":     return runBy(rest[0] as "model"|"tool"|"session", ctx.session.id);
  //       case "export": return runExport(parseExportFormat(rest[0]), ctx.session.id);
  //       case "downgrade": return runDowngrade(parseDowngradeArgs(rest.join(" ")));
  //       default: return `未知子命令: ${sub}`;
  //     }
  //   },
  // });
  void pi;
}
