"use client";

import { CaseFlowDiagram } from "./shared/case-flow";
import type { CaseFlowDiagramProps } from "./shared/case-flow";
import { CASE_FLOWS } from "@/lib/case-flows";

export default function S19PermissionDesk({ title, onAhaTrigger }: CaseFlowDiagramProps) {
  return (
    <CaseFlowDiagram
      config={CASE_FLOWS.s2}
      title={title}
      moduleId="s2"
      onAhaTrigger={onAhaTrigger}
    />
  );
}
