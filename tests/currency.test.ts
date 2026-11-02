import assert from "node:assert/strict";
import { after, test } from "node:test";
import os from "node:os";
import { syncBuiltinESMExports } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// Config and database paths are captured at import time. Keep every test write isolated.
const scratch = mkdtempSync(join(os.tmpdir(), "budget-currency-"));
const originalHomedir = os.homedir;
os.homedir = () => scratch;
syncBuiltinESMExports();
const { DEFAULT_CONFIG, CONFIG_PATH, saveConfig } = await import("../src/config.js");
const { createBudgetListForDashboard } = await import("../src/commands/config.js");
const { setLocale } = await import("../src/i18n/index.js");
const { getPricingInfo, displayToUsd, usdToDisplay, formatUsdInCurrency } = await import("../src/core/pricing.js");
const { askNewBudget } = await import("../src/ui/alert-card.js");
const { BudgetDb } = await import("../src/db/client.js");
const { renderReport, renderByDimension } = await import("../src/ui/report.js");
const { evaluateLimit } = await import("../src/core/limits.js");
const { visibleWidth } = await import("@earendil-works/pi-tui");
const { default: extension } = await import("../src/index.js");
os.homedir = originalHomedir;
syncBuiltinESMExports();
after(() => rmSync(scratch, { recursive: true, force: true }));

test("USD/CNY conversion preserves stored budget value and limit ratio", () => {
  for (const currency of ["USD", "CNY"] as const) {
    for (const usd of [0, 0.01, 1, 2.35, 100]) {
      assert.ok(Math.abs(displayToUsd(usdToDisplay(usd, currency), currency) - usd) < 1e-10);
    }
    assert.equal(evaluateLimit(displayToUsd(usdToDisplay(0.9, currency), currency), 1, DEFAULT_CONFIG), "soft");
  }
  assert.equal(formatUsdInCurrency(1, "CNY"), "¥7.20");
});

for (const locale of ["en", "zh-CN", "ja", "ko"]) {
  for (const anchor of ["followModel", "cny", "usd"] as const) {
    test(`${locale}, ${anchor}: budget selection matches display and saves USD`, () => {
      setLocale(locale);
      let config = { ...DEFAULT_CONFIG, locale, pricingAnchor: anchor, session: { usd: 1, tokens: 123 } };
      const currency = getPricingInfo(config, "deepseek-chat").displayCurrency;
      const list = createBudgetListForDashboard(config, "deepseek-chat", (next) => { config = next as typeof config; });
      assert.match(list.render(120).join("\n"), currency === "CNY" ? /¥7\.20/ : /\$1\.00/);
      if (currency === "CNY") {
        list.handleInput("\r"); // Existing ¥7.20 is not a preset; first cycle clears it.
        list.handleInput("\r"); // Select ¥5.
        assert.equal(config.session.usd, 5 / 7.2);
        assert.match(list.render(120).join("\n"), /¥5\.00/);
        assert.equal(formatUsdInCurrency(config.session.usd, currency), "¥5.00");
      } else {
        list.handleInput("\r"); // $1 -> $2.
        assert.equal(config.session.usd, 2);
      }
      assert.equal(config.session.tokens, 123);
      assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).session.usd, config.session.usd);
    });
  }
}

test("language alone does not change currency for a USD model", () => {
  for (const locale of ["en", "zh-CN", "ja", "ko"]) {
    setLocale(locale);
    const list = createBudgetListForDashboard({ ...DEFAULT_CONFIG, locale, session: { usd: 1 } }, "claude-sonnet", () => {});
    assert.match(list.render(120).join("\n"), /\$1\.00/);
    assert.doesNotMatch(list.render(120).join("\n"), /¥/);
  }
});

test("budget-raise prompts name the actual currency in every language", async () => {
  for (const locale of ["en", "zh-CN", "ja", "ko"]) {
    setLocale(locale);
    for (const symbol of ["¥", "$"]) {
      const value = await askNewBudget({ input: async (_title, prompt) => {
        assert.match(prompt!, symbol === "¥" ? /CNY/ : /USD/);
        return "7.20";
      } }, 7.2, symbol);
      assert.equal(value, 7.2);
    }
  }
});

test("reports convert totals, averages and dimension rows in CNY", () => {
  setLocale("en");
  const report = renderReport({ currency: "CNY", range: "today", since: 0, until: 1,
    totals: { usd: 1, sessions: 2, requests: 2 }, byModel: [{ key: "model", total: 1, count: 2 }], byTool: [] });
  assert.match(report, /¥7\.20/);
  assert.match(report, /¥3\.60/);
  assert.doesNotMatch(report, /\$/);
  const by = renderByDimension({ currency: "CNY", dim: "model", since: 0, until: 1, totalUsd: 1,
    rows: [{ key: "model", total: 1, count: 2 }] });
  assert.equal(by.match(/¥7\.20/g)?.length, 2);
});

