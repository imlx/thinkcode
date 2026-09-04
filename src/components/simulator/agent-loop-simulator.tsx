"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useSimulator } from "@/hooks/useSimulator";
import { SimulatorControls } from "./simulator-controls";
import { SimulatorMessage } from "./simulator-message";
import { getModuleById } from "@/lib/trigger-engine";
import type { Scenario } from "@/types/agent-data";

const scenarioModules: Record<string, () => Promise<{ default: Scenario }>> = {
  s1: () => import("@/data/scenarios/s1.json") as Promise<{ default: Scenario }>,
  s2: () => import("@/data/scenarios/s2.json") as Promise<{ default: Scenario }>,
  s3: () => import("@/data/scenarios/s3.json") as Promise<{ default: Scenario }>,
  s4: () => import("@/data/scenarios/s4.json") as Promise<{ default: Scenario }>,
  s5: () => import("@/data/scenarios/s5.json") as Promise<{ default: Scenario }>,
  s6: () => import("@/data/scenarios/s6.json") as Promise<{ default: Scenario }>,
  s7: () => import("@/data/scenarios/s7.json") as Promise<{ default: Scenario }>,
  s8: () => import("@/data/scenarios/s8.json") as Promise<{ default: Scenario }>,
};

interface AgentLoopSimulatorProps {
  version: string;
  onAhaTrigger?: (context: string) => void;
}

// 思政触发器：步骤注记命中本模块映射关键词时视为映射点
function stepHit(annotation: string, keywords: string[]): boolean {
  if (!annotation) return false;
  return keywords.some((kw) => kw.length >= 4 && annotation.includes(kw));
}

export function AgentLoopSimulator({ version, onAhaTrigger }: AgentLoopSimulatorProps) {
  const t = useTranslations("version");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = scenarioModules[version];
    setScenario(null);

    if (!loader) {
      return () => {
        cancelled = true;
      };
    }

    loader()
      .then((mod) => {
        if (!cancelled) setScenario(mod.default);
      })
      .catch(() => {
        if (!cancelled) setScenario(null);
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  const sim = useSimulator(scenario?.steps ?? []);

  const ideologyKeywords = useMemo(() => {
    const mod = getModuleById(version);
    return mod ? mod.mapping.map((entry) => entry.ideology) : [];
  }, [version]);

  const currentStep =
    sim.currentIndex >= 0 && scenario ? scenario.steps[sim.currentIndex] : null;
  const currentHit = currentStep
    ? stepHit(currentStep.annotation, ideologyKeywords)
    : false;

  // 推演跑完（最后一步可见）时弹出顿悟邀约（每会话一次）；
  // 中途命中映射点的步骤仍以琥珀色高亮「记录顿悟」按钮，可手动唤出
  const isComplete = scenario ? sim.currentIndex >= scenario.steps.length - 1 : false;
  const finalStep = isComplete && scenario ? scenario.steps[scenario.steps.length - 1] : null;
  useEffect(() => {
    if (!onAhaTrigger || !isComplete || !finalStep) return;
    const flag = `thinkcode.aha-invited-sim.${version}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    onAhaTrigger(`数据推演 · ${finalStep.annotation || "推演完成"}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [sim.visibleSteps.length]);

  if (!scenario) {
    return (
      <section>
        <h2 className="mb-2 text-xl font-semibold">{t("simulator")}</h2>
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-sm text-[var(--color-text-secondary)]">
          Simulator scenario is not available for this lesson yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">{t("simulator")}</h2>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        {scenario.description}
      </p>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <div className="border-b border-[var(--color-border)] bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
          <SimulatorControls
            isPlaying={sim.isPlaying}
            isComplete={sim.isComplete}
            currentIndex={sim.currentIndex}
            totalSteps={sim.totalSteps}
            speed={sim.speed}
            onPlay={sim.play}
            onPause={sim.pause}
            onStep={sim.stepForward}
            onReset={sim.reset}
            onSpeedChange={sim.setSpeed}
          />
        </div>

        <div
          ref={scrollRef}
          className="relative flex max-h-[500px] min-h-[200px] flex-col gap-3 overflow-y-auto p-4"
        >
          {onAhaTrigger && (
            <button
              onClick={() => {
                const anchor = currentStep ?? scenario.steps[scenario.steps.length - 1];
                if (anchor?.annotation) {
                  onAhaTrigger(`数据推演 · ${anchor.annotation}`);
                } else {
                  onAhaTrigger("数据推演");
                }
              }}
              disabled={sim.visibleSteps.length === 0}
              className={`absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-colors ${
                currentHit
                  ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              } disabled:opacity-40`}
            >
              <Lightbulb size={12} />
              记录顿悟
            </button>
          )}
          {sim.visibleSteps.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-secondary)]">
              Press Play or Step to begin
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {sim.visibleSteps.map((step, i) => (
              <SimulatorMessage key={i} step={step} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
