"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 论文第四章「平台架构：三层双栈架构」：展示层—内容层—执行层
interface ArchMember {
  title: string;
  desc: string;
  href?: string;
}

interface ArchLayer {
  id: string;
  name: string;
  stack: string;
  desc: string;
  members: ArchMember[];
}

const ARCH_LAYERS: ArchLayer[] = [
  {
    id: "presentation",
    name: "展示层",
    stack: "Next.js + React + Tailwind CSS",
    desc: "面向实践者的全部交互界面：统一的视觉体系与交互设计，思政组件与案例学习视图风格一致。",
    members: [
      {
        title: "案例学习视图",
        desc: "案例场景、数据推演、实践代码、思政映射四视图，代码高亮与交互原样保留。",
        href: "/cases",
      },
      {
        title: "思政映射面板",
        desc: "右侧概念卡片随代码关键词实时点亮，形成「编码动作—价值概念」即时反馈回路。",
      },
      {
        title: "可视化组件",
        desc: "思想Harness架构图、双维度实践轨迹（ECharts）、数据流推演图。",
        href: "/harness",
      },
    ],
  },
  {
    id: "content",
    name: "内容层",
    stack: "构建期抽取管线 + YAML 规则库 + 浏览器本地存储",
    desc: "与技术展示物理分离、逻辑联动的内容底座：案例数据与思政映射规则库相互独立，又通过模块编号一一关联。",
    members: [
      {
        title: "案例数据",
        desc: "案例与场景数据来自亲身项目实践与互联网公开可查数据源，经脱敏整理后由映射规则库在构建期生成结构化数据。",
      },
      {
        title: "思政映射规则库",
        desc: "八个模块的 YAML 映射文件：mapping（技术→思政）、scenario（银行/证券/保险）、aha_prompt 与 aha_options。",
      },
      {
        title: "实践者数据",
        desc: "顿悟记录与行为日志默认存于浏览器本地；经明示同意后匿名回传研究库，随时可关闭。",
        href: "/participate",
      },
    ],
  },
  {
    id: "execution",
    name: "执行层",
    stack: "模拟器 + 触发器规则引擎 + 无感日志 + 匿名回传通道",
    desc: "平台的关键创新所在：思政触发器在代码运行至特定路径时高亮关联思政概念并发出顿悟邀约，实现「技术动作触发价值联想」的嵌入式引导。",
    members: [
      {
        title: "代码模拟器",
        desc: "Agent 循环数据推演与数据流图分步演示，复现金融业务的观察—思考—行动闭环。",
      },
      {
        title: "思政触发器",
        desc: "规则引擎匹配代码路径与映射关键词：命中即高亮概念卡片，并在映射点自动弹出顿悟邀约。",
      },
      {
        title: "行为日志采集",
        desc: "无感记录模块浏览、推演与选项点击事件，用于双维度实践轨迹统计。",
      },
      {
        title: "匿名回传通道",
        desc: "仅传输模块编号与选项编号，不接收、不记录任何 IP 或身份信息。",
      },
    ],
  },
];

const LAYER_STYLES: Record<string, { dot: string; border: string; badge: string }> = {
  presentation: {
    dot: "bg-blue-500",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  content: {
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  execution: {
    dot: "bg-red-500",
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default function LayersPage() {
  const t = useTranslations("layers");
  const locale = useLocale();

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        {ARCH_LAYERS.map((layer, index) => {
          const style = LAYER_STYLES[layer.id];
          return (
            <div
              key={layer.id}
              className={cn(
                "overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800",
                "border-l-4",
                style.border
              )}
            >
              {/* Layer header */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className={cn("h-3 w-3 rounded-full", style.dot)} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">
                    <span className="text-zinc-400 dark:text-zinc-600">L{index + 1}</span>{" "}
                    {layer.name}
                    <span
                      className={cn(
                        "ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 align-middle text-xs font-medium",
                        style.badge
                      )}
                    >
                      {layer.stack}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {layer.desc}
                  </p>
                </div>
              </div>

              {/* Members */}
              <div className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {layer.members.map((member) => {
                    const inner = (
                      <>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {member.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {member.desc}
                        </p>
                      </>
                    );
                    return member.href ? (
                      <Link
                        key={member.title}
                        href={`/${locale}${member.href}`}
                        className="group"
                      >
                        <Card className="h-full transition-shadow hover:shadow-md">
                          {inner}
                        </Card>
                      </Link>
                    ) : (
                      <Card key={member.title} className="h-full">
                        {inner}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Flow indicator */}
              {index < ARCH_LAYERS.length - 1 && (
                <div className="flex items-center justify-center py-1 text-zinc-300 dark:text-zinc-700">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-current">
                    <path d="M10 0 L10 12 M5 7 L10 12 L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
