"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import { getAhaEndpoint } from "@/lib/ideology-store";

interface AhaStats {
  total: number;
  by_module: Record<string, number>;
  no_resonance: number;
}

type StatsStatus = "loading" | "ok" | "empty" | "error";

export default function ParticipatePage() {
  const locale = useLocale();
  const [stats, setStats] = useState<AhaStats | null>(null);
  const [status, setStatus] = useState<StatsStatus>("loading");

  // 群体共鸣分布只取自真实匿名回传研究库（receiver），不含本机记录与基线样本
  useEffect(() => {
    const endpoint = getAhaEndpoint();
    fetch(`${endpoint}/stats`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("stats unavailable"))))
      .then((data: AhaStats) => {
        setStats(data);
        setStatus(data.total > 0 ? "ok" : "empty");
      })
      .catch(() => setStatus("error"));
  }, []);

  const maxModuleCount = stats ? Math.max(1, ...Object.values(stats.by_module)) : 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">匿名参与研究</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          你的顿悟选择可以帮助改进金融从业者的思想政治教育设计——是否参与完全由你决定。
        </p>
      </div>

      <div className="space-y-6 text-sm leading-7">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-base font-semibold">我们如何收集数据</h2>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
            <li>仅收集模块编号（如 s1）与选项编号（如 option_0）及时间戳。</li>
            <li>不收集 IP 地址、设备指纹、Cookie 标识或任何个人身份信息。</li>
            <li>平台无任何第三方遥测、广告或行为追踪脚本。</li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-base font-semibold">你的控制权</h2>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
            <li>所有记录默认只保存在你自己的浏览器（localStorage）中。</li>
            <li>
              首次访问时的「数据使用说明」点「知道了」即视为同意匿名回传；可随时在
              <Link href={`/${locale}/growth`} className="mx-1 text-blue-600 hover:underline dark:text-blue-400">思想成长时间线</Link>
              页面取消勾选、停止回传。
            </li>
            <li>你可以随时清空浏览器本地数据，导出 Markdown 备份不受任何限制。</li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-base font-semibold">群体共鸣分布（匿名聚合）</h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            数据全部来自自愿匿名回传的研究库，仅呈现群体分布，不含任何个体记录与本机数据。
          </p>
          {status === "loading" && (
            <p className="text-xs text-zinc-400">正在加载聚合统计…</p>
          )}
          {status === "error" && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              聚合统计暂不可用——回传服务未连接或当前网络无法访问。
            </p>
          )}
          {status === "empty" && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              研究库暂无回传记录。完成模块实践并在「思想成长」页匿名回传后，这里会呈现真实的群体共鸣分布。
            </p>
          )}
          {status === "ok" && stats && (
            <>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                全部 {stats.total} 条匿名回传顿悟记录。
              </p>
              <div className="space-y-2">
                {IDEOLOGY_MODULES.map((mod) => {
                  const count = stats.by_module[mod.id] ?? 0;
                  const width = Math.max(2, Math.round((count / maxModuleCount) * 100));
                  return (
                    <div key={mod.id} className="flex items-center gap-3">
                      <span className="w-9 shrink-0 text-right font-mono text-xs text-zinc-500">
                        {mod.id}
                      </span>
                      <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="flex h-full items-center rounded bg-amber-400 px-1.5"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-[10px] font-medium text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                「没有共鸣」负向记录共 {stats.no_resonance} 条，占比{" "}
                {Math.round((stats.no_resonance / stats.total) * 100)}%——不认同同样被诚实记录。
              </p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
          <h2 className="mb-2 text-base font-semibold">伦理承诺</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            本研究遵循知情同意与最小化收集原则：数据仅用于思想政治教育范式的学术研究，
            以聚合统计形式呈现，不会用于任何商业目的或个体画像。
          </p>
        </section>
      </div>
    </div>
  );
}
