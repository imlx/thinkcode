"use client";

import { CaseFlowDiagram } from "./shared/case-flow";
import type { CaseFlowDiagramProps } from "./shared/case-flow";
import { CASE_FLOWS } from "@/lib/case-flows";

export default function S22LoanReviewTeam({ title, onAhaTrigger }: CaseFlowDiagramProps) {
  return (
    <CaseFlowDiagram
      config={CASE_FLOWS.s5}
      title={title}
      moduleId="s5"
      onAhaTrigger={onAhaTrigger}
    />
  );
}
