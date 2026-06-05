/**
 * Dashboard —— /budget 主入口标签式仪表盘
 *
 * 四个标签：概览 | 报表 | 外观 | 设置
 * ← → 切换标签，ESC 退出
 */

import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";

import type { WidgetConfig, BudgetConfig } from "../config.js";

export interface DashboardInput {
  overview: string;
  report: string;
  widgetSummary: string;
  configSummary: string;
}

/** 渲染标签栏。 */
function renderTabs(active: number, theme: Theme): string[] {
  const tabs = ["概览", "报表", "外观", "设置"];
  const parts: string[] = [];

  for (let i = 0; i < tabs.length; i++) {
    const label = tabs[i]!;
    if (i === active) {
      // 选中标签：高亮
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

/** 将多行文本截断到 maxLines，超出提示 "... (截断)"。 */
function limitLines(text: string, maxLines: number): string[] {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines), `... (共 ${lines.length} 行，已截断)`];
}

/** 渲染内容区域（根据当前标签）。 */
function renderContent(active: number, input: DashboardInput, maxLines: number): string[] {
  const raw = (() => {
    switch (active) {
      case 0:
        return input.overview;
      case 1:
        return input.report;
      case 2:
        return input.widgetSummary;
      case 3:
        return input.configSummary;
      default:
        return "";
    }
  })();

  return limitLines(raw, maxLines);
}

/** 创建仪表盘 Component。 */
export function createDashboard(
  input: DashboardInput,
  theme: Theme,
  onClose: () => void,
): { render(width: number): string[]; handleInput(data: string): boolean; invalidate(): void } {
  let activeTab = 0;
  // 内容区最大行数（去掉标签栏、分隔线、提示行后剩下的空间）
  const MAX_CONTENT = 20;

  return {
    render(width: number) {
      const lines: string[] = [];

      // 标题栏（前缀 "┌─ pi-budget " = 14 字符 + 后缀 "┐" = 1 字符，剩 width-15 用 ─ 填充）
      lines.push(theme.fg("accent", "┌─ pi-budget " + "─".repeat(Math.max(0, width - 15)) + "┐"));

      // 标签（用 visibleWidth 避免 ANSI 码干扰宽度计算）
      const tabLine = renderTabs(activeTab, theme)[0] ?? "";
      const tabLineVis = visibleWidth(tabLine);
      lines.push(`│ ${tabLine}` + " ".repeat(Math.max(0, width - tabLineVis - 3)) + "│");

      // 分隔
      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);

      // 内容（用 truncateToWidth 截断 + visibleWidth 对齐）
      const content = renderContent(activeTab, input, MAX_CONTENT);
      for (const line of content) {
        const trimmed = line.replace(/^\s+/, "");
        const safe = truncateToWidth(trimmed, width - 3);
        const pad = width - visibleWidth(safe) - 3;
        lines.push(`│ ${safe}${" ".repeat(Math.max(0, pad))}│`);
      }

      // 空行填充剩余空间（让卡片高度一致）
      const usedContent = content.length;
      for (let i = usedContent; i < MAX_CONTENT; i++) {
        lines.push(`│${" ".repeat(width - 2)}│`);
      }

      // 底部提示（用 visibleWidth 避免 ANSI 码干扰宽度计算）
      lines.push(`│${theme.fg("dim", "─".repeat(width - 2))}│`);
      const hint = theme.fg("dim", "← → 切换标签    ESC 退出    /budget widget 编辑外观");
      const hintVis = visibleWidth(hint);
      lines.push(`│ ${hint}${" ".repeat(Math.max(0, width - hintVis - 3))}│`);
      lines.push(theme.fg("accent", "└" + "─".repeat(width - 2) + "┘"));

      return lines;
    },

    handleInput(data: string): boolean {
      // ESC
      if (data === "\x1b") {
        onClose();
        return true;
      }
      // 箭头键：D=左 C=右 A=上 B=下
      if (data === "\x1b[D" || data === "left") {
        activeTab = (activeTab - 1 + 4) % 4;
        return true;
      }
      if (data === "\x1b[C" || data === "right") {
        activeTab = (activeTab + 1) % 4;
        return true;
      }
      // ↑↓ 不管（内容区滚动由 TUI 层处理）
      if (data === "\x1b[A" || data === "up" || data === "\x1b[B" || data === "down") {
        return true;
      }
      // 其他键 → 关闭
      onClose();
      return true;
    },

    invalidate() {
      // no-op
    },
  };
}
