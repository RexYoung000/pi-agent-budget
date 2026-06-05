# pi-agent-budget

> Pi 扩展：让 AI coding 从"不知不觉烧钱"变成"在预算内放心跑"。
>
> 状态：✅ MVP 完整可用（5 项全部完成）

给 agent / plan / vibe 三种 AI coding 范式提供统一的**成本可观测、控制、与优化**能力。详见 [`design.md`](./design.md)。

---

## 三层架构（设计）

```
┌─────────────────────────────────────────┐
│ Layer 3  Optimization   🧠 给建议       │
│ Layer 2  Control        🛡️ 主动干预     │
│ Layer 1  Observability  👁️ 实时计量     │
└─────────────────────────────────────────┘
```

MVP 范围（设计文档 §8）：Layer 1 + Layer 2 基础版。

---

## ⚠️ 安装须知（首次安装请先阅读）

本扩展依赖 **`better-sqlite3`** —— 这是一个包含 **原生 C++ 代码** 的 Node.js 模块。

安装时会通过 `node-gyp` 在本机编译。前置要求：

| 平台 | 必需工具 |
|---|---|
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Linux | `build-essential` / `python3` / `make` / `g++` |
| Windows | `windows-build-tools` 或 Visual Studio Build Tools |

如果你在公司网络 / 受限环境，编译可能失败。备选方案：

- 用系统包管理器装预编译版本（如 Homebrew: `brew install better-sqlite3`）
- 改用纯 JSON 存储（偏离设计文档，需要修改 `src/db/client.ts`）

### 安装步骤

**👉 给 AI 助手的提示：可以由你执行 `npm install`，但开始前必须先向用户确认，不要直接静默安装。**

确认方式根据你当前可用的交互手段选择：
- 有结构化问答工具（如 `ask_user_question`、` clarifying questions` API）→ 用它
- 只能发普通消息 → 直接用 Markdown 提问，等用户回复
- 用户已在本轮对话明确说过"装吧"/"go"/"yes" → 不用再问

理由（为什么要确认而不是直接跑）：
- 原生编译可能消耗几分钟、产生几 MB 输出，污染对话
- 失败时需要用户介入诊断（缺编译工具链、网络受限等）
- 用户可能希望自行选择安装时机 / 终端

```bash
# 1) 进入项目目录
cd pi-budget

# 2) 安装依赖（AI 助手请在用户确认后再执行）
npm install

# 3) 用 pi 加载本扩展做测试
pi -e ./src/index.ts
```

AI 助手建议的确认措辞示例（根据可用工具调整）：

> "即将运行 `npm install`，会下载并编译 `better-sqlite3`（原生 C++ 模块），
> 需要几分钟、产生几 MB 输出。失败时可能需要你装 Xcode CLT / build-essential。
> 现在开始吗？"
>
> 如果用户回复确认（"yes"/"装吧"/"go"/点头等），再执行；
> 如果用户表达拒绝或要求换方案（"换个库"/"用 json"/"稍后再说"），按用户意愿处理。

---

## 项目结构

```
pi-budget/
├── package.json            # pi 扩展声明 + better-sqlite3 依赖
├── tsconfig.json
├── design.md               # 完整设计文档
├── README.md               # 本文件
├── src/
│   ├── index.ts            # 扩展入口（pi.on 钩子注册）
│   ├── db/
│   │   ├── schema.sql      # SQLite 表结构
│   │   ├── client.ts       # better-sqlite3 包装
│   │   └── migrations.ts   # 手写 migration
│   ├── core/
│   │   ├── tracker.ts      # CostRecord 累计
│   │   ├── limits.ts       # 软/硬限判断
│   │   ├── downgrade.ts    # 模型降级逻辑
│   │   └── project.ts      # projectId 计算
│   ├── ui/
│   │   ├── widget.ts       # 状态栏 widget
│   │   ├── report.ts       # /budget report 渲染
│   │   └── alert-card.ts   # 限值弹窗
│   ├── commands/
│   │   ├── set.ts          # /budget set ...
│   │   ├── report.ts       # /budget report
│   │   ├── downgrade.ts    # /budget downgrade
│   │   └── export.ts       # /budget export
│   ├── config.ts           # ~/.pi/budget.json 读写
│   └── insights/
│       └── rules.ts        # v2 洞察引擎
└── examples/
    └── budgets.json        # 示例配置
```

