# `pi-agent-budget` — AI 成本管理器

> Pi 扩展设计文档
> 状态：设计阶段 / MVP 待开发
> 创建日期：2026-06-04
> 修订：2026-06-04 — 对齐 pi 实际 API（见附录 §13）

---

## 2026-11：预算币种一致性修复（Issue #2）

- 所有已存预算与消费金额保持 USD；不迁移、不改写历史记录。
- 语言只决定文案；`pricingAnchor` 和当前模型决定显示币种。
- 仪表盘预算页、概览、底栏、限额弹窗及报表按同一显示币种换算；CNY 使用当前有效汇率：自动模式每日获取 Frankfurter USD/CNY 参考汇率并缓存，支持立即刷新；固定模式使用用户输入值。无缓存时使用明确标注的内置 7.2 参考值。
- 预算页以显示币种给出档位，输入/选择后换回 USD 保存。例如汇率 7.2 时 ¥7.20 等价于 $1.00；人民币档位按当前有效汇率换回 USD。
- 切换语言或显示币种时，打开的面板立即刷新，已有预算的实际价值与限额判断保持不变。
- `/budget set` 的金额继续是 USD，保留现有命令语义并明确单位；导出字段仍为 USD。
- 回归验证覆盖 USD/CNY 往返、四种语言、followModel、切币种、限额输入和报表；另以隔离配置打开真实 Pi TUI 检查交互。

### 汇率更新补充

- `exchangeRate` 保存自动/固定模式、固定值、成功获取的汇率/数据日期/获取时间，以及最近失败状态；旧 `fxUpdatedAt` 不能作为真实获取证明。
- 自动模式在会话开始检查，并在长会话中定时检查；成功后 24 小时再更新，失败后自动重试间隔 1 小时；手动立即刷新可绕过缓存。请求 5 秒超时，会话结束取消。
- 数据源固定为 Frankfurter v2 USD/CNY；校验币种、正有限数值和日期。失败保留缓存及真实日期，不把本地日期冒充数据日期，不修改模型价格表日期。
- 价格页可切自动/固定模式并立即刷新；`/budget fx fixed <rate>` 输入任意正有效汇率，`/budget fx auto` 恢复自动，`/budget fx refresh` 立即获取。
- 所有显示、预算输入和新成本估算使用同一有效值；数据库和历史预算继续保持 USD，汇率变化不重算已记录成本。

## 1. 项目一句话

**让 AI coding 从"不知不觉烧钱"变成"在预算内放心跑"。**

一个 pi 扩展，给 agent / plan / vibe 三种 AI coding 范式提供统一的成本可观测、控制、与优化能力。

---

## 2. 核心价值 / 解决的痛点

| 痛点 | 现状 | pi-agent-budget 解决方式 |
|---|---|---|
| **不透明** | 不知道一次任务/一天/一个项目花了多少，直到看账单 | 实时计量 + 多维度切片报表 |
| **不可控** | agent 跑飞了几十刀没了才发现 | 软/硬限拦截 + 主动降级 |
| **不会优化** | 不知道钱花在哪、哪些可以省 | 洞察引擎给出可执行建议 |

---

## 3. 三层架构

```
┌─────────────────────────────────────────────────┐
│  Layer 3: Optimization     🧠 给建议            │
│  - "你 40% 的钱花在反复读 package.json"          │
│  - "切到 Haiku 做这一步可省 80%"                 │
├─────────────────────────────────────────────────┤
│  Layer 2: Control          🛡️ 主动干预          │
│  - 软限/硬限 + 降级策略                          │
│  - 触发时弹卡片让用户决策                        │
├─────────────────────────────────────────────────┤
│  Layer 1: Observability    👁️ 实时计量          │
│  - 按 session / project / model / tool 拆分     │
│  - 状态栏实时显示                                │
└─────────────────────────────────────────────────┘
```

---

## 4. 数据模型

### 4.1 配置（BudgetConfig）

