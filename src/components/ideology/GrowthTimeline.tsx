"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AhaRecord,
  ensureBaselineData,
  exportAhaRecordsAsMarkdown,
  fetchServerAhaRecords,
  getAhaRecords,
  getAhaEndpoint,
  getBaselineRecords,
  hasUploadConsent,
  setUploadConsent,
} from "@/lib/ideology-store";
import { getModuleById } from "@/lib/trigger-engine";
import { useLocale } from "@/lib/i18n";

export function GrowthTimeline() {
  const [personalRecords, setPersonalRecords] = useState<AhaRecord[]>([]);
  // 思政维度数据源：优先真实服务器研究库，不可达回退社区基线样本
  const [serverRecords, setServerRecords] = useState<AhaRecord[] | null>(null);
  const [fallback, setFallback] = useState(false);
  const [consent, setConsent] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const locale = useLocale();

  useEffect(() => {
    const refreshPersonal = () => setPersonalRecords(getAhaRecords());
    refreshPersonal();
    setConsent(hasUploadConsent());
    window.addEventListener("thinkcode:aha-changed", refreshPersonal);
    return () => window.removeEventListener("thinkcode:aha-changed", refreshPersonal);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchServerAhaRecords()
      .then((records) => {
        if (!cancelled) setServerRecords(records);
      })
      .catch(() => {
        if (cancelled) return;
        // 研究库不可达：写入本地基线样本兜底
        ensureBaselineData();
        setServerRecords(getBaselineRecords());
        setFallback(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const records = useMemo(
    () =>
      [...personalRecords, ...(serverRecords ?? [])].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      ),
    [personalRecords, serverRecords]
  );

  const handleExport = () => {
    const markdown = exportAhaRecordsAsMarkdown();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `思想成长记录_${date}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!consent) return;
    setUploadState("sending");
    try {
      const endpoint = getAhaEndpoint();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: getAhaRecords().map((record) => ({
            timestamp: record.timestamp,
            module_id: record.module_id,
            choice_id: record.choice_id,
          })),
        }),
      });
      setUploadState(res.ok ? "done" : "error");
    } catch {
      setUploadState("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleExport}
          disabled={records.length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          导出 Markdown（思想成长记录_YYYYMMDD.md）
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setUploadConsent(event.target.checked);
            }}
          />
          同意匿名回传（不含任何个人身份信息，仅模块编号与选项）
        </label>
        <button
          onClick={handleUpload}
          disabled={!consent || getAhaRecords().length === 0 || uploadState === "sending"}
          className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-40 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          {uploadState === "sending" ? "回传中…" : "匿名回传"}
        </button>
        {uploadState === "done" && <span className="text-xs text-emerald-600">已回传，感谢参与。</span>}
        {uploadState === "error" && <span className="text-xs text-red-600">回传失败，请稍后再试。</span>}
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          还没有顿悟记录。完成任一模块的"思政双轨"学习后，点击选项即可记录。
        </div>
      ) : (
        <>
          <p className="mb-3 text-[11px] text-zinc-400">
            {fallback
              ? "研究库暂不可达，当前显示本机记录"
              : "含服务器研究库匿名记录与本机记录"}
          </p>
          <ol className="relative space-y-6 border-l border-zinc-200 pl-6 dark:border-zinc-800">
          {[...records].reverse().map((record) => {
            const mod = getModuleById(record.module_id);
            return (
              <li key={record.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="text-xs text-zinc-500">
                  {record.timestamp.slice(0, 10)} ·{" "}
                  <Link
                    href={`/${locale}/cases/${record.module_id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {record.module_id}
                  </Link>
                  {mod ? ` · ${mod.title}` : ""}
                </div>
                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{record.content}</p>
                {record.code_location && (
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {record.code_location}
                    {record.trigger === "manual" ? " · 手动唤出" : ""}
                  </p>
                )}
              </li>
            );
          })}
          </ol>
        </>
      )}
    </div>
  );
}