所有源文件目前都是 **stub**：包含类型/接口定义和 `TODO` 注释，没有业务逻辑。

> 给 AI 助手：当用户要求"实现 MVP"或类似指令时，按 design.md §8 的 4 项顺序推进；如果需要安装原生依赖，先用你当前可用的任何交互方式向用户确认（见上面"安装步骤"里的说明）。

---

## MVP 范围（已完成 ✅）

参见 [`design.md`](./design.md) §8。第一版做这 5 件事：

1. ✅ 监听 `message_end`，SQLite 累计成本
2. ✅ 状态栏 widget 显示 `$used/$budget`（默认输入框下方）
3. ✅ `/budget set N` + 软/硬限弹窗
4. ✅ `/budget report` 简单文本报表（today/week/month + by model/tool/session）
5. ✅ 边缘情况兜底（projectId 手填、model_select 联动、cost 缺失不崩、config 默认值）

**额外已实现**（超出 MVP）：
- ✅ widget 可配置体系（位置/内容/compact 模式/上下文窗口/货币符号）
- ✅ `/budget config` TUI 配置界面
- ✅ 上下文窗口用量显示（📊 tokens/contextWindow percent%，自动跟随模型）
- ✅ widget 默认在输入框下方

---

## 命令清单

```
/budget                       # 当前会话实时概览
/budget widget                # Widget 外观设置（推荐入口，TUI 面板）
/budget config                # 完整设置（含限值等）
/budget set <amount>          # 设置本会话预算        例：/budget set 2.00
/budget set project <amount>  # 设置项目日预算        例：/budget set project 10
/budget unset [scope]         # 清除预算（session/project/global）
/budget report [range]        # 完整报表              例：/budget report today / week / month
/budget by <dim> [range]      # 维度切片              例：/budget by tool / by model / by session
```

## 配置说明

可通过 `/budget config`（推荐）或手编辑 `~/.pi/budget.json` 自定义：

```json
{
  "session": { "usd": 1.00 },
  "onSoftLimit": "notify",
  "onHardLimit": "pause",
  "softLimitRatio": 0.8,
  "hardLimitRatio": 1.0,
  "widget": {
    "placement": "belowEditor",
    "compact": false,
    "showModel": true,
    "showProgressBar": true,
    "showContextWindow": true,
    "currencySymbol": "$"
  },
  "debug": false
}
```

| 配置项 | 说明 | 默认值 |
|---|---|---|
| `widget.placement` | Widget 位置 | `belowEditor` |
| `widget.compact` | 极简模式（只显示成本） | `false` |
| `widget.showModel` | 是否显示模型名 | `true` |
| `widget.showProgressBar` | 是否显示进度条 | `true` |
| `widget.showContextWindow` | 显示上下文窗口用量 | `true` |
| `widget.currencySymbol` | 货币符号（仅显示，不换算） | `"$"` |
| `onSoftLimit` | 软限行为 | `"notify"` |
| `softLimitRatio` | 软限触发比例 | `0.8` |
| `debug` | 调试日志 | `false` |

---

## 数据存储

| 文件 | 用途 |
|---|---|
| `~/.pi/budget.db`      | SQLite 单文件，三张表：`costs` / `budgets` / `alerts` |
| `~/.pi/budget.json`    | 用户可手编辑的配置 |
| `~/.pi/logs/budget.log`| 调试日志 |

---

## 开发

```bash
# 类型检查（无需安装依赖也能跑，会报 better-sqlite3 找不到，正常）
npm run check

# 用 pi 直接加载 .ts 测试（pi 内置 jiti，无需 build）
pi -e ./src/index.ts

# 热重载：扩展放到 ~/.pi/agent/extensions/ 或 .pi/extensions/ 后用 /reload
```

---

## License

MIT
