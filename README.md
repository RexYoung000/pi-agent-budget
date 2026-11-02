# pi-agent-budget

> Pi extension: real-time AI coding cost tracking with budget limits and native CNY pricing for Chinese models.

Track token usage and costs as you chat with AI. A live widget sits below the input box showing your spending, with soft/hard budget limits to prevent surprise bills.

---

## Features

- 👁️ **Real-time cost tracking** — every assistant message is recorded: tokens × pricing = cost
- 📊 **Status bar widget** — live display below the editor: `¥0.16 / ¥10.00 ██░░░░` (model + cost + budget + progress bar)
- 🇨🇳 **CNY pricing for Chinese models** — deepseek / qwen / glm / kimi / doubao priced in RMB with auto FX conversion (1 USD ≈ 7.2 CNY)
- 🛡️ **Soft/hard budget limits** — 80% triggers a warning card, 100% blocks further input
- 📈 **`/budget` dashboard** — overview + budget settings + pricing table + config, all in a TUI panel
- 📋 **`/budget report`** — cost breakdowns by model / tool / session

---

## Install

```bash
pi install npm:pi-agent-budget
```

> Requires Node.js 22.13+ (or any Node build with `node:sqlite`). No native addons, no compile step, no network-downloaded binaries.

---

## Commands

```
/budget                     # Dashboard (overview / budget / pricing / settings)
/budget set <amount>        # Set session budget in USD      e.g. /budget set 2
/budget set project <amount> # Set project daily budget in USD
/budget report [range]      # Cost report             e.g. /budget report week
/budget by <dim> [range]    # Slice by model / tool / session
/budget widget              # Widget appearance settings
/budget export              # Export cost data
```

---

## Configuration

Edit via `/budget config` or `~/.pi/budget.json`:

```json
{
  "session": { "usd": 2.00 },
  "pricingAnchor": "followModel",
  "widget": {
    "placement": "belowEditor",
    "compact": false,
    "showModel": true,
    "showProgressBar": true,
    "showContextWindow": true
  }
}
```

| Setting | Description | Default |
|---|---|---|
| `session.usd` | Session budget in USD | Unlimited |
| `pricingAnchor` | Currency anchor: `followModel` / `cny` / `usd` | `followModel` |
| `widget.placement` | Widget position: `belowEditor` / `aboveEditor` | `belowEditor` |
| `widget.compact` | Minimal mode (cost only) | `false` |
| `softLimitRatio` | Soft limit threshold | `0.8` |
| `hardLimitRatio` | Hard limit threshold | `1.0` |

### Currency handling

- **`followModel` (default)**: Chinese models (deepseek/qwen/glm etc.) display in ¥, Western models display in $
- **`cny`**: Everything in RMB, budget presets use RMB amounts
- **`usd`**: Everything in USD

Language changes only UI text, not currency. The dashboard budget page, overview, widget, limit dialogs and reports use the selected display currency. Budget selections and limit-dialog inputs are converted back to USD before saving; changing currency preserves the value of an existing budget. For example, a stored $1 budget displays as ¥7.20 in CNY mode.

`/budget set <amount>` always accepts **USD**, regardless of language or display currency. Configuration and exports also remain in USD. Chinese model price tables are converted to USD internally for cross-model aggregation. Display conversion uses a fixed reference rate of **1 USD = 7.2 CNY**, not a live exchange rate.

---

## Data storage

| File | Purpose |
|---|---|
| `~/.pi/budget.db` | SQLite (costs / budgets / alerts) |
| `~/.pi/budget.json` | User configuration |

---

## Development

```bash
npm run check          # TypeScript type check
npm test               # Currency and dashboard regression tests
pi -e ./src/index.ts   # Local dev testing
```

---

## License

MIT
