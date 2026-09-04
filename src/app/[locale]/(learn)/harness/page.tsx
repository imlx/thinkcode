"use client";

import { HarnessMap } from "@/components/ideology/HarnessMap";

export default function HarnessPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">思想 Harness 架构图</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          八大模块的学习状态一览：灰=未解锁，蓝=学习中，绿=已通过，金=已掌握。点击节点查看映射详情。
        </p>
      </div>
      <HarnessMap />
    </div>
  );
}
