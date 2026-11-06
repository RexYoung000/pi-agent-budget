import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";

// 配置和数据库路径在 import 时确定；沿用其他测试的隔离方式，不访问用户数据。
const scratch = mkdtempSync(join(os.tmpdir(), "pi-budget-context-"));
const originalHomedir = os.homedir;
os.homedir = () => scratch;
syncBuiltinESMExports();
const { default: extension } = await import("../src/index.js");
const { DEFAULT_CONFIG, saveConfig } = await import("../src/config.js");
const { BudgetDb } = await import("../src/db/client.js");
const { createTracker } = await import("../src/core/tracker.js");
const { renderContextLine } = await import("../src/ui/widget.js");
os.homedir = originalHomedir;
syncBuiltinESMExports();
test.after(() => rmSync(scratch, { recursive: true, force: true }));

test("renderContextLine 用 ? 表示压缩后尚未重新计数的上下文", () => {
  assert.equal(renderContextLine({ tokens: null, contextWindow: 272_000, percent: null }), "?/272.0K");
  assert.equal(renderContextLine({ tokens: 61_000, contextWindow: 272_000, percent: 22.4 }), "61.0K/272.0K (22%)");
});

function harness(t: TestContext, options: { mode?: string; cny?: boolean } = {}) {
  saveConfig({ ...DEFAULT_CONFIG, pricingAnchor: options.cny ? "cny" : "usd", exchangeRate: { mode: "fixed", fixedRate: 7.2 } });
  const handlers = new Map<string, (event: unknown, ctx: unknown) => unknown>();
  extension({
    on: (name: string, handler: (event: unknown, ctx: unknown) => unknown) => handlers.set(name, handler),
    registerCommand() {},
  } as never);

  const sessionId = join(scratch, `${randomUUID()}.jsonl`);
  const renders: string[] = [];
  let component: { render(width: number): string[] } | undefined;
  let usage: { tokens: number | null; contextWindow: number; percent: number | null } = {
    tokens: 251_125, contextWindow: 272_000, percent: 92.3,
  };
  const ctx = {
    hasUI: options.mode === undefined || options.mode === "rpc",
    mode: options.mode ?? "tui",
    cwd: scratch,
    // 显示名与消费记录中的模型 ID 不同，避免按显示名重查导致金额清零。
    model: { name: "Rex 自动路由 · 主 Agent", id: "group/rex-auto" },
    getContextUsage: () => usage,
    ui: {
      setWidget: (_id: string, factory?: (tui: unknown, theme: unknown) => { render(width: number): string[] }) => {
        if (!factory) return;
        component = factory(undefined, undefined);
        renders.push(component.render(200).join("\n"));
      },
      notify() {},
    },
    sessionManager: { getSessionFile: () => sessionId },
  };
  const emit = async (event: string, payload: unknown = {}) => {
    const handler = handlers.get(event);
    assert.ok(handler, `缺少事件处理：${event}`);
    await handler(payload, ctx);
  };
  t.after(() => emit("session_shutdown"));
  return {
    renders, sessionId, emit,
    /** 重新绘制当前 widget，模拟终端重绘。 */
    paint: () => { assert.ok(component, "widget 未注册"); return component.render(200).join("\n"); },
    setUsage: (next: typeof usage) => { usage = next; },
    respond: (cost: number) => emit("message_end", { message: {
      role: "assistant", model: "group/rex-auto", content: [],
      usage: { input: usage.tokens ?? 0, output: 10, cacheRead: 0, cacheWrite: 0,
        cost: { input: cost, output: 0, cacheRead: 0, cacheWrite: 0, total: cost } },
    } }),
  };
}

