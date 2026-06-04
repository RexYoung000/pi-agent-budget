/**
 * projectId 计算
 *
 * 设计文档：../../design.md §4.2 / §11（已闭环）
 *        修订：§13
 *
 * 状态：🚧 scaffold-only
 *
 * 策略（已定）：
 *   1. 先尝试 `git -C <cwd> remote get-url origin`
 *   2. 命中 → sha256(url.trim())
 *   3. 失败（无 git / 裸仓库 / 无 remote）→ sha256(resolve(cwd))
 *
 * 这样同一 git 仓库在不同机器 / 不同路径下得到同一 id；
 * 无 git 时退化为“同路径同 id”，不会崩。
 */

import { createHash } from "node:crypto";

/** 返回稳定的项目 ID（hex 64）。先试 git remote，失败回退 cwd 绝对路径。 */
export async function getProjectId(_cwd: string): Promise<string> {
  // TODO(MVP):
  //   1. 尝试 `git -C <cwd> remote get-url origin`
  //   2. 命中 → sha256(url.trim())
  //   3. 失败（非零退出 / 无 git）→ sha256(resolve(cwd))
  //   注意：用 spawnSync 并吞掉 stderr，避免污染 pi 输出。
  void createHash;
  throw new Error("getProjectId() not implemented (scaffold-only)");
}

/** 给定 raw 字符串返回稳定 hex hash。 */
export function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
