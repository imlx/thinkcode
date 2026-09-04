"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { IDEOLOGY_MODULES, getModuleById } from "@/lib/trigger-engine";
import { SessionVisualization } from "@/components/visualizations";
import { AgentLoopSimulator } from "@/components/simulator/agent-loop-simulator";
import { SourceViewer } from "@/components/code/source-viewer";
import { Tabs } from "@/components/ui/tabs";
import { AhaRecorder } from "@/components/ideology/AhaRecorder";
import { AhaInvitation } from "@/components/ideology/AhaInvitation";
import { DualCommit } from "@/components/ideology/DualCommit";
import { logBehavior } from "@/lib/ideology-store";

type ScenarioKey = "bank" | "securities" | "insurance";

const SCENARIO_TABS: { key: ScenarioKey; label: string }[] = [
  { key: "bank", label: "银行" },
  { key: "securities", label: "证券" },
  { key: "insurance", label: "保险" },
];

export function CaseDetail({ id }: { id: string }) {
  const mod = getModuleById(id);
  const [scenario, setScenario] = useState<ScenarioKey>("bank");
  const [invitation, setInvitation] = useState<{ open: boolean; context?: string }>(
    { open: false }
  );

  if (!mod) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
        案例不存在。<Link href="/zh/cases" className="text-blue-600 hover:underline dark:text-blue-400">返回案例列表</Link>
      </div>
    );
  }

  const scenarioText =
    scenario === "bank"
      ? mod.scenario.bank
      : scenario === "securities"
        ? mod.scenario.securities
        : mod.scenario.insurance;

  const caseIndex = IDEOLOGY_MODULES.findIndex((m) => m.id === mod.id);
  const prevMod = caseIndex > 0 ? IDEOLOGY_MODULES[caseIndex - 1] : null;
  const nextMod =
    caseIndex >= 0 && caseIndex < IDEOLOGY_MODULES.length - 1
      ? IDEOLOGY_MODULES[caseIndex + 1]
      : null;

  const tabs = [
    { id: "ideology", label: "思政映射" },
    { id: "simulate", label: "数据推演" },
    { id: "code", label: "实践代码" },
    { id: "scenario", label: "案例场景" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/zh/cases" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          ← 返回案例列表
        </Link>
        <div className="mt-2 mb-2 flex items-center gap-3">
          <span className="rounded-lg bg-zinc-100 px-3 py-1 font-mono text-sm font-bold dark:bg-zinc-800">
            {mod.id}
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            数据经脱敏处理 · 公开渠道可溯源
          </span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{mod.title}</h1>
      </div>

      {/* Hero: stepped data-flow visualization with ideology highlight */}
      <SessionVisualization
        version={mod.id}
        onAhaTrigger={(context) => setInvitation({ open: true, context })}
      />

      <Tabs
        tabs={tabs}
        defaultTab="ideology"
        onTabChange={(tabId) => {
          const action =
            tabId === "simulate"
              ? "simulate_tab_opened"
              : tabId === "code"
                ? "code_tab_opened"
                : tabId === "ideology"
                  ? "ideology_tab_opened"
                  : null;
          if (action) logBehavior({ action, module_id: mod.id });
        }}
      >
        {(activeTab) => (
          <>
            {activeTab === "scenario" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                  {SCENARIO_TABS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setScenario(item.key)}
                      className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        scenario === item.key
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{scenarioText}</p>
              </div>
            )}
            {activeTab === "simulate" && (
              <AgentLoopSimulator
                version={mod.id}
                onAhaTrigger={(context) => setInvitation({ open: true, context })}
              />
            )}
            {activeTab === "code" && (
              <SourceViewer source={mod.code} filename={mod.codePath} />
            )}
            {activeTab === "ideology" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <ul className="space-y-3 text-sm">
                    {mod.mapping.map((entry, index) => (
                      <li key={index} className="flex gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                        <span className="shrink-0 font-mono text-xs text-zinc-500">{entry.tech}</span>
                        <span className="text-zinc-300">→</span>
                        <span>{entry.ideology}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    {mod.ahaPrompt}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <AhaRecorder
                    module={mod}
                    onRecordClick={() => setInvitation({ open: true })}
                  />
                  <DualCommit module={mod} />
                </div>
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* Prev / Next case navigation */}
      <nav className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-700">        {prevMod ? (
          <Link
            href={`/zh/cases/${prevMod.id}`}
            className="group flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
            <div>
              <div className="text-xs text-zinc-400">上一案例</div>
              <div className="font-medium">
                {prevMod.id} - {prevMod.title}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextMod ? (
          <Link
            href={`/zh/cases/${nextMod.id}`}
            className="group flex items-center gap-2 text-right text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            <div>
              <div className="text-xs text-zinc-400">下一案例</div>
              <div className="font-medium">
                {nextMod.title} - {nextMod.id}
              </div>
            </div>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      {/* 右下角手动唤出顿悟邀约（各 tab 通用） */}
      <button
        onClick={() => setInvitation({ open: true })}
        className="fixed right-5 bottom-5 z-40 flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 shadow-lg transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
      >
        <Lightbulb size={15} />
        记录顿悟
      </button>

      <AhaInvitation
        module={mod}
        open={invitation.open}
        context={invitation.context}
        onClose={() => setInvitation({ open: false })}
      />
    </div>
  );
}