```typescript
interface BudgetConfig {
  // 多维度预算（任一触发即生效）
  session?: { usd?: number; tokens?: number; minutes?: number };
  project?: { usdPerDay?: number; usdPerWeek?: number };
  global?:  { usdPerMonth?: number };

  // 行为
  onSoftLimit: "notify" | "pause" | "downgrade";  // 默认 80% 时触发
  onHardLimit: "pause" | "abort";                  // 默认 100% 时触发
  downgradeTo?: string;                            // 例：claude-haiku-3.5

  // 软/硬限阈值（可调）
  softLimitRatio: number;  // 默认 0.8
  hardLimitRatio: number;  // 默认 1.0
}
```

### 4.2 成本记录（CostRecord）

```typescript
interface CostRecord {
  id: string;              // uuid
  sessionId: string;
  projectId: string;       // git remote URL hash 或 cwd hash
  timestamp: number;       // unix ms

  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;

  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };

  toolName?: string;       // 哪个 tool 触发的（粗粒度，从 message content 推断）
  taskId?: string;         // 关联 plan 步骤（可选，与 pi-plan-tracker 联动）
}
```

### 4.3 告警（Alert）

```typescript
interface Alert {
  id: string;
  timestamp: number;
  level: "soft" | "hard" | "anomaly";
  dimension: "session" | "project" | "global";
  currentValue: number;
  threshold: number;
  message: string;
  resolvedAction?: "continue" | "downgrade" | "abort" | "raised_budget";
}
```

### 4.4 存储位置

SQLite 单文件：`~/.pi/budget.db`

三张表：`costs` / `budgets` / `alerts`。

索引：`(session_id, timestamp)` / `(project_id, timestamp)` / `(model, timestamp)`。

---

## 5. 功能模块

### 5.1 Layer 1：实时计量

**核心钩子**：`pi.on("message_end")`

```typescript
pi.on("message_end", async (event, ctx) => {
  if (event.message.role !== "assistant") return;
  const usage = event.message.usage; // pi 字段名：input / output / cacheRead / cacheWrite
  if (!usage?.cost?.total) return;

  await db.insertCost({
    sessionId: ctx.sessionManager.getSessionFile() ?? "ephemeral",
    projectId: await getProjectId(ctx.cwd),
    timestamp: Date.now(),
    model: event.message.model ?? "unknown",
    inputTokens: usage.input,        // pi: usage.input (不是 inputTokens)
    outputTokens: usage.output,      // pi: usage.output
    cacheRead: usage.cacheRead,
    cacheWrite: usage.cacheWrite,
    cost: usage.cost,
    toolName: lastToolName(event.message),  // 直接从 content 中读 tool_use，无需"推断"
  });

  refreshWidget(ctx);
  checkLimits(ctx);
});
```

> ⚠️ 字段映射注意：pi 的 `usage` 字段名是 `input` / `output` / `cacheRead` / `cacheWrite`（见 session-format.md §Usage）。
> 本扩展内部 `CostRecord` 仍保留 `inputTokens` / `outputTokens` 命名（更可读），写入时做一次映射。
>
> `lastToolName(message)`：`message_end` 触发时 assistant message 已落盘完整 content，
> 直接遍历 `content[]` 取最后一个 `{type:"tool_use"}` 块的 `name` 即可，无需"推断"。

**状态栏 widget**（用 `ctx.ui.setWidget("pi-budget", lines, {placement})` 注册，默认在编辑器下方）：

```
┌──────────────────────────────────────────────┐
│ ◉ claude-sonnet-4.5 │ $0.42/$1.00 ████░░ │  │
│   📊 28K/200K (14%)                          │
└──────────────────────────────────────────────┘
```

