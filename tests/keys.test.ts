import assert from "node:assert/strict";
import { test } from "node:test";

import type { Theme } from "@earendil-works/pi-coding-agent";

import { createDashboard } from "../src/ui/dashboard.js";
import { LocalizedSettingsList } from "../src/ui/localized-settings-list.js";
import { setLocale } from "../src/i18n/index.js";

// 终端开启 Kitty 键盘协议后会改写特殊键的字节序列，这里同时覆盖传统序列与新协议序列。
const LEGACY_ESC = "\x1b";
const LEGACY_LEFT = "\x1b[D";
const LEGACY_RIGHT = "\x1b[C";
const LEGACY_UP = "\x1b[A";
const LEGACY_DOWN = "\x1b[B";
const KITTY_ESC = "\x1b[27u";
const KITTY_LEFT = "\x1b[1;1D";
const KITTY_RIGHT = "\x1b[1;1C";
const KITTY_UP = "\x1b[1;1A";
const KITTY_DOWN = "\x1b[1;1B";
const KITTY_ENTER = "\x1b[13u";

setLocale("en");

function fakeTheme(): Theme {
  return {
    fg: (_color: string, text: string) => text,
    inverse: (text: string) => text,
  } as unknown as Theme;
}

function buildDashboard() {
  const calls = { budget: 0, pricing: 0, settings: 0 };
  let closed = 0;
  const list = () => new LocalizedSettingsList([], 5, () => {}, () => {});
  const dashboard = createDashboard(
    { overview: () => "overview" },
    fakeTheme(),
    {
      budgetFactory: () => { calls.budget += 1; return list(); },
      pricingFactory: () => { calls.pricing += 1; return list(); },
      settingsFactory: () => { calls.settings += 1; return list(); },
    },
    () => { closed += 1; },
  );
  return { dashboard, calls, closedCount: () => closed };
}

test("dashboard closes on escape in both legacy and Kitty encodings", () => {
  const legacy = buildDashboard();
  assert.equal(legacy.dashboard.handleInput(LEGACY_ESC), true);
  assert.equal(legacy.closedCount(), 1);

  const kitty = buildDashboard();
  assert.equal(kitty.dashboard.handleInput(KITTY_ESC), true);
  assert.equal(kitty.closedCount(), 1);
});

test("dashboard arrow keys switch tabs and reach the tab list in both encodings", () => {
  const legacy = buildDashboard();
  legacy.dashboard.handleInput(LEGACY_RIGHT);
  legacy.dashboard.handleInput(LEGACY_DOWN);
  assert.equal(legacy.calls.budget, 1);

  const kitty = buildDashboard();
  kitty.dashboard.handleInput(KITTY_RIGHT);
  kitty.dashboard.handleInput(KITTY_DOWN);
  assert.equal(kitty.calls.budget, 1);

  // 左键从概览页回绕到最后一个标签
  const wrap = buildDashboard();
  wrap.dashboard.handleInput(KITTY_LEFT);
  wrap.dashboard.handleInput(KITTY_DOWN);
  assert.equal(wrap.calls.settings, 1);
});

function buildList() {
  let cancelled = 0;
  const changes: Array<[string, string]> = [];
  const list = new LocalizedSettingsList(
    [
      { id: "first", label: "First", currentValue: "a", values: ["a", "b"] },
      { id: "second", label: "Second", currentValue: "x", values: ["x", "y"] },
    ],
    5,
    (id, value) => changes.push([id, value]),
    () => { cancelled += 1; },
  );
  return { list, changes, cancelledCount: () => cancelled };
}

test("settings list navigates and cancels in both legacy and Kitty encodings", () => {
  for (const [up, down, esc] of [
    [LEGACY_UP, LEGACY_DOWN, LEGACY_ESC],
    [KITTY_UP, KITTY_DOWN, KITTY_ESC],
  ] as const) {
    const wheel = buildList();
    wheel.list.handleInput(down);
    assert.equal(wheel.list.getSelectedIndex(), 1);
    wheel.list.handleInput(up);
    assert.equal(wheel.list.getSelectedIndex(), 0);
    // 向上越过第一项应回绕到最后一项
    wheel.list.handleInput(up);
    assert.equal(wheel.list.getSelectedIndex(), 1);

    const cancelling = buildList();
    cancelling.list.handleInput(esc);
    assert.equal(cancelling.cancelledCount(), 1);
  }
});

test("settings list toggles the selected value in both enter encodings", () => {
  for (const enter of ["\r", KITTY_ENTER]) {
    const toggled = buildList();
    toggled.list.handleInput(enter);
    assert.deepEqual(toggled.changes, [["first", "b"]]);
    toggled.list.handleInput(enter);
    assert.deepEqual(toggled.changes, [["first", "b"], ["first", "a"]]);
  }
});