for (const reason of ["manual", "threshold", "overflow"]) {
  test(`${reason} 压缩后立即清除旧长度、保持消费，下一次响应恢复新用量`, async (t) => {
    const h = harness(t);
    await h.emit("session_start");
    await h.respond(5.41);
    assert.match(h.renders.at(-1)!, /\$5\.41.*251\.1K\/272\.0K \(92%\)/);

    h.setUsage({ tokens: null, contextWindow: 272_000, percent: null });
    const before = h.renders.length;
    await h.emit("session_compact", { reason, fromExtension: false, willRetry: reason === "overflow" });
    assert.equal(h.renders.length, before + 1);
    assert.match(h.renders.at(-1)!, /\$5\.41.*\?\/272\.0K/);
    assert.doesNotMatch(h.renders.at(-1)!, /251\.1K|92%/);
    const db = await BudgetDb.open();
    try { assert.equal(db.sumSessionUsd(h.sessionId), 5.41, "重绘不能新增消费记录"); }
    finally { db.close(); }

    h.setUsage({ tokens: 61_000, contextWindow: 272_000, percent: 22.4 });
    await h.respond(0.09);
    assert.match(h.renders.at(-1)!, /\$5\.50.*61\.0K\/272\.0K \(22%\)/);
  });
}

test("绘制时读取实时上下文，避免落后一条消息", async (t) => {
  const h = harness(t);
  await h.emit("session_start");
  await h.respond(0.1);
  // message_end 触发时 Pi 可能尚未把这条消息计入上下文；重绘时必须显示最新值。
  h.setUsage({ tokens: 40_000, contextWindow: 272_000, percent: 14.7 });
  assert.match(h.paint(), /40\.0K\/272\.0K \(15%\)/);
  assert.doesNotMatch(h.paint(), /251\.1K/);
});

test("切分支后按新分支重绘，连续刷新不会重复换算人民币金额", async (t) => {
  const h = harness(t, { cny: true });
  await h.emit("session_start");
  await h.respond(1);
  assert.match(h.renders.at(-1)!, /¥7\.20/);
  h.setUsage({ tokens: null, contextWindow: 272_000, percent: null });
  await h.emit("session_compact", { reason: "manual" });
  assert.match(h.renders.at(-1)!, /¥7\.20.*\?\/272\.0K/);
  h.setUsage({ tokens: 61_000, contextWindow: 272_000, percent: 22.4 });
  await h.emit("session_tree");
  assert.match(h.renders.at(-1)!, /¥7\.20.*61\.0K\/272\.0K \(22%\)/);
  assert.doesNotMatch(h.renders.at(-1)!, /251\.1K/);
});

for (const mode of ["print", "json", "rpc"]) {
  test(`${mode} 模式不创建终端 widget`, async (t) => {
    const h = harness(t, { mode });
    await h.emit("session_start");
    h.setUsage({ tokens: null, contextWindow: 272_000, percent: null });
    await h.emit("session_compact", { reason: "manual" });
    await h.emit("session_tree");
    assert.equal(h.renders.length, 0);
  });
}

test("恢复会话后新增消费必须累加到已记录的历史金额上", async (t) => {
  const path = join(scratch, `tracker-${randomUUID()}.db`);
  const first = await BudgetDb.open(path);
  const seed = createTracker(first);
  const cost = (total: number) => ({ input: total, output: 0, cacheRead: 0, cacheWrite: 0, total });
  const row = (total: number) => ({
    sessionId: "resumed", projectId: "p", model: "group/rex-auto",
    inputTokens: 1000, outputTokens: 10, cacheRead: 0, cacheWrite: 0, cost: cost(total),
  });
  seed.record(row(5.41));
  first.close();
  t.after(() => rmSync(path, { force: true }));

  // 新进程：缓存是空的，首笔新记录必须叠加数据库中的 5.41。
  const reopened = await BudgetDb.open(path === "" ? path : path);
  t.after(() => reopened.close());
  const tracker = createTracker(reopened);
  tracker.record(row(0.09));
  assert.equal(tracker.sessionModelUsd("resumed", "group/rex-auto"), 5.5);
  assert.equal(tracker.sessionUsd("resumed"), 5.5);
});
