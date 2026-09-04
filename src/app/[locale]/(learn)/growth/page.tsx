"use client";

import { GrowthTimeline } from "@/components/ideology/GrowthTimeline";
import { TrajectoryDashboard } from "@/components/ideology/TrajectoryDashboard";

export default function GrowthPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">思想成长时间线</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          你在每个模块留下的顿悟选择——数据只存储在本机浏览器，导出与回传完全由你决定。
        </p>
      </div>
      <div className="space-y-8">
        <TrajectoryDashboard />
        <GrowthTimeline />
      </div>
    </div>
  );
}
