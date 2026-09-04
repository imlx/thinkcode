"use client";

import { lazy, Suspense } from "react";
import { useTranslations } from "@/lib/i18n";
import type { CaseFlowDiagramProps } from "./shared/case-flow";

const visualizations: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<CaseFlowDiagramProps>>
> = {
  s1: lazy(() => import("./s1-credit-loop")),
  s2: lazy(() => import("./s2-permission-desk")),
  s3: lazy(() => import("./s3-strategy-board")),
  s4: lazy(() => import("./s4-bond-compact")),
  s5: lazy(() => import("./s5-loan-review-team")),
  s6: lazy(() => import("./s6-skill-loader")),
  s7: lazy(() => import("./s7-audit-loop")),
  s8: lazy(() => import("./s8-guardrail-isolation")),
};

export function SessionVisualization({
  version,
  onAhaTrigger,
}: {
  version: string;
  onAhaTrigger?: (context: string) => void;
}) {
  const t = useTranslations("viz");
  const Component = visualizations[version];
  if (!Component) return null;
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      }
    >
      <div className="min-h-[500px]">
        <Component title={t(version)} onAhaTrigger={onAhaTrigger} />
      </div>
    </Suspense>
  );
}