**可配置项**（通过 `/budget config` 或手编辑 `~/.pi/budget.json`）：
- `placement`: `"aboveEditor"` | `"belowEditor"`（默认下方）
- `compact`: true 时只显示 `$0.42/$1.00`（极简模式）
- `showModel`: 是否显示模型名
- `showProgressBar`: 是否显示进度条
- `showContextWindow`: 是否显示上下文窗口用量（📊 28K/200K (14%)，数据来自 `ctx.getContextUsage()`，自动跟随当前模型）
- `currencySymbol`: 旧 widget 配置中的显示前缀；当前扩展按 `pricingAnchor` 推导币种并换算金额。

上下文刷新约定：
- 每次绘制时重新读取 `ctx.getContextUsage()`（与 Pi 自带底栏一致），不在注册时冻结快照。`message_end` 触发时 Pi 可能尚未把这条消息计入上下文，只靠事件刷新会让底栏落后一条消息或停在压缩前的值。
- `session_compact`（手动或自动压缩成功）与 `session_tree`（切换分支）之后仍主动重绘一次，保证只有上下文变化、没有新消息时也立即更新。
- 压缩后 Pi 暂时返回 `tokens: null`、`percent: null`，此时显示 `?/272.0K`（分母跟随当前模型）；下一次有效助手响应后自动恢复新用量，无需额外事件。失败或取消压缩没有成功事件，保留现有显示。
- 上下文重绘沿用上次的 USD 消费金额并按当前币种显示，不新增消费记录、不重算预算，避免按模型显示名重查而清零。终端 widget 刷新仅在 TUI 模式执行。

消费缓存约定：
- 会话级与「会话 + 模型」级金额缓存必须从数据库已有记录起算。新进程恢复会话后的首笔记录只叠加新金额，不会抹掉历史记录，底栏和限额判断保持一致。

颜色编码：
- 绿色：< 60% 预算
- 黄色：60–80%
- 橙色：80–100%（软限）
- 红色：> 100%（硬限）

### 5.2 Layer 2：主动控制

**软限（默认 80%）**：
- 通知：`ui.notify("本会话已花 $0.80，预算 $1.00", "warn")`
- 弹选项卡片：
  ```
  ┌─ 预算警告 ──────────────────────────┐
  │ 已用 $0.80 / $1.00 (80%)            │
  │ 预计还能跑 ~4 次类似请求             │
  │                                      │
  │ [继续]  [切到 Haiku]  [结束]  [调高] │
  └──────────────────────────────────────┘
  ```

**硬限（100%）**：

拦截点（任选其一，推荐方案 A）：

- **方案 A（推荐）**：监听 `input` 事件，若已达硬限，返回 `{ action: "handled" }` 并自行 `ctx.ui.notify(...)` 提示。这样 pi 不会把消息发给 LLM。
- **方案 B**：监听 `tool_call`，对每个工具调用判断 `{ block: true, reason }`。粒度更细，但 LLM 仍然被调用了一次（成本仍会累计）。
- ❌ pi **没有** `user_message_submit` 事件（原设计写错了，已修正）。

```typescript
pi.on("input", async (event, ctx) => {
  if (state.hardLimitHit && event.source === "interactive") {
    await showHardLimitCard(currentStatus());     // 弹窗阻塞
    if (!state.budgetRaised) {
      ctx.ui.notify("已硬限，消息未发送", "warning");
      return { action: "handled" };                // 不进入 agent
    }
  }
  return { action: "continue" };
});
```

强制弹窗（不可关闭）：
  ```
  ┌─ 硬限触发 ──────────────────────────┐
  │ 已达 $1.00 上限，已暂停新请求        │
  │                                      │
  │ [本次放行 + 调高预算]  [结束会话]    │
  │ [导出报告]                           │
  └──────────────────────────────────────┘
  ```

**降级策略**（在触发软限时主动调 `pi.setModel()` 切到便宜模型，并记录原模型以便恢复）：

> ⚠️ pi **没有** `provider_request` 钩子，实际钩子名是 `before_provider_request`，
> 且其返回值是**整个 payload 的替换**，**不是** `{ overrides: { model } }` 形式 ——
> 用它改 model 需要重写整个 payload，不推荐。
>
> 推荐做法：直接用 `pi.setModel(targetModel)`，pi 会触发 `model_select` 事件供其他扩展感知。

