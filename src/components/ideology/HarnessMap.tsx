"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IDEOLOGY_MODULES, type IdeologyModule } from "@/lib/trigger-engine";
import { getAhaRecords, getBehaviorLogs } from "@/lib/ideology-store";
import { useLocale } from "@/lib/i18n";

export type HarnessProgress = "locked" | "learning" | "passed" | "mastered";

interface NodeState {
  progress: HarnessProgress;
  ahaCount: number;
}

const PROGRESS_STYLE: Record<HarnessProgress, { fill: string; text: string; label: string }> = {
  locked: { fill: "#e4e4e7", text: "#71717a", label: "未解锁" },
  learning: { fill: "#dbeafe", text: "#1d4ed8", label: "学习中" },
  passed: { fill: "#d1fae5", text: "#047857", label: "已通过" },
  mastered: { fill: "#fef3c7", text: "#b45309", label: "已掌握" },
};

const NODE_W = 168;
const NODE_H = 64;
const GAP_X = 48;
const COLS = 4;

function computeStates(): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  const records = getAhaRecords();
  const logs = getBehaviorLogs();

  for (const mod of IDEOLOGY_MODULES) {
    const ahaCount = records.filter((record) => record.module_id === mod.id).length;
    const visited = logs.some(
      (log) =>
        log.module_id === mod.id &&
        (log.action === "ideology_tab_opened" || log.action === "simulate_tab_opened")
    );
    let progress: HarnessProgress = "locked";
    if (ahaCount >= 3) progress = "mastered";
    else if (ahaCount >= 1) progress = "passed";
    else if (visited) progress = "learning";
    states.set(mod.id, { progress, ahaCount });
  }
  return states;
}

export function HarnessMap() {
  const [states, setStates] = useState<Map<string, NodeState>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    setStates(computeStates());
  }, []);

  const selected: IdeologyModule | null = useMemo(
    () => IDEOLOGY_MODULES.find((mod) => mod.id === selectedId) ?? null,
    [selectedId]
  );

  const rows = Math.ceil(IDEOLOGY_MODULES.length / COLS);
  const width = COLS * NODE_W + (COLS - 1) * GAP_X + 32;
  const height = rows * (NODE_H + 56) + 40;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="思想 Harness 架构图"
        >
          <defs>
            <marker
              id="harness-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa" />
            </marker>
          </defs>
          {IDEOLOGY_MODULES.map((mod, index) => {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const x = 16 + col * (NODE_W + GAP_X);
            const y = 24 + row * (NODE_H + 56);
            const state = states.get(mod.id) ?? { progress: "locked" as HarnessProgress, ahaCount: 0 };
            const style = PROGRESS_STYLE[state.progress];
            const isSelected = selectedId === mod.id;

            return (
              <g
                key={mod.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => setSelectedId(isSelected ? null : mod.id)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx="10"
                  fill={style.fill}
                  stroke={isSelected ? "#f59e0b" : "#d4d4d8"}
                  strokeWidth={isSelected ? 2.5 : 1}
                />
                <text x={12} y={24} fontSize="12" fontFamily="monospace" fill={style.text}>
                  {mod.id}
                </text>
                <text x={12} y={42} fontSize="12" fill={style.text}>
                  {mod.title.split("：")[0]}
                </text>
                <text x={12} y={56} fontSize="10" fill={style.text}>
                  {style.label}
                  {state.ahaCount > 0 ? ` · 顿悟×${state.ahaCount}` : ""}
                </text>
                {index < IDEOLOGY_MODULES.length - 1 && col < COLS - 1 && (
                  <line
                    x1={NODE_W}
                    y1={NODE_H / 2}
                    x2={NODE_W + GAP_X - 8}
                    y2={NODE_H / 2}
                    stroke="#a1a1aa"
                    strokeWidth="1.5"
                    markerEnd="url(#harness-arrow)"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex gap-4 text-xs text-zinc-500">
          {(Object.keys(PROGRESS_STYLE) as HarnessProgress[]).map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: PROGRESS_STYLE[key].fill, border: "1px solid #d4d4d8" }}
              />
              {PROGRESS_STYLE[key].label}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-amber-300 bg-white p-6 shadow-sm dark:border-amber-700 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">{selected.title}</h3>
            <Link
              href={`/${locale}/cases/${selected.id}`}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              进入模块 →
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {selected.mapping.map((entry, index) => (
              <li key={index} className="flex gap-2">
                <span className="shrink-0 font-mono text-xs text-zinc-500">{entry.tech}</span>
                <span className="text-zinc-300">→</span>
                <span>{entry.ideology}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {selected.scenario.bank}
          </p>
        </div>
      )}
    </div>
  );
}
