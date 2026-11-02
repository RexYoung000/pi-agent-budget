import type { Component } from "@earendil-works/pi-tui";
import { Key, matchesKey, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import { t } from "../i18n/index.js";

export interface LocalizedSettingItem {
  id: string;
  label: string;
  description?: string;
  currentValue: string;
  values?: string[];
}

export class LocalizedSettingsList implements Component {
  private selectedIndex = 0;

  constructor(
    private items: LocalizedSettingItem[],
    private maxVisible: number,
    private onChange: (id: string, newValue: string) => void,
    private onCancel: () => void,
  ) {}

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  setSelectedIndex(index: number): void {
    this.selectedIndex = Math.max(0, Math.min(index, this.items.length - 1));
  }

  updateValue(id: string, newValue: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) item.currentValue = newValue;
  }

  invalidate(): void {}

  render(width: number): string[] {
    const lines: string[] = [];
    if (this.items.length === 0) {
      lines.push(t("settingsList.empty"));
      lines.push("");
      lines.push(t("settingsList.hint"));
      return lines.map((line) => truncateToWidth(line, width));
    }

    const startIndex = Math.max(
      0,
      Math.min(this.selectedIndex - Math.floor(this.maxVisible / 2), this.items.length - this.maxVisible),
    );
    const endIndex = Math.min(startIndex + this.maxVisible, this.items.length);
    const maxLabelWidth = Math.min(30, Math.max(...this.items.map((item) => visibleWidth(item.label))));

    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      if (!item) continue;
      const selected = i === this.selectedIndex;
      const prefix = selected ? "› " : "  ";
      const label = item.label + " ".repeat(Math.max(0, maxLabelWidth - visibleWidth(item.label)));
      const valueWidth = Math.max(8, width - visibleWidth(prefix) - maxLabelWidth - 4);
      const value = truncateToWidth(item.currentValue, valueWidth, "");
      lines.push(truncateToWidth(`${prefix}${label}  ${value}`, width));
    }

    if (startIndex > 0 || endIndex < this.items.length) {
      lines.push(truncateToWidth(`  ${t("settingsList.position", { current: this.selectedIndex + 1, total: this.items.length })}`, width));
    }

    const selected = this.items[this.selectedIndex];
    if (selected?.description) {
      lines.push("");
      for (const raw of selected.description.split("\n")) {
        lines.push(truncateToWidth(`  ${raw}`, width));
      }
    }

    lines.push("");
    lines.push(truncateToWidth(t("settingsList.hint"), width));
    return lines;
  }

  handleInput(data: string): void {
    // matchesKey 同时覆盖传统序列与 Kitty / modifyOtherKeys 协议，避免 ESC、方向键在部分终端失效。
    if (matchesKey(data, Key.escape)) {
      this.onCancel();
      return;
    }
    if (matchesKey(data, Key.up)) {
      this.selectedIndex = this.selectedIndex === 0 ? this.items.length - 1 : this.selectedIndex - 1;
      return;
    }
    if (matchesKey(data, Key.down)) {
      this.selectedIndex = this.selectedIndex === this.items.length - 1 ? 0 : this.selectedIndex + 1;
      return;
    }
    if (matchesKey(data, Key.enter) || matchesKey(data, Key.space)) {
      const item = this.items[this.selectedIndex];
      if (!item?.values?.length) return;
      const currentIndex = item.values.indexOf(item.currentValue);
      const nextValue = item.values[(currentIndex + 1) % item.values.length] ?? item.values[0]!;
      item.currentValue = nextValue;
      this.onChange(item.id, nextValue);
    }
  }
}
