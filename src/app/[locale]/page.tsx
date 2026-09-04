"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import { HarnessBridge } from "@/components/ideology/HarnessBridge";

const FEATURES = [
  {
    href: "/harness",
    title: "思想 Harness 架构图",
    desc: "八大实践模块的学习状态总览，四色进度一目了然。",
  },
  {
    href: "/growth",
    title: "思想成长时间线",
    desc: "记录每个模块的顿悟时刻，双维度曲线呈现成长轨迹。",
  },
  {
    href: "/participate",
    title: "匿名参与研究",
    desc: "知情同意门控的匿名回传，不含任何个人身份信息。",
  },
];

export default function HomePage() {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-20 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center px-2 pt-8 text-center sm:pt-20">
        <span className="mb-4 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          金融从业者 · AI 工程实践 · 思想政治教育
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          思政编码坊
          <span className="ml-3 text-zinc-400 dark:text-zinc-500">ThinkCode</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--color-text-secondary)] sm:text-xl">
          以 AI 大模型工程化实践为载体，加强金融从业者思想政治工作的范式创新平台——
          每个 Harness 机制，都对应一条思想政治工作的方法论。
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href={`/${locale}/cases`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            开始实践
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/growth`}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            思想成长
          </Link>
        </div>
      </section>

      {/* 思想Harness五模块映射架构图（论文图3） */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">思想 Harness：五模块映射</h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            左列为技术模块，右列为思想 Harness 模块；点击任一节点展开实践入口，进度以颜色填充（未开始、进行中、已完成、已顿悟）。
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <HarnessBridge />
        </div>
      </section>

      {/* 实践模块 */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">实践模块</h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            八个渐进式实践，从信贷尽调闭环到三层隔离护栏——数据全部来自脱敏监管案例。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {IDEOLOGY_MODULES.map((mod) => (
            <Link key={mod.id} href={`/${locale}/cases/${mod.id}`} className="group block">
              <div className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition-all hover:border-amber-400 hover:shadow-sm">
                <div className="font-mono text-xs text-zinc-400">{mod.id}</div>
                <h3 className="mt-1 text-sm font-semibold group-hover:underline">
                  {mod.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {mod.mapping[0]?.tech} → {mod.mapping[0]?.ideology}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 平台功能入口 */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">成长与参与</h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            学习数据只存在你的浏览器里，导出与回传完全由你决定。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link key={feature.href} href={`/${locale}${feature.href}`} className="group block">
              <div className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition-all hover:border-blue-400 hover:shadow-sm">
                <h3 className="text-sm font-semibold group-hover:underline">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {feature.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
