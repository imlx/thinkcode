"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
  AhaRecord,
  BehaviorLog,
  ensureBaselineData,
  fetchServerAhaRecords,
  getAhaRecords,
  getBaselineLogs,
  getBaselineRecords,
  getBehaviorLogs,
} from "@/lib/ideology-store";
import { IDEOLOGY_MODULES } from "@/lib/trigger-engine";
import { buildBaselineKeys } from "@/lib/ideology-baseline";

function weekKey(timestamp: string): string {
  const date = new Date(timestamp);
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(day.getTime() - weekday * 86400000);
  return monday.toISOString().slice(0, 10);
}

interface WeeklyPoint {
  week: string;
  engineering: number;
  ideology: number;
}

function aggregateWeekly(records: AhaRecord[], logs: BehaviorLog[]): WeeklyPoint[] {
  const weeks = new Map<string, { engineering: number; ideology: number }>();
  const touch = (week: string) => {
    if (!weeks.has(week)) weeks.set(week, { engineering: 0, ideology: 0 });
    return weeks.get(week)!;
  };

  const moduleIds = new Set(IDEOLOGY_MODULES.map((mod) => mod.id));
  for (const log of logs) {
    if (!log.module_id || !moduleIds.has(log.module_id)) continue;
    if (log.action === "simulate_tab_opened" || log.action === "code_tab_opened") {
      touch(weekKey(log.timestamp)).engineering += 1;
    } else if (log.action === "ideology_tab_opened") {
      touch(weekKey(log.timestamp)).ideology += 1;
    }
  }
  for (const record of records) {
    if (!moduleIds.has(record.module_id)) continue;
    touch(weekKey(record.timestamp)).ideology += 1;
  }

  return Array.from(weeks.entries())
    .map(([week, value]) => ({ week, ...value }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function TrajectoryDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  // 思政维度数据源：优先真实服务器研究库，不可达回退社区基线样本
  const [ideologyRecords, setIdeologyRecords] = useState<AhaRecord[] | null>(null);
  const [fallback, setFallback] = useState(false);
  // 研究库已含种子基线时工程维度叠加基线日志，两维时间范围一致
  const [includeBaselineLogs, setIncludeBaselineLogs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchServerAhaRecords()
      .then((records) => {
        if (cancelled) return;
        setIdeologyRecords(records);
        const keys = buildBaselineKeys();
        if (records.some((r) => keys.has(`${r.timestamp}|${r.module_id}|${r.choice_id}`))) {
          ensureBaselineData();
          setIncludeBaselineLogs(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        ensureBaselineData();
        setIdeologyRecords(getBaselineRecords());
        setFallback(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || ideologyRecords === null) return;
    // 工程维度以本机行为日志为主；基线日志仅在本机基线兜底或研究库已含种子基线时叠加，与思政维度口径一致
    const logs =
      fallback || includeBaselineLogs
        ? [...getBehaviorLogs(), ...getBaselineLogs()]
        : getBehaviorLogs();
    const data = aggregateWeekly([...getAhaRecords(), ...ideologyRecords], logs);
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: {
        data: ["工程维度（推演与代码学习次数）", "思政维度（顿悟与思政映射浏览）"],
        bottom: 0,
      },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: {
        type: "category",
        data: data.map((point) => point.week),
        axisLabel: { rotate: 30, fontSize: 10 },
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "工程维度（推演与代码学习次数）",
          type: "line",
          smooth: true,
          data: data.map((point) => point.engineering),
          itemStyle: { color: "#2563eb" },
          areaStyle: { opacity: 0.08 },
        },
        {
          name: "思政维度（顿悟与思政映射浏览）",
          type: "line",
          smooth: true,
          data: data.map((point) => point.ideology),
          itemStyle: { color: "#d97706" },
          areaStyle: { opacity: 0.08 },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [ideologyRecords, fallback, includeBaselineLogs]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-1 text-base font-semibold">双维度实践轨迹（按周聚合）</h3>
      {fallback && (
        <p className="mb-2 text-[11px] text-zinc-400">研究库暂不可达，思政维度显示本机记录</p>
      )}
      <div ref={containerRef} style={{ width: "100%", height: 320 }} />
    </div>
  );
}
