/**
 * projectId 计算
 *
 * 设计文档：../../design.md §4.2 / §11（已闭环）/ §13
 *
 * 策略：
 *   1. 配置文件手填 projectId（最高优先级，逃生口）
 *   2. 否则 `git -C <cwd> remote get-url origin` → sha256(url.trim())
 *   3. 失败（无 git / 裸仓库 / 无 remote）→ sha256(resolve(cwd))
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

/** 给定 raw 字符串返回稳定 hex hash。 */
export function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** 尝试从 git remote 获取稳定标识。失败返回 undefined。 */
function readGitRemote(cwd: string): string | undefined {
  try {
    const r = spawnSync("git", ["-C", cwd, "remote", "get-url", "origin"], {
      encoding: "utf8",
      // 不让 stderr 漏到 pi 控制台
      stdio: ["ignore", "pipe", "ignore"],
    });
    if (r.status !== 0 || !r.stdout) return undefined;
    const url = r.stdout.trim();
    return url || undefined;
  } catch {
    return undefined;
  }
}

/** 返回稳定的项目 ID（hex 64）。先试 git remote，失败回退 cwd 绝对路径。 */
export function getProjectId(cwd: string, override?: string): string {
  if (override && override.trim()) return hashId(override.trim());
  const remote = readGitRemote(cwd);
  if (remote) return hashId(remote);
  return hashId(resolve(cwd));
}
