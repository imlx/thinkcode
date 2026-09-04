"use client";

import { CaseFlowDiagram } from "./shared/case-flow";
import type { CaseFlowDiagramProps } from "./shared/case-flow";
import { CASE_FLOWS } from "@/lib/case-flows";

export default function S23SkillLoader({ title, onAhaTrigger }: CaseFlowDiagramProps) {
  return (
    <CaseFlowDiagram
      config={CASE_FLOWS.s6}
      title={title}
      moduleId="s6"
      onAhaTrigger={onAhaTrigger}
    />
  );
}