test("open dashboard updates overview, budget, widget and reports without reopening", async () => {
  saveConfig({ ...DEFAULT_CONFIG, exchangeRate: { mode: "fixed", fixedRate: 7.2 }, locale: "en", pricingAnchor: "usd", session: { usd: 1 } });
  const handlers = new Map<string, Function>();
  let command: any;
  extension({ on: (name: string, handler: Function) => handlers.set(name, handler),
    registerCommand: (_name: string, spec: any) => { command = spec; } } as any);
  const theme = { fg: (_color: string, value: string) => value, inverse: (value: string) => value } as any;
  let dashboard: any;
  let widget = "";
  const notifications: string[] = [];
  let renders = 0;
  const originalFetch = globalThis.fetch;
  const ctx = { hasUI: true, mode: "tui", cwd: scratch,
    model: { name: "deepseek-chat", id: "deepseek-chat" }, sessionManager: { getSessionFile: () => "test-session" },
    ui: {
      setWidget: (_key: string, factory: any) => { if (factory) widget = factory({}, theme).render(120).join("\n"); },
      custom: async (factory: any) => { dashboard = factory({ requestRender: () => renders++ }, theme, {}, () => {}); },
      notify: (text: string) => notifications.push(text),
    } };
  try {
    await handlers.get("session_start")!({}, ctx);
    await command.handler("", ctx);
    assert.match(dashboard.render(120).join("\n"), /\$1\.00/);
    dashboard.handleInput("\x1b[C"); // budget
    assert.match(dashboard.render(120).join("\n"), /\$1\.00/);
    dashboard.handleInput("\x1b[C"); // pricing
    dashboard.handleInput("\r"); // usd -> followModel -> CNY for DeepSeek
    assert.match(dashboard.render(120).join("\n"), /CNY/);
    dashboard.handleInput("\x1b[D");
    assert.match(dashboard.render(120).join("\n"), /¥7\.20/);
    dashboard.handleInput("\x1b[D");
    assert.match(dashboard.render(120).join("\n"), /¥7\.20/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.match(widget, /¥7\.20/);
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).session.usd, 1);
    dashboard.handleInput("\x1b[D"); // settings
    dashboard.handleInput("\r"); // English -> Chinese
    assert.match(dashboard.render(120).join("\n"), /简体中文/);
    dashboard.handleInput("\x1b[B");
    dashboard.handleInput("\r"); // followModel -> cny
    dashboard.handleInput("\r"); // cny -> usd; selection must stay on anchor row
    dashboard.handleInput("\x1b[C");
    assert.match(dashboard.render(120).join("\n"), /\$1\.00/);
    await command.handler("report", ctx);
    assert.match(notifications.at(-1)!, /\$0\.00/);
    assert.ok(renders > 0);
    await command.handler("set 2", ctx); // CLI remains USD.
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).session.usd, 2);
    for (const width of [60, 80, 120]) {
      for (const line of dashboard.render(width)) assert.ok(visibleWidth(line) <= width);
    }
    await command.handler("config", ctx);
    dashboard.handleInput("\x1b[B");
    dashboard.handleInput("\r"); // usd -> followModel, respecting current DeepSeek model
    dashboard.handleInput("\x1b[B"); // Mode description contains the live preview.
    assert.match(dashboard.render(120).join("\n"), /¥/);
    dashboard.handleInput("\x1b[A");
    dashboard.handleInput("\r"); // followModel -> cny
    dashboard.handleInput("\r"); // cny -> usd, preserving selection
    dashboard.handleInput("\x1b[B");
    assert.match(dashboard.render(120).join("\n"), /\$/);
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).pricingAnchor, "usd");
    await command.handler("fx fixed 5", ctx);
    await command.handler("", ctx);
    dashboard.handleInput("\x1b[C");
    dashboard.handleInput("\x1b[C");
    dashboard.handleInput("\r"); // usd -> followModel (CNY)
    dashboard.handleInput("\x1b[D");
    assert.match(dashboard.render(120).join("\n"), /¥10\.00/);
    dashboard.handleInput("\r"); // ¥10 -> ¥20, stores $4 at rate 5
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).session.usd, 4);
    let requests = 0;
    globalThis.fetch = async () => {
      requests++;
      return new Response(JSON.stringify({ base: "USD", quote: "CNY", rate: 6, date: new Date().toISOString().slice(0, 10) }));
    };
    await command.handler("fx refresh", ctx); // fixed: must not fetch
    assert.equal(requests, 0);
    await command.handler("fx auto", ctx);
    assert.equal(requests, 1);
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).session.usd, 4);
    assert.match(dashboard.render(120).join("\n"), /¥24\.00/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.match(widget, /¥24\.00/);
    // A settings list created before refresh must not overwrite the new cache.
    dashboard.handleInput("\x1b[D");
    dashboard.handleInput("\x1b[D");
    dashboard.handleInput("\r");
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).exchangeRate.cachedRate, 6);
    await command.handler("fx fixed 0", ctx);
    assert.equal(JSON.parse(readFileSync(CONFIG_PATH, "utf8")).exchangeRate.mode, "auto");
    // Delayed network results must not replace a newly selected fixed rate.
    let resolveFetch!: (response: Response) => void;
    globalThis.fetch = async () => new Promise<Response>((resolve) => { resolveFetch = resolve; });
    const pendingRefresh = command.handler("fx refresh", ctx);
    await command.handler("fx fixed 8", ctx);
    resolveFetch(new Response(JSON.stringify({ base: "USD", quote: "CNY", rate: 99, date: new Date().toISOString().slice(0, 10) })));
    await pendingRefresh;
    const finalConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    assert.equal(finalConfig.exchangeRate.mode, "fixed");
    assert.equal(finalConfig.exchangeRate.fixedRate, 8);
    assert.equal(finalConfig.exchangeRate.cachedRate, 6);
    // Verify newly estimated CNY costs persist as USD at that same fixed rate.
    await handlers.get("message_end")!({ message: { role: "assistant", model: "deepseek-chat", usage: { input: 1000000, output: 0 } } }, ctx);
    const recorded = await BudgetDb.open(join(scratch, ".pi/budget.db"));
    try { assert.equal(recorded.getTotals(0).usd, 1 / 8); } finally { recorded.close(); }
    await command.handler("report", ctx);
    assert.match(notifications.at(-1)!, /¥1\.00/);
  } finally {
    globalThis.fetch = originalFetch;
    await handlers.get("session_shutdown")!({}, ctx);
  }
});
