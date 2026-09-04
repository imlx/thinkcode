"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getModuleById } from "@/lib/trigger-engine";
import { getAhaRecords, getBehaviorLogs, ensureBaselineData } from "@/lib/ideology-store";
import { useLocale } from "@/lib/i18n";

type BridgeProgress = "untouched" | "ongoing" | "finished" | "enlightened";

interface BridgeRow {
  tech: string;
  ideology: string;
  sessions: string[];
  hint: string;
}

const BRIDGE_ROWS: BridgeRow[] = [
  { tech: "上下文工程", ideology: "理论武装工程", sessions: ["s4"], hint: "信息源的权威性分层，就是政治判断力的信息科学版" },
  { tech: "执行层", ideology: "知行合一机制", sessions: ["s1", "s2"], hint: "观察—思考—行动的闭环，把价值目标写进系统提示词" },
  { tech: "反馈层", ideology: "实时校准回路", sessions: ["s7"], hint: "批评和自我批评的工程化——反馈不是否定，而是优化的必要条件" },
  { tech: "约束机制", ideology: "底线思维护栏", sessions: ["s3", "s8"], hint: "权限即责任——把权力关进制度的笼子，约束不是束缚而是保护" },
  { tech: "协作层", ideology: "组织共同体", sessions: ["s5", "s6"], hint: "协议层是组织的共同语言，经验沉淀是红色基因的代际传承" },
];

const PROGRESS_META: Record<BridgeProgress, { fill: string; border: string; label: string; dot: string }> = {
  untouched: { fill: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-200 dark:border-zinc-700", label: "未开始", dot: "bg-zinc-300 dark:bg-zinc-600" },
  ongoing: { fill: "bg-blue-50 dark:bg-blue-950", border: "border-blue-200 dark:border-blue-800", label: "进行中", dot: "bg-blue-500" },
  finished: { fill: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", label: "已完成", dot: "bg-emerald-500" },
  enlightened: { fill: "bg-amber-50 dark:bg-amber-950", border: "border-amber-300 dark:border-amber-700", label: "已顿悟", dot: "bg-amber-500" },
};

function computeRowProgress(sessions: string[], ahaByModule: Map<string, number>, visited: Set<string>): BridgeProgress {
  let ahaTotal = 0;
  let anyVisited = false;
  for (const id of sessions) {
    ahaTotal += ahaByModule.get(id) ?? 0;
    if (visited.has(id)) anyVisited = true;
  }
  if (ahaTotal >= 3) return "enlightened";
  if (ahaTotal > 0 && ahaTotal >= sessions.length) return "finished";
  if (anyVisited || ahaTotal > 0) return "ongoing";
  return "untouched";
}

export function HarnessBridge() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [progress, setProgress] = useState<Map<number, BridgeProgress>>(new Map());
  const locale = useLocale();

  useEffect(() => {
    ensureBaselineData();
    const ahaByModule = new Map<string, number>();
    for (const record of getAhaRecords()) {
      ahaByModule.set(record.module_id, (ahaByModule.get(record.module_id) ?? 0) + 1);
    }
    const visited = new Set(
      getBehaviorLogs()
        .filter((log) => log.action === "ideology_tab_opened" && log.module_id)
        .map((log) => log.module_id as string)
    );
    const next = new Map<number, BridgeProgress>();
    BRIDGE_ROWS.forEach((row, index) => {
      next.set(index, computeRowProgress(row.sessions, ahaByModule, visited));
    });
    setProgress(next);
  }, []);

  return (
    <div className="space-y-3">
      {BRIDGE_ROWS.map((row, index) => {
        const state = progress.get(index) ?? "untouched";
        const meta = PROGRESS_META[state];
        const isOpen = expanded === index;
        return (
          <div key={row.tech}>
            <div className="flex items-stretch gap-0">
              {/* 左列：技术模块 */}
              <button
                onClick={() => setExpanded(isOpen ? null : index)}
                className={`flex-1 rounded-l-xl border-y border-l ${meta.border} ${meta.fill} px-4 py-3 text-left transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-semibold">{row.tech}</span>
                  <span className="ml-auto text-xs text-zinc-400">{meta.label}</span>
                </div>
              </button>

              {/* 中间映射连线 */}
              <button
                onClick={() => setExpanded(isOpen ? null : index)}
                aria-label={`${row.tech} 映射 ${row.ideology}`}
                className="relative flex w-14 items-center justify-center bg-transparent"
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700" />
                <span className={`relative z-10 rounded-full border ${meta.border} ${meta.fill} px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400`}>
                  映射
                </span>
              </button>

              {/* 右列：思想Harness模块 */}
              <button
                onClick={() => setExpanded(isOpen ? null : index)}
                className={`flex-1 rounded-r-xl border-y border-r ${meta.border} ${meta.fill} px-4 py-3 text-left transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-semibold">{row.ideology}</span>
                  <span className="ml-auto text-xs text-zinc-400">{isOpen ? "收起" : "展开"}</span>
                </div>
              </button>
            </div>

            {/* 展开的实践入口 */}
            {isOpen && (
              <div className="ml-4 mt-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{row.hint}</p>
                <div className="flex flex-wrap gap-2">
                  {row.sessions.map((sessionId) => {
                    const mod = getModuleById(sessionId);
                    if (!mod) return null;
                    return (
                      <Link
                        key={sessionId}
                        href={`/${locale}/cases/${sessionId}`}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-950"
                      >
                        <span className="mr-1 font-mono text-zinc-400">{sessionId}</span>
                        {mod.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-4 pt-1 text-xs text-zinc-500">
        {(Object.keys(PROGRESS_META) as BridgeProgress[]).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${PROGRESS_META[key].dot}`} />
            {PROGRESS_META[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}
