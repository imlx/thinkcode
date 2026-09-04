import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import { CaseDetail } from "./case-detail";

export function generateStaticParams() {
  return IDEOLOGY_MODULES.map((mod) => ({ id: mod.id }));
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseDetail id={id} />;
}
