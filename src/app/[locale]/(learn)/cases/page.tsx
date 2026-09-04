"use client";

import { useState } from "react";
import Link from "next/link";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";

export default function CasesPage() {
  const [filter, setFilter] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">实践案例</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          八个案例覆盖信贷、投行、合规等真实金融业务场景，全部数据经脱敏处理，以代号引用。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["全部", "调研闭环", "权限制度", "信息治理", "组织协作", "底线护栏"].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag === "全部" ? null : tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (tag === "全部" && !filter) || filter === tag
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {IDEOLOGY_MODULES.map((mod, index) => {
          const tags = [
            ["调研闭环"],
            ["权限制度"],
            ["调研闭环"],
            ["信息治理"],
            ["组织协作"],
            ["组织协作"],
            ["组织协作"],
            ["底线护栏"],
          ][index];
          if (filter && !tags.includes(filter)) return null;
          return (
            <Link key={mod.id} href={`/zh/cases/${mod.id}`} className="group block">
              <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition-all hover:border-amber-400 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-400">案例 {mod.id.slice(1)}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
                    {tags[0]}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-6 group-hover:underline">
                  {mod.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {mod.scenario.bank}
                </p>
                <div className="mt-3 border-t border-zinc-100 pt-2 text-[10px] text-zinc-400 dark:border-zinc-800">
                  数据经脱敏处理 · 公开渠道可溯源
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
