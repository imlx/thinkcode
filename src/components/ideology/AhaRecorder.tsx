"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { IdeologyModule } from "@/lib/trigger-engine";
import {
  AhaRecord,
  getAhaRecords,
  removeAhaRecord,
} from "@/lib/ideology-store";
import { useLocale } from "@/lib/i18n";

interface AhaRecorderProps {
  module: IdeologyModule | null;
  onRecordClick?: () => void;
}

export function AhaRecorder({ module, onRecordClick }: AhaRecorderProps) {
  const [records, setRecords] = useState<AhaRecord[]>([]);
  const locale = useLocale();

  useEffect(() => {
    if (!module) return;
    const refresh = () =>
      setRecords(
        getAhaRecords().filter((record) => record.module_id === module.id)
      );
    refresh();
    window.addEventListener("thinkcode:aha-changed", refresh);
    return () => window.removeEventListener("thinkcode:aha-changed", refresh);
  }, [module]);

  if (!module) return null;

  const handleRemove = (record: AhaRecord) => {
    removeAhaRecord(record.module_id, record.choice_id);
    setRecords(
      getAhaRecords().filter((item) => item.module_id === module.id)
    );
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">顿悟时刻</h3>
        <Link
          href={`/${locale}/growth`}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          思想成长时间线 →
        </Link>
      </div>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{module.ahaPrompt}</p>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          还没有记录。推演数据流、跑通模拟或在任意时刻点击「记录顿悟」。
        </div>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            >
              <div>
                <div>{record.content}</div>
                {record.code_location && (
                  <div className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    {record.code_location}
                    {record.trigger === "manual" ? " · 手动唤出" : ""}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemove(record)}
                aria-label="取消此条记录"
                className="shrink-0 rounded px-1.5 text-xs text-emerald-500 transition-colors hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onRecordClick}
        className="mt-4 w-full rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950"
      >
        打开顿悟邀约
      </button>
    </div>
  );
}
