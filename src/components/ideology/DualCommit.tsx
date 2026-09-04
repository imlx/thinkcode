"use client";

import { useState } from "react";
import type { IdeologyModule } from "@/lib/trigger-engine";

interface DualCommitProps {
  module: IdeologyModule | null;
}

function CommitBlock({ label, text, accent }: { label: string; text: string; accent: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</h4>
        <button
          onClick={handleCopy}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre
        className={`overflow-x-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-xs leading-5 ${
          accent
            ? "bg-amber-50 dark:bg-amber-950"
            : "bg-zinc-100 dark:bg-zinc-800"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}

export function DualCommit({ module }: DualCommitProps) {
  if (!module) return null;

  const techLine = `feat(${module.id})：${module.title}`;
  const anchor = module.mapping[0];
  const reflectionLine = anchor
    ? `反思：${anchor.ideology}——在亲手实现"${anchor.tech}"的过程中获得共鸣。`
    : "反思：在实践中体会制度意识与工程纪律的统一。";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-base font-semibold">双轨 Commit 系统</h3>
      <p className="mb-4 text-xs text-zinc-500">
        每个模块的实践都对应两条提交：一条记录技术实现，一条记录思想沉淀——把"做过"变成"想过"。
      </p>
      <div className="space-y-3">
        <CommitBlock label="技术提交" text={techLine} accent={false} />
        <CommitBlock label="思政反思提交" text={reflectionLine} accent={true} />
      </div>
    </div>
  );
}
