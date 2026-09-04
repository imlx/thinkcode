"use client";

import { CaseFlowDiagram } from "./shared/case-flow";
import type { CaseFlowDiagramProps } from "./shared/case-flow";
import { CASE_FLOWS } from "@/lib/case-flows";

export default function S24AuditLoop({ title, onAhaTrigger }: CaseFlowDiagramProps) {
  return (
    <CaseFlowDiagram
      config={CASE_FLOWS.s7}
      title={title}
      moduleId="s7"
      onAhaTrigger={onAhaTrigger}
    />
  );
}