```typescript
async function applyDowngrade(pi, ctx, config, state) {
  if (!state.shouldDowngrade || !config.downgradeTo) return;

  const target = ctx.modelRegistry.find(/* provider */, config.downgradeTo);
  if (!target) return;

  state.originalModel = ctx.model;
  const ok = await pi.setModel(target);
  if (!ok) {
    ctx.ui.notify(`降级失败：${config.downgradeTo} 无可用 key`, "warning");
    return;
  }
  ctx.ui.notify(`已自动切换到 ${config.downgradeTo}，\n恢复预算或手动切回请用 /budget downgrade off`, "info");
}
```

降级是**主动动作**，不是 provider 钩子拦截。可由软限弹窗的"切到 Haiku"选项触发，或由 `onSoftLimit: "downgrade"` 自动触发。

### 5.3 Layer 3：洞察分析

**`/budget report`** 命令打开 TUI 报表（MVP 阶段先用纯文本）：

```
📦 Today (2026-06-04)
─────────────────────────────────────
Total: $4.20  Sessions: 3  Avg: $1.40

By Model:
  claude-sonnet-4.5   $3.10  (74%) ████████████
  gpt-5               $0.85  (20%) ███
  claude-haiku-3.5    $0.25  ( 6%) █

By Tool:
  bash                $1.80  (43%) ██████████   ← 反复跑测试
  read                $0.90  (21%) ████         ← 反复读 package.json
  edit                $0.70  (17%) ███
  agent_run           $0.80  (19%) ████

💡 Suggestions:
  • Cache package.json reads (-$0.30/day)
  • Use Haiku for bash/test loops (-$1.20/day, est -15% quality)
  • Consider monthly plan: Claude Max @ $100/mo (current run-rate $126)

趋势：本周 ↗ +18%   |   同任务 vs 上次 ↘ -12%
```

**洞察规则引擎**（v2）：

| 规则 | 触发条件 | 建议 |
|---|---|---|
| 重复读取 | 同文件被 read > 5 次/session | "考虑加入 .piignore 或主动 compact" |
| 工具偏重 | bash 单工具占比 > 40% | "切便宜模型跑 bash 循环" |
| 缓存未启用 | cacheRead / inputTokens < 10% | "检查 prompt cache 是否启用" |
| 模型浪费 | 简单 read/edit 用了 opus/sonnet | "为简单工具配置 model router" |
| 月度超限 | run-rate > 月度预算 | "考虑订阅制（Claude Max / Cursor Pro）" |
| 异常 spike | 单次请求成本 > 历史 P99 × 3 | "可能上下文爆炸，建议 compact" |

### 5.4 跨扩展集成（v2）

| 联动扩展 | 集成点 | 实现 |
|---|---|---|
| `pi-plan-tracker` | 每个 plan step 关联 cost，看哪步烧钱 | 通过 `pi.events` 发 `cost:step` 事件 |
| `pi-agent-checkpoint` | 长任务 cost 超阈值自动 checkpoint | 监听 budget 事件触发 checkpoint |
| `pi-subagents` | 子 agent 各自预算隔离 | 子 agent context 注入子预算 |
| `pi-paradigm-router` | vibe 默认贵模型，ai 模式默认便宜模型 | 共享配置 |

---

## 6. 命令清单

```
/budget                       # 当前会话实时概览
/budget set <amount>          # 设置本会话预算        例：/budget set 2.00
/budget set project <amount>  # 设置项目日预算        例：/budget set project 10
/budget unset [scope]         # 清除预算（session/project/global）
/budget report [range]        # 完整报表              例：/budget report today / week / month
/budget by <dim>              # 维度切片              例：/budget by tool / by model / by session
/budget downgrade [model|off] # 手动降级当前会话
/budget reset                 # 重置当前会话计数（不删历史）
/budget config                # 打开配置 UI
/budget export [format]       # 导出 CSV / JSON
/budget projects              # 按项目对比成本
/budget alerts                # 查看历史告警
```

