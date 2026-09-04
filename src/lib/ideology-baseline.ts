import type { AhaRecord, BehaviorLog } from "./ideology-store";
import { IDEOLOGY_MODULES } from "./trigger-engine";

const MEMBER_COUNT = 50;
const WEEK_MS = 7 * 24 * 3600 * 1000;

function mulberry32(initialState: number) {
  let a = initialState >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 固定基准时间：seed-baseline 与前端识别共用，保证基线时间戳稳定可去重
export const BASELINE_EPOCH = new Date("2026-09-05T00:00:00Z");

// 种子基线记录的识别键集合：前端据此判断研究库是否已写入基线样本
export function buildBaselineKeys(): Set<string> {
  const { records } = buildCommunityBaseline(BASELINE_EPOCH);
  return new Set(records.map((r) => `${r.timestamp}|${r.module_id}|${r.choice_id}`));
}

export function buildCommunityBaseline(now: Date = new Date()): {
  records: AhaRecord[];
  logs: BehaviorLog[];
} {
  const rng = mulberry32(20260904);
  const moduleIds = IDEOLOGY_MODULES.map((mod) => mod.id);
  const optionsByModule = new Map(
    IDEOLOGY_MODULES.map((mod) => [mod.id, mod.ahaOptions])
  );
  const records: AhaRecord[] = [];
  const logs: BehaviorLog[] = [];

  for (let member = 0; member < MEMBER_COUNT; member++) {
    const startWeeksAgo = Math.floor(rng() * 10);
    const modulesReached = 2 + Math.floor(rng() * (moduleIds.length - 1));
    const activeness = 0.4 + rng() * 0.6;

    for (let week = startWeeksAgo; week >= 0; week--) {
      if (rng() > activeness) continue;
      const sessions = 1 + (rng() < 0.35 ? 1 : 0);
      for (let session = 0; session < sessions; session++) {
        const weeksAgo = week + rng() * 0.95;
        const timestamp = new Date(now.getTime() - weeksAgo * WEEK_MS).toISOString();
        const moduleId =
          moduleIds[Math.min(Math.floor(rng() * modulesReached), moduleIds.length - 1)];

        logs.push({
          id: `log_${timestamp.slice(0, 10)}_${logs.length}`,
          timestamp,
          action: "ideology_tab_opened",
          module_id: moduleId,
        });

        logs.push({
          id: `log_${timestamp.slice(0, 10)}_${logs.length}`,
          timestamp,
          action: "simulate_tab_opened",
          module_id: moduleId,
        });

        if (rng() < 0.45) {
          logs.push({
            id: `log_${timestamp.slice(0, 10)}_${logs.length}`,
            timestamp,
            action: "code_tab_opened",
            module_id: moduleId,
          });
        }

        if (rng() < 0.55) {
          const options = optionsByModule.get(moduleId) ?? ["没有共鸣"];
          const choiceIdx = rng() < 0.86 ? Math.floor(rng() * 3) : options.length - 1;
          records.push({
            id: `aha_${timestamp.slice(0, 10)}_${records.length}`,
            timestamp,
            module_id: moduleId,
            choice_id: `option_${choiceIdx}`,
            content: options[choiceIdx],
          });
        }
      }
    }
  }

  records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { records, logs };
}
