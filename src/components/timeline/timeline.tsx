"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "@/lib/i18n";
import { CASE_GROUPS } from "@/lib/constants";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import type { IdeologyModule } from "@/lib/trigger-engine";
import { LayerBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GROUP_DOT_BG: Record<string, string> = {
  thinking: "bg-blue-500",
  organization: "bg-emerald-500",
  discipline: "bg-red-500",
};

const GROUP_LINE_BG: Record<string, string> = {
  thinking: "bg-blue-500/30",
  organization: "bg-emerald-500/30",
  discipline: "bg-red-500/30",
};

type GroupId = "thinking" | "organization" | "discipline";

function moduleGroup(id: string): GroupId {
  for (const group of CASE_GROUPS) {
    if ((group.versions as readonly string[]).includes(id)) return group.id as GroupId;
  }
  return "thinking";
}

function locOf(mod: IdeologyModule): number {
  return mod.code ? mod.code.split("\n").length : 0;
}

const MAX_LOC = Math.max(...IDEOLOGY_MODULES.map(locOf));

export function Timeline() {
  const t = useTranslations("timeline");
  const tLayer = useTranslations("layer_labels");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-12">
      {/* Group Legend */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {t("layer_legend")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {CASE_GROUPS.map((group) => (
            <div key={group.id} className="flex items-center gap-1.5">
              <span className={cn("h-3 w-3 rounded-full", GROUP_DOT_BG[group.id])} />
              <span className="text-xs font-medium">{tLayer(group.id)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {IDEOLOGY_MODULES.map((mod, index) => {
          const groupId = moduleGroup(mod.id);
          const isLast = index === IDEOLOGY_MODULES.length - 1;
          const loc = locOf(mod);
          const locPercent = Math.round((loc / MAX_LOC) * 100);
          const [tech, ideology] = mod.title.split("：");

          return (
            <div key={mod.id} className="relative flex gap-4 pb-8 sm:gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-[var(--color-bg)] sm:h-10 sm:w-10",
                    GROUP_DOT_BG[groupId]
                  )}
                >
                  <span className="text-[10px] font-bold text-white sm:text-xs">
                    {mod.id.replace("s", "")}
                  </span>
                </div>
                {!isLast && (
                  <div className={cn("w-0.5 flex-1", GROUP_LINE_BG[groupId])} />
                )}
              </div>

              <div className="flex-1 pb-2">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition-colors hover:border-[var(--color-text-secondary)]/30 sm:p-5"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <LayerBadge layer={groupId}>{mod.id}</LayerBadge>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {tLayer(groupId)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold sm:text-lg">
                    {tech}
                    <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                      {ideology}
                    </span>
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                    <span className="tabular-nums">{loc} 行代码</span>
                    <span className="tabular-nums">{mod.mapping.length} 条思政映射</span>
                    <span className="tabular-nums">{mod.ahaOptions.length} 个顿悟选项</span>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={cn("h-full rounded-full transition-all", GROUP_DOT_BG[groupId])}
                      style={{ width: `${locPercent}%` }}
                    />
                  </div>

                  <Link
                    href={`/${locale}/cases/${mod.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {t("learn_more")}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LOC Comparison Chart */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{t("loc_growth")}</h3>
        <div className="flex flex-col gap-2">
          {IDEOLOGY_MODULES.map((mod, index) => {
            const groupId = moduleGroup(mod.id);
            const loc = locOf(mod);
            const widthPercent = Math.max(2, Math.round((loc / MAX_LOC) * 100));

            return (
              <div key={mod.id} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">
                  {mod.id}
                </span>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${widthPercent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.05 * index }}
                      className={cn(
                        "flex h-full items-center rounded px-2",
                        GROUP_DOT_BG[groupId]
                      )}
                    >
                      <span className="text-[10px] font-medium text-white">{loc}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