---

## 7. 实现难度评估

| 模块 | 难度 | 工时 | 风险 |
|---|---|---|---|
| SQLite schema + 写入 | ⭐ | 2h | 无 |
| message_end 监听 + 累计 | ⭐ | 1h | 无 |
| **项目识别 (git remote / cwd hash)** | ⭐⭐ | **1h** | git 缺失 / 裸仓库回退 |
| 状态栏 widget | ⭐⭐ | 3h | 无（直接用 ctx.ui.setWidget） |
| `/budget report` 文本报表 | ⭐⭐ | 3h | 无 |
| `/budget report` TUI 图表 | ⭐⭐⭐ | 6h | ink 渲染、性能 |
| **软/硬限拦截逻辑** | ⭐⭐ | **5h** | input 事件 vs tool_call 选型，弹窗与 agent 时序 |
| **模型降级 (pi.setModel)** | ⭐⭐ | **3h** | 原模型记录 + 恢复 + model_select 联动 |
| 洞察建议引擎 | ⭐⭐⭐⭐ | 8h | 规则库需打磨 |
| 跨项目聚合 | ⭐⭐ | 2h | 已含在项目识别 |
| 跨扩展事件总线集成 | ⭐⭐ | 3h | 依赖其他扩展 API |

**MVP**：**~18–20h**（含修正后的拦截逻辑和降级方案；原估 15h 因 §5.2 事件名 / §5.2 override 机制偏差偏乐观）
**完整版**：~30h

---

## 8. MVP 范围（最小可发布，2-3 天）

前置（必读，已在 §5 中修正设计）：
- ✅ pi 的 `usage` 字段是 `input` / `output` / `cacheRead` / `cacheWrite`，**不是** `inputTokens`
- ✅ pi 没有 `user_message_submit` 事件，硬限用 `input` 事件返回 `{action:"handled"}`
- ✅ pi 没有 `provider_request`，降级用 `pi.setModel()` 而非 payload override
- ✅ 模型定价信任 `usage.cost.total`（pi 已内置），不自行计算
- ✅ projectId：`git remote get-url origin` → sha256；失败回退 cwd 绝对路径 → sha256

第一版做这 5 件事（在原 4 项基础上叠加 4 项边缘情况兜底，约 +25 行）：

1. ✅ 监听 `message_end`，SQLite 累计成本
2. ✅ 状态栏 widget 显示 `$used/$budget`（同时监听 `model_select` 事件刷新，防止切模型后 widget 显示错模型）
3. ✅ `/budget set N` + 软/硬限弹窗
4. ✅ `/budget report` 简单文本报表（不做 TUI 图表）
5. ✅ **边缘情况兜底**（一起做掉，避免后续返工）：
   - `~/.pi/budget.json` 支持手填 `projectId`，覆盖自动 git remote / cwd hash（移动文件夹不断历史）
   - `~/.pi/budget.json` 不存在时使用合理默认值，不让扩展崩溃
   - `usage.cost.total` 缺失（如 pi 未识别新模型定价）时记 0 + warning log

**不做**（留给 v2）：
- ❌ 自动降级策略
- ❌ 洞察建议引擎
- ❌ 跨扩展集成
- ❌ 项目级 / 月度预算

---

## 9. 技术选型

| 项目 | 选择 | 理由 |
|---|---|---|
| 运行时 | Node.js (pi 扩展标准) | 强制 |
| 数据库 | `node:sqlite`（Node 22.13+ 内置） | 同步 API、零配置、单文件、无原生依赖 |
| Schema 管理 | 手写 migration（不用 ORM） | 表少，简单 |
| TUI 渲染 | pi 内置 widget API + ink | 跟随 pi 约定 |
| 配置文件 | `~/.pi/budget.json` | 用户可手编辑 |
| 日志 | 写入 `~/.pi/logs/budget.log` | 调试用 |

---

