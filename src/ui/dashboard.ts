/**
 * Dashboard —— /budget 主入口标签式仪表盘
 *
 * 四个标签：概览 | 报表 | 外观 | 设置
 * ← → 切换标签，ESC 退出
 * 「设置」标签内嵌 SettingsList，可交互编辑（↑↓选择，Enter 切换值）
 */

import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, truncateToWidth, SettingsList } from "@earendil-works/pi-tui";

import { t } from "../i18n/index.js";

export interface DashboardInput {
  overview: string;
  report: string;
  widgetSummary: string;
  // configSummary 现在只是「设置」标签上的提示文字；实际交互由 settingsList 提供
  configSummary?: string;
}

/** 仪表盘需要的外部依赖（设置项工厂 + 变更回调） */
export interface DashboardDeps {
  /** 懒创建 SettingsList 实例（用户切到设置标签时才创建） */
  settingsFactory: () => SettingsList;
}

/** 渲染标签栏（已 i18n 化）。 */
function renderTabs(active: number, theme: Theme): string[] {
  const tabs = [
    t("dashboard.tab.overview"),
    t("dashboard.tab.report"),
    t("dashboard.tab.appearance"),
    t("dashboard.tab.settings"),
  ];
  const parts: string[] = [];

  for (let i = 0; i < tabs.length; i++) {
    const label = tabs[i]!;
    if (i === active) {
      parts.push(theme.inverse(` ${label} `));
    } else {
      parts.push(theme.fg("dim", ` ${label} `));
    }
    if (i < tabs.length - 1) {
      parts.push(theme.fg("muted", "│"));
    }
  }

  return [parts.join("")];
}

/** 将多行文本截断到 maxLines，超出提示截断。 */
function limitLines(text: string, maxLines: number): string[] {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines), t("dashboard.truncated", { total: lines.length })];
}

/** 创建仪表盘 Component。 */
export function createDashboard(
  input: DashboardInput,
  theme: Theme,
  deps: DashboardDeps,
  onClose: () => void,
): { render(width: number): string[]; handleInput(data: string): boolean; invalidate(): void } {
  let activeTab = 0;
  // 内容区最大行数（去掉标签栏、分隔线、提示行后剩下的空间）
  const MAX_CONTENT = 20;
  // 设置面板懒加载（只在切到「设置」标签时才创建）
  let settingsList: SettingsList | null = null;

  /** 渲染文本类标签（0=overview / 1=report / 2=widgetSummary）。 */
  function renderTextContent(active: number): string[] {
    const raw = (() => {
      switch (active) {
        case 0: return input.overview;
        case 1: return input.report;
        case 2: return input.widgetSummary;
        default: return "";
      }
    })();
    return limitLines(raw, MAX_CONTENT);
  }

  return {
    render(width: number) {
      const lines: string[] = [];
      const innerWidth = Math.max(1, width - 3); // │空格 + content + 空格│ → 可用 width-3

      // 标题栏
      lines.push(theme.fg("accent", "┌─ pi-budget " + "─".repeat(Math.max(0, width - 15)) + "┐"));

      // 标签
      const tabLine = renderTabs(activeTab, theme)[0] ?? "";
      const tabLineVis = visibleWidth(tabLine);
      lines.push(`│ ${tabLine}` + " ".repeat(Math.max(0, width - tabLineVis - 3)) + "│");

      // 分隔
      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);

      // ── 内容区 ──
      if (activeTab === 3) {
        // 「设置」标签：嵌入 SettingsList（懒创建）
        if (!settingsList) settingsList = deps.settingsFactory();
        const innerLines = settingsList.render(innerWidth);
        const used = Math.min(innerLines.length, MAX_CONTENT);
        for (let i = 0; i < used; i++) {
          const line = innerLines[i] ?? "";
          // SettingsList 输出已经是 innerWidth 宽，加 │空格 和 │ 包边
          const lineVis = visibleWidth(line);
          const pad = Math.max(0, innerWidth - lineVis);
          lines.push(`│ ${line}${" ".repeat(pad)}│`);
        }
        // 填充剩余空间
        for (let i = used; i < MAX_CONTENT; i++) {
          lines.push(`│${" ".repeat(width - 2)}│`);
        }
      } else {
        // 文本类标签
        const content = renderTextContent(activeTab);
        for (const line of content) {
          const trimmed = line.replace(/^\s+/, "");
          const safe = truncateToWidth(trimmed, innerWidth);
          const pad = innerWidth - visibleWidth(safe);
          lines.push(`│ ${safe}${" ".repeat(Math.max(0, pad))}│`);
        }
        // 空行填充剩余空间（让卡片高度一致）
        for (let i = content.length; i < MAX_CONTENT; i++) {
          lines.push(`│${" ".repeat(width - 2)}│`);
        }
      }

      // 底部提示
      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);
      const hint = theme.fg("dim", t("dashboard.hint"));
      const hintVis = visibleWidth(hint);
      lines.push(`│ ${hint}${" ".repeat(Math.max(0, width - hintVis - 3))}│`);
      lines.push(theme.fg("accent", "└" + "─".repeat(width - 2) + "┘"));

      return lines;
    },

    handleInput(data: string): boolean {
      // ESC → 退出（即使设置标签也退出整个仪表盘）
      if (data === "\x1b") {
        onClose();
        return true;
      }

      // 「设置」标签：↑↓ / Enter / Space 转发给 SettingsList
      if (activeTab === 3) {
        if (!settingsList) settingsList = deps.settingsFactory();
        const isNav = data === "\x1b[A" || data === "up"
          || data === "\x1b[B" || data === "down"
          || data === "\r" || data === " ";
        if (isNav) {
          settingsList.handleInput(data);
          return true;
        }
      }

      // ← → 切换标签（所有标签都生效）
      if (data === "\x1b[D" || data === "left") {
        activeTab = (activeTab - 1 + 4) % 4;
        return true;
      }
      if (data === "\x1b[C" || data === "right") {
        activeTab = (activeTab + 1) % 4;
        return true;
      }

      // 其他按键（↑↓ 在非设置标签、字符键等）→ 忽略
      if (data === "\x1b[A" || data === "up" || data === "\x1b[B" || data === "down") {
        return true;
      }

      // 其余任何输入 → 关闭（保持旧行为）
      onClose();
      return true;
    },

    invalidate() {
      settingsList?.invalidate?.();
    },
  };
}
