/**
 * Dashboard —— /budget 极简闭环 TUI
 *
 * 四个标签：概览 | 预算 | 价格表 | 设置
 * ← → 切换标签，↑↓ 选择，Enter/Space 修改或执行，ESC 退出
 */

import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, truncateToWidth, SettingsList } from "@earendil-works/pi-tui";

import { t } from "../i18n/index.js";

export interface DashboardInput {
  overview: () => string;
}

export interface DashboardDeps {
  budgetFactory: () => SettingsList;
  pricingFactory: () => SettingsList;
  settingsFactory: () => SettingsList;
}

function renderTabs(active: number, theme: Theme): string[] {
  const tabs = [
    t("dashboard.tab.overview"),
    t("dashboard.tab.budget"),
    t("dashboard.tab.pricing"),
    t("dashboard.tab.settings"),
  ];
  const parts: string[] = [];

  for (let i = 0; i < tabs.length; i++) {
    const label = tabs[i]!;
    parts.push(i === active ? theme.inverse(` ${label} `) : theme.fg("dim", ` ${label} `));
    if (i < tabs.length - 1) parts.push(theme.fg("muted", "│"));
  }

  return [parts.join("")];
}

function limitLines(text: string, maxLines: number): string[] {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines), t("dashboard.truncated", { total: lines.length })];
}

export function createDashboard(
  input: DashboardInput,
  theme: Theme,
  deps: DashboardDeps,
  onClose: () => void,
): { render(width: number): string[]; handleInput(data: string): boolean; invalidate(): void } {
  let activeTab = 0;
  const MAX_CONTENT = 20;
  const lists: Array<SettingsList | null> = [null, null, null];

  function getList(tab: number): SettingsList {
    const idx = tab - 1;
    if (!lists[idx]) {
      lists[idx] = tab === 1 ? deps.budgetFactory() : tab === 2 ? deps.pricingFactory() : deps.settingsFactory();
    }
    return lists[idx]!;
  }

  function resetList(tab: number): void {
    if (tab >= 1 && tab <= 3) lists[tab - 1] = null;
  }

  return {
    render(width: number) {
      const lines: string[] = [];
      const innerWidth = Math.max(1, width - 3);

      lines.push(theme.fg("accent", "┌─ pi-budget " + "─".repeat(Math.max(0, width - 15)) + "┐"));

      const tabLine = renderTabs(activeTab, theme)[0] ?? "";
      const tabLineVis = visibleWidth(tabLine);
      lines.push(`│ ${tabLine}` + " ".repeat(Math.max(0, width - tabLineVis - 3)) + "│");
      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);

      let content: string[];
      if (activeTab === 0) {
        content = limitLines(input.overview(), MAX_CONTENT);
      } else {
        content = getList(activeTab).render(innerWidth).slice(0, MAX_CONTENT);
      }

      for (const line of content) {
        const safe = truncateToWidth(activeTab === 0 ? line.replace(/^\s+/, "") : line, innerWidth);
        const pad = Math.max(0, innerWidth - visibleWidth(safe));
        lines.push(`│ ${safe}${" ".repeat(pad)}│`);
      }
      for (let i = content.length; i < MAX_CONTENT; i++) {
        lines.push(`│${" ".repeat(width - 2)}│`);
      }

      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);
      const hint = theme.fg("dim", activeTab === 0 ? t("dashboard.hint.overview") : t("dashboard.hint.interactive"));
      const hintVis = visibleWidth(hint);
      lines.push(`│ ${hint}${" ".repeat(Math.max(0, width - hintVis - 3))}│`);
      lines.push(theme.fg("accent", "└" + "─".repeat(width - 2) + "┘"));

      return lines;
    },

    handleInput(data: string): boolean {
      if (data === "\x1b") {
        onClose();
        return true;
      }

      if (data === "\x1b[D" || data === "left") {
        activeTab = (activeTab - 1 + 4) % 4;
        return true;
      }
      if (data === "\x1b[C" || data === "right") {
        activeTab = (activeTab + 1) % 4;
        return true;
      }

      if (activeTab > 0) {
        const isListInput = data === "\x1b[A" || data === "up" || data === "\x1b[B" || data === "down" || data === "\r" || data === " ";
        if (isListInput) {
          getList(activeTab).handleInput(data);
          // 设置变更后重建当前列表，确保联动值/语言/币种立即刷新。
          if (data === "\r" || data === " ") resetList(activeTab);
          return true;
        }
      }

      if (data === "\x1b[A" || data === "up" || data === "\x1b[B" || data === "down") return true;
      return true;
    },

    invalidate() {
      for (const list of lists) list?.invalidate?.();
    },
  };
}
