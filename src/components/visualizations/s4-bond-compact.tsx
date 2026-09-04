"use client";

import { CaseFlowDiagram } from "./shared/case-flow";
import type { CaseFlowDiagramProps } from "./shared/case-flow";
import { CASE_FLOWS } from "@/lib/case-flows";

export default function S21BondCompact({ title, onAhaTrigger }: CaseFlowDiagramProps) {
  return (
    <CaseFlowDiagram
      config={CASE_FLOWS.s4}
      title={title}
      moduleId="s4"
      onAhaTrigger={onAhaTrigger}
    />
  );
}
