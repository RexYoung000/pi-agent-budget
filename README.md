# pi-agent-budget

> Pi 扩展：让 AI coding 从"不知不觉烧钱"变成"在预算内放心跑"。

实时追踪 AI 对话的 token 消耗和费用，在输入框下方显示成本 widget，支持软/硬预算限制，中国模型自动用人民币定价。

---

## 功能一览

- 👁️ **实时成本追踪**：每轮对话自动记录 token × 价格表 = 费用
- 📊 **状态栏 widget**：输入框下方实时显示 `¥0.16 / ¥10.00 ██░░░░`（模型名 + 成本 + 预算 + 进度条）
- 🇨🇳 **人民币原生定价**：deepseek / qwen / glm / kimi / doubao 等中国模型直接用人民币标价
- 🛡️ **软/硬预算限制**：到达 80% 弹窗提醒，到达 100% 阻止继续对话
- 📈 **/budget 仪表盘**：概览 + 预算设置 + 价格表 + 全局配置，TUI 面板
- 📋 **/budget report**：按模型 / 工具 / 会话维度的费用报表

---

## 安装

```bash
pi install npm:pi-agent-budget
```

> 依赖 `better-sqlite3`（原生 C++ 模块），首次安装需要编译工具链。macOS 需 Xcode CLT（`xcode-select --install`），Linux 需 `build-essential`。

---

## 命令

```
/budget                     # 仪表盘（概览/预算/价格表/设置）
/budget set <金额>           # 设置会话预算      例：/budget set 2
/budget set project <金额>   # 设置项目日预算
/budget report [范围]        # 费用报表          例：/budget report week
/budget by <维度> [范围]     # 按模型/工具/会话切片
/budget widget              # widget 外观设置
/budget export              # 导出消费数据
```

---

## 配置

通过 `/budget config` 或手编辑 `~/.pi/budget.json`：

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

| 配置项 | 说明 | 默认值 |
|---|---|---|
| `session.usd` | 会话预算（USD） | 无限制 |
| `pricingAnchor` | 价格锚点：`followModel` / `cny` / `usd` | `followModel` |
| `widget.placement` | Widget 位置：`belowEditor` / `aboveEditor` | `belowEditor` |
| `widget.compact` | 极简模式 | `false` |
| `softLimitRatio` | 软限触发比例 | `0.8` |
| `hardLimitRatio` | 硬限触发比例 | `1.0` |

### 关于货币

- **`followModel`（默认）**：中国模型（deepseek/qwen/glm 等）自动显示人民币 ¥，美国模型显示美元 $
- **`cny`**：全部统一显示人民币，预算预设用人民币金额
- **`usd`**：全部统一显示美元

内置汇率 1 USD ≈ 7.2 CNY，中国模型用人民币价格表，内部统一转 USD 存储。

---

## 数据存储

| 文件 | 用途 |
|---|---|
| `~/.pi/budget.db` | SQLite（costs / budgets / alerts） |
| `~/.pi/budget.json` | 用户配置 |

---

## 开发

```bash
npm run check          # TypeScript 类型检查
pi -e ./src/index.ts   # 本地测试加载
```

---

## License

MIT
