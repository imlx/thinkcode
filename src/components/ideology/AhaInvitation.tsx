"use client";

import { useEffect, useState } from "react";
import type { IdeologyModule } from "@/lib/trigger-engine";
import { getAhaRecords, saveAhaRecord } from "@/lib/ideology-store";

interface AhaInvitationProps {
  module: IdeologyModule | null;
  open: boolean;
  // 触发场景（如「数据流 · 思考：风险研判」），手动唤出时为空
  context?: string;
  onClose: () => void;
}

export function AhaInvitation({ module, open, context, onClose }: AhaInvitationProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    if (!open || !module) return;
    // 回显：当前模块已记录的顿悟选项与自由文本，避免同模块重复记录
    const records = getAhaRecords().filter((r) => r.module_id === module.id);
    const preset = new Set<number>();
    let customText = "";
    for (const record of records) {
      const match = /^option_(\d+)$/.exec(record.choice_id);
      if (match) {
        preset.add(Number(match[1]));
      } else if (record.choice_id === "option_custom") {
        customText = customText ? `${customText}\n${record.content}` : record.content;
      }
    }
    setSelected(preset);
    setCustom(customText);
    setShowCustom(customText.length > 0);
    setSubmitted(false);
  }, [open, module]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !module) return null;

  const handleToggle = (index: number) => {
    const next = new Set(selected);
    const isNoResonance = module.ahaOptions[index].trim() === "没有共鸣";
    if (next.has(index)) {
      next.delete(index);
    } else if (isNoResonance) {
      // 「没有共鸣」为负向项：选中时清空其余选项，与其互斥
      next.clear();
      next.add(index);
    } else {
      for (let i = 0; i < module.ahaOptions.length; i++) {
        if (module.ahaOptions[i].trim() === "没有共鸣") next.delete(i);
      }
      next.add(index);
    }
    setSelected(next);
  };

  const handleSubmit = () => {
    const base = {
      module_id: module.id,
      code_location: context,
      trigger: context ? ("trigger" as const) : ("manual" as const),
    };
    const stamp = () => new Date().toISOString();
    // 已记录过的选项不再重复写入（回显项即已存项）
    const recordedChoiceIds = new Set(
      getAhaRecords()
        .filter((r) => r.module_id === module.id)
        .map((r) => r.choice_id)
    );
    const recordedCustomTexts = new Set(
      getAhaRecords()
        .filter((r) => r.module_id === module.id && r.choice_id === "option_custom")
        .map((r) => r.content)
    );
    let added = 0;
    for (const index of selected) {
      const choiceId = `option_${index}`;
      if (recordedChoiceIds.has(choiceId)) continue;
      added++;
      saveAhaRecord({
        ...base,
        id: `aha_${Date.now()}_${index}`,
        timestamp: stamp(),
        choice_id: choiceId,
        content: module.ahaOptions[index],
      });
    }
    const customText = custom.trim();
    if (showCustom && customText && !recordedCustomTexts.has(customText)) {
      added++;
      saveAhaRecord({
        ...base,
        id: `aha_${Date.now()}_custom`,
        timestamp: stamp(),
        choice_id: "option_custom",
        content: custom.trim(),
      });
    }
    setAddedCount(added);
    setSubmitted(true);
  };

  const canSubmit = selected.size > 0 || (showCustom && custom.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">顿悟时刻</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {module.id} · {module.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {context && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            触发场景：{context}
          </p>
        )}

        {!submitted ? (
          <>
            <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {module.ahaPrompt}
            </p>
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {module.ahaOptions.map((option, index) => {
                const isSelected = selected.has(index);
                return (
                  <button
                    key={index}
                    onClick={() => handleToggle(index)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                        : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-blue-950"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[9px] leading-none ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-300 text-transparent dark:border-zinc-600"
                      }`}
                    >
                      ✓
                    </span>
                    {option}
                  </button>
                );
              })}
              </div>

              {showCustom ? (
                <textarea
                  autoFocus
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  rows={3}
                  placeholder="用一句话写下此刻的想法（可跳过）"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
              ) : (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600"
                >
                  自己写一句（可选）
                </button>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              记录顿悟
            </button>
            <p className="mt-2 text-center text-[10px] text-zinc-400">
              仅保存在本机浏览器；可在「思想成长」页导出或匿名回传。
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {addedCount > 0
                ? `已记录 ${addedCount} 项新的顿悟，感谢你的诚实反馈——包括「没有共鸣」。`
                : "所选顿悟此前均已记录，无需重复提交。"}
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              继续学习
            </button>
          </>
        )}
      </div>
    </div>
  );
}
