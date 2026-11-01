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
/budget set <amount>        # Set session budget      e.g. /budget set 2
/budget set project <amount> # Set project daily budget
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

Chinese models use RMB price tables internally; all costs are stored in USD for consistent cross-model aggregation, with display-time conversion.

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
pi -e ./src/index.ts   # Local dev testing
```

---

## License

MIT
