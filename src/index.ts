/**
 * pi-agent-budget — 扩展入口
 *
 * 设计文档：../design.md
 *
 * 当前实现进度：MVP Step 1 ✅（Layer 1 数据库写入 + cost 累计）
 *   - message_end 钩子 → SQLite
 *   - 内存缓存避免每条都查 SUM
 *   - cost.total 缺失时打 warning（兜底）
 *
 * 加载方式：
 *   pi -e ./src/index.ts
 *   或放到 ~/.pi/agent/extensions/pi-budget/ 自动加载
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { BudgetDb } from "./db/client.js";
import { createTracker, lastToolName } from "./core/tracker.js";
import { getProjectId } from "./core/project.js";
import { loadConfig } from "./config.js";

export default function (pi: ExtensionAPI) {
  // ────────────────────────────────────────────────────────────────────────
  // 共享状态：lazy 初始化
  // ────────────────────────────────────────────────────────────────────────
  let dbPromise: Promise<BudgetDb> | null = null;
  // cwd → projectId 缓存（一次会话同一个 cwd 不会变）
  const projectIdCache = new Map<string, string>();
  const config = loadConfig();

  async function getDb(): Promise<BudgetDb> {
    if (!dbPromise) {
      dbPromise = BudgetDb.open();
      dbPromise.catch(() => {
        // 失败后允许下次重试
        dbPromise = null;
      });
    }
    return dbPromise;
  }

  function getProjectIdForCwd(cwd: string): string {
    const cached = projectIdCache.get(cwd);
    if (cached) return cached;
    const id = getProjectId(cwd, config.projectIdOverride);
    projectIdCache.set(cwd, id);
    return id;
  }

  function getSessionId(ctx: { sessionManager?: { getSessionFile?: () => string | undefined } }): string {
    return ctx.sessionManager?.getSessionFile?.() ?? "ephemeral";
  }

  // ────────────────────────────────────────────────────────────────────────
  // Layer 1: Observability —— message_end → SQLite
  // ────────────────────────────────────────────────────────────────────────
  pi.on("message_end", async (event, ctx) => {
    if (event.message.role !== "assistant") return;

    const message = event.message as {
      model?: string;
      content?: unknown;
      usage?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
        cost?: {
          input?: number;
          output?: number;
          cacheRead?: number;
          cacheWrite?: number;
          total?: number;
        };
      };
    };

    const usage = message.usage;
    const costTotal = usage?.cost?.total;

    // 兜底 #3：cost 缺失（pi 未识别新模型定价）→ 记 0 + warn，不报错
    if (costTotal == null) {
      console.warn(
        `[pi-budget] usage.cost.total 缺失，跳过记录（model=${message.model ?? "?"}）`,
      );
      return;
    }

    try {
      const db = await getDb();
      const tracker = createTracker(db);

      const sessionId = getSessionId(ctx);
      const projectId = getProjectIdForCwd(ctx.cwd);

      tracker.record({
        sessionId,
        projectId,
        model: message.model ?? "unknown",
        inputTokens: usage?.input ?? 0,
        outputTokens: usage?.output ?? 0,
        cacheRead: usage?.cacheRead ?? 0,
        cacheWrite: usage?.cacheWrite ?? 0,
        cost: {
          input: usage?.cost?.input ?? 0,
          output: usage?.cost?.output ?? 0,
          cacheRead: usage?.cost?.cacheRead ?? 0,
          cacheWrite: usage?.cost?.cacheWrite ?? 0,
          total: costTotal,
        },
        toolName: lastToolName(message),
      });

      // MVP Step 2 会接 widget 刷新；这里先留空调用
      tracker.refreshWidget(sessionId);
    } catch (err) {
      // 永远不要让 budget 扩展把 agent 主流程搞崩
      console.warn(`[pi-budget] message_end 处理失败: ${(err as Error).message}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // Layer 2: Control（待 Step 3）
  // ────────────────────────────────────────────────────────────────────────
  // TODO(MVP Step 3): input 事件硬限拦截 + 软限弹窗

  // ────────────────────────────────────────────────────────────────────────
  // Layer 3: Optimization（v2）
  // ────────────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────────────
  // Commands（待 Step 3-4）
  // ────────────────────────────────────────────────────────────────────────
}
