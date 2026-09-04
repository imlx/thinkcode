"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeDiff } from "@/components/diff/code-diff";
import { ArrowRight, FileCode, Map, Wrench } from "lucide-react";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import type { IdeologyModule } from "@/lib/trigger-engine";

function locOf(mod: IdeologyModule): number {
  return mod.code ? mod.code.split("\n").length : 0;
}

function techKeywords(mod: IdeologyModule): string[] {
  return mod.mapping.map((entry) => entry.tech);
}

export default function ComparePage() {
  const t = useTranslations("compare");
  const [moduleA, setModuleA] = useState<string>("");
  const [moduleB, setModuleB] = useState<string>("");

  const modA = useMemo(
    () => IDEOLOGY_MODULES.find((m) => m.id === moduleA) ?? null,
    [moduleA]
  );
  const modB = useMemo(
    () => IDEOLOGY_MODULES.find((m) => m.id === moduleB) ?? null,
    [moduleB]
  );

  const comparison = useMemo(() => {
    if (!modA || !modB) return null;
    const techA = techKeywords(modA);
    const techB = techKeywords(modB);
    const setA = new Set(techA);
    const setB = new Set(techB);
    const onlyA = techA.filter((k) => !setB.has(k));
    const onlyB = techB.filter((k) => !setA.has(k));
    const shared = techA.filter((k) => setB.has(k));

    const ideologyA = new Set(modA.mapping.map((e) => e.ideology));
    const ideologyOnlyB = modB.mapping.filter((e) => !ideologyA.has(e.ideology));

    return {
      locDelta: locOf(modB) - locOf(modA),
      mappingDelta: modB.mapping.length - modA.mapping.length,
      techOnlyA: onlyA,
      techOnlyB: onlyB,
      techShared: shared,
      newIdeologyInB: ideologyOnlyB.map((e) => e.ideology),
    };
  }, [modA, modB]);

  const moduleLabel = (mod: IdeologyModule) => mod.title.split("：")[0];

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {/* Selectors */}
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {t("select_a")}
          </label>
          <select
            value={moduleA}
            onChange={(e) => setModuleA(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">-- select --</option>
            {IDEOLOGY_MODULES.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.id} - {moduleLabel(mod)}
              </option>
            ))}
          </select>
        </div>

        <ArrowRight size={20} className="mt-5 hidden text-zinc-400 sm:block" />

        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {t("select_b")}
          </label>
          <select
            value={moduleB}
            onChange={(e) => setModuleB(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">-- select --</option>
            {IDEOLOGY_MODULES.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.id} - {moduleLabel(mod)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {modA && modB && comparison && (
        <div className="space-y-8">
          {/* Side-by-side module info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{modA.title}</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>{locOf(modA)} 行代码</p>
                <p>{modA.mapping.length} 条思政映射</p>
                <p>{modA.ahaOptions.length} 个顿悟选项</p>
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{modB.title}</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>{locOf(modB)} 行代码</p>
                <p>{modB.mapping.length} 条思政映射</p>
                <p>{modB.ahaOptions.length} 个顿悟选项</p>
              </div>
            </Card>
          </div>

          {/* Structural diff */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <FileCode size={16} />
                  <span className="text-sm">{t("loc_delta")}</span>
                </div>
              </CardHeader>
              <CardTitle>
                <span className={comparison.locDelta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {comparison.locDelta >= 0 ? "+" : ""}{comparison.locDelta}
                </span>
                <span className="ml-2 text-sm font-normal text-zinc-500">{t("lines")}</span>
              </CardTitle>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Map size={16} />
                  <span className="text-sm">{t("new_mappings_in_b")}</span>
                </div>
              </CardHeader>
              <CardTitle>
                <span className={comparison.mappingDelta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {comparison.mappingDelta >= 0 ? "+" : ""}{comparison.mappingDelta}
                </span>
                <span className="ml-2 text-sm font-normal text-zinc-500">条思政映射</span>
              </CardTitle>
              {comparison.newIdeologyInB.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comparison.newIdeologyInB.map((ideology) => (
                    <span key={ideology} className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {ideology}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Wrench size={16} />
                  <span className="text-sm">{t("new_keywords_in_b")}</span>
                </div>
              </CardHeader>
              <CardTitle>
                <span className="text-blue-600 dark:text-blue-400">{comparison.techOnlyB.length}</span>
              </CardTitle>
              {comparison.techOnlyB.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comparison.techOnlyB.map((kw) => (
                    <span key={kw} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Tech keyword comparison */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tool_comparison")}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("only_in")} {moduleLabel(modA)}
                </h4>
                {comparison.techOnlyA.length === 0 ? (
                  <p className="text-xs text-zinc-400">{t("none")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {comparison.techOnlyA.map((kw) => (
                      <span key={kw} className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("shared")}
                </h4>
                {comparison.techShared.length === 0 ? (
                  <p className="text-xs text-zinc-400">{t("none")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {comparison.techShared.map((kw) => (
                      <span key={kw} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("only_in")} {moduleLabel(modB)}
                </h4>
                {comparison.techOnlyB.length === 0 ? (
                  <p className="text-xs text-zinc-400">{t("none")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {comparison.techOnlyB.map((kw) => (
                      <span key={kw} className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Code Diff */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">{t("source_diff")}</h2>
            <CodeDiff
              oldSource={modA.code}
              newSource={modB.code}
              oldLabel={`${modA.id} (${modA.codePath})`}
              newLabel={`${modB.id} (${modB.codePath})`}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!modA || !modB) && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-400">{t("empty_hint")}</p>
        </div>
      )}
    </div>
  );
}
