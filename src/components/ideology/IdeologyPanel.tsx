"use client";

import { useEffect, useMemo, useState } from "react";
import { getModuleById, triggerIdeology } from "@/lib/trigger-engine";
import { logBehavior } from "@/lib/ideology-store";
import { useTranslations } from "@/lib/i18n";
import { AhaRecorder } from "./AhaRecorder";
import { DualCommit } from "./DualCommit";

type ScenarioKey = "bank" | "securities" | "insurance";

interface IdeologyPanelProps {
  versionId: string;
  currentCode: string;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedCode({
  code,
  keywords,
}: {
  code: string;
  keywords: string[];
}) {
  const pattern = useMemo(() => {
    const escaped = keywords
      .filter((kw) => kw.trim().length >= 2)
      .map(escapeRegExp)
      .sort((a, b) => b.length - a.length);
    return escaped.length ? new RegExp(`(${escaped.join("|")})`, "gi") : null;
  }, [keywords]);

  if (!pattern) {
    return <pre className="overflow-x-auto p-4 font-mono text-xs leading-5">{code}</pre>;
  }

  const parts = code.split(pattern);
  return (
    <pre className="overflow-x-auto p-4 font-mono text-xs leading-5">
      {parts.map((part, index) =>
        // split() with a single capture group places matches at odd indexes
        index % 2 === 1 ? (
          <mark
            key={index}
            className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-700"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </pre>
  );
}

export function IdeologyPanel({ versionId, currentCode }: IdeologyPanelProps) {
  const t = useTranslations("ideology");
  const moduleId = versionId.startsWith("s") ? versionId.slice(0, 3) : versionId;
  const mod = getModuleById(moduleId);
  const trigger = useMemo(
    () => triggerIdeology(currentCode, moduleId),
    [currentCode, moduleId]
  );

  const [scenario, setScenario] = useState<ScenarioKey>("bank");

  useEffect(() => {
    if (mod) logBehavior({ action: "ideology_tab_opened", module_id: mod.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  if (!mod) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        {t("no_mapping")}
      </div>
    );
  }

  const scenarioText =
    scenario === "bank"
      ? mod.scenario.bank
      : scenario === "securities"
        ? mod.scenario.securities
        : mod.scenario.insurance;

  const scenarioTabs: { key: ScenarioKey; label: string }[] = [
    { key: "bank", label: t("bank") },
    { key: "securities", label: t("securities") },
    { key: "insurance", label: t("insurance") },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* 技术轨道 60% */}
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            {t("tech_track")} · {mod.id}
          </div>
          <HighlightedCode code={currentCode} keywords={trigger?.matchedKeywords ?? []} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">{t("highlight_hint")}</p>
      </div>

      {/* 思政轨道 40% */}
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-1 text-base font-semibold">{mod.title}</h3>
          <p className="mb-4 text-xs text-zinc-500">{t("mapping")}</p>
          <ul className="space-y-3 text-sm">
            {mod.mapping.map((entry, index) => {
              const hit =
                trigger?.matchedKeywords.some(
                  (kw) => kw.toLowerCase() === entry.tech.toLowerCase()
                ) ?? false;
              return (
                <li
                  key={index}
                  className={
                    hit
                      ? "rounded-lg bg-amber-50 p-2 dark:bg-amber-950"
                      : "p-2"
                  }
                >
                  <div className="font-mono text-xs text-zinc-500">{entry.tech}</div>
                  <div className="mt-0.5">{entry.ideology}</div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold">{t("scenario")}</h3>
          <div className="mb-3 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {scenarioTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setScenario(tab.key)}
                className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  scenario === tab.key
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {scenarioText}
          </p>
        </div>

        <AhaRecorder key={mod.id} module={mod} />

        <DualCommit module={mod} />
      </div>
    </div>
  );
}