## 10. 项目结构

```
pi-agent-budget/
├── package.json
├── tsconfig.json
├── README.md
├── design.md             # 本文件
├── src/
│   ├── index.ts          # 扩展入口（pi.on 钩子注册）
│   ├── db/
│   │   ├── schema.sql
│   │   ├── client.ts     # node:sqlite 包装
│   │   └── migrations.ts
│   ├── core/
│   │   ├── tracker.ts    # CostRecord 累计
│   │   ├── limits.ts     # 软/硬限判断
│   │   ├── downgrade.ts  # 模型降级逻辑
│   │   └── project.ts    # projectId 计算
│   ├── ui/
│   │   ├── widget.ts     # 状态栏 widget
│   │   ├── report.ts     # /budget report 渲染
│   │   └── alert-card.ts # 限值弹窗
│   ├── commands/
│   │   ├── set.ts
│   │   ├── report.ts
│   │   ├── downgrade.ts
│   │   └── export.ts
│   ├── config.ts         # 配置读写
│   └── insights/
│       └── rules.ts      # v2 洞察引擎
└── examples/
    └── budgets.json      # 示例配置
```

---

## 11. 开放问题（待研究）

- [x] ~~pi 当前 `provider_request` 是否支持 model override？~~ → **已验证**：pi 无此钩子，用 `pi.setModel()` 实现
- [x] ~~项目识别策略~~ → **已定**：`git remote get-url origin` → sha256，失败回退 cwd 绝对路径 → sha256
- [x] ~~模型定价表如何同步~~ → **已定**：MVP 信任 `usage.cost.total`（pi 内置定价），不自算
- [ ] 用户在多 tab session 下，预算是按 session 还是按 tab 算？（MVP 只做 session 级，留 v2）
- [ ] 是否要做 web dashboard（独立网页看跨项目报表）？v3 再考虑
- [ ] `before_provider_request` 是否值得用（payload rewrite）？MVP 不用，v2 评估

---

## 12. 参考资料

- pi 扩展文档：`/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
- pi session 格式（usage 字段）：`/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/session-format.md`（§Usage：`input` / `output` / `cacheRead` / `cacheWrite` / `cost.total`）
- 事件总线示例：`/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/examples/extensions/event-bus.ts`
- Widget API：见 `extensions.md` 中 `ctx.ui.setWidget(name, lines | renderer, opts?)` 段落
- 模型切换：见 `extensions.md` 中 `pi.setModel(model)` 段落
- 类似产品调研（待补）：aider 的 `--cache-prompts`、ccline 的 cost summary

---

## 13. 附录 — 2026-06-04 修订记录

本次修订对脚手架阶段发现的设计偏差做了 6 处对齐：

| # | 位置 | 原文 | 修正后 | 依据 |
|---|---|---|---|---|
| 1 | §5.1 | `usage.inputTokens` 等 | `usage.input` / `output` / `cacheRead` / `cacheWrite` | session-format.md §Usage |
| 2 | §5.1 | "参考 pi-bar / pi-powerline-footer" | `ctx.ui.setWidget("pi-budget", lines)` | extensions.md §Custom UI / Widget |
| 3 | §5.1 | `inferLastTool(event.message)` | `lastToolName(event.message)` —— 直接读 content 中 tool_use 块 | message_end 时 content 已完整 |
| 4 | §5.2 | "拦截 `user_message_submit` 或 `message_start`，返回 `{cancel:true}`" | 用 `input` 事件返回 `{action:"handled"}`；pi 无 `user_message_submit` | extensions.md §Input Events |
| 5 | §5.2 | `pi.on("provider_request")` 返回 `{overrides:{model}}` | `pi.setModel(target)` 主动切换 + `model_select` 联动 | extensions.md §ExtensionAPI Methods |
| 6 | §11 | 5 个 open question | 3 个已闭环，新增 1 个（`before_provider_request` 评估） | — |

工时随之从 ~15h 调到 ~18–20h（§7）。
