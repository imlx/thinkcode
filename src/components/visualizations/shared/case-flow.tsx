"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { useSvgPalette } from "@/hooks/useDarkMode";
import type {
  CaseFlowConfig,
  CaseFlowEdge,
  CaseFlowNode,
} from "@/lib/case-flows";

function edgePath(
  from: CaseFlowNode,
  to: CaseFlowNode,
  via?: "left" | "right"
): string {
  if (via) {
    const off = via === "left" ? -45 : 45;
    const startX = from.x + (via === "left" ? -from.w / 2 : from.w / 2);
    const endX = to.x + (via === "left" ? -to.w / 2 : to.w / 2);
    const midX = (via === "left" ? Math.min(startX, endX) : Math.max(startX, endX)) + off;
    return `M ${startX} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${endX} ${to.y}`;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    const sx = from.x + Math.sign(dx) * (from.w / 2);
    const ex = to.x - Math.sign(dx) * (to.w / 2);
    return `M ${sx} ${from.y} L ${ex} ${to.y}`;
  }
  const sy = from.y + Math.sign(dy) * (from.h / 2);
  const ey = to.y - Math.sign(dy) * (to.h / 2);
  return `M ${from.x} ${sy} L ${to.x} ${ey}`;
}

function edgeMidpoint(from: CaseFlowNode, to: CaseFlowNode, via?: "left" | "right") {
  if (via) {
    const startX = from.x + (via === "left" ? -from.w / 2 : from.w / 2);
    const endX = to.x + (via === "left" ? -to.w / 2 : to.w / 2);
    const off = via === "left" ? -45 : 45;
    const midX = (via === "left" ? Math.min(startX, endX) : Math.max(startX, endX)) + off;
    return { x: midX, y: (from.y + to.y) / 2 };
  }
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

export interface CaseFlowDiagramProps {
  title?: string;
  moduleId?: string;
  onAhaTrigger?: (context: string) => void;
}

export function CaseFlowDiagram({
  config,
  title,
  moduleId,
  onAhaTrigger,
}: CaseFlowDiagramProps & {
  config: CaseFlowConfig;
}) {
  const {
    currentStep,
    totalSteps,
    next,
    prev,
    reset,
    isPlaying,
    toggleAutoPlay,
  } = useSteppedVisualization({
    totalSteps: config.steps.length,
    autoPlayInterval: 2800,
  });

  const palette = useSvgPalette();
  const step = config.steps[currentStep];
  const activeNodes = step.nodes;
  const activeEdges = step.edges;

  // 思政触发器：推演走到最后一步时弹出顿悟邀约（每会话一次）；
  // 中途每个映射节点都可通过「记录此刻顿悟」按钮手动唤出
  const isFinalStep = currentStep === config.steps.length - 1;
  useEffect(() => {
    if (!moduleId || !onAhaTrigger || !isFinalStep || !step.ideology) return;
    const flag = `thinkcode.aha-invited.${moduleId}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    onAhaTrigger(`数据流 · ${step.title}`);
  }, [currentStep, moduleId, onAhaTrigger, isFinalStep, step.ideology, step.title]);

  const nodeById = new Map(config.nodes.map((n) => [n.id, n]));
  const visibleMessages: NonNullable<typeof step.messages> = [];
  for (let s = 0; s <= currentStep; s++) {
    for (const msg of config.steps[s].messages ?? []) visibleMessages.push(msg);
  }

  return (
    <section className="min-h-[500px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {title || "数据流推演"}
      </h2>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Left panel: SVG flowchart (60%) */}
          <div className="w-full lg:w-[60%]">
            <div className="mb-2 truncate font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {config.caption}
            </div>
            <svg
              viewBox={config.viewBox}
              className="w-full rounded-md border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              style={{ minHeight: 300 }}
            >
              <defs>
                <filter id="glow-blue">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.7" />
                </filter>
                <filter id="glow-purple">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.7" />
                </filter>
                <filter id="glow-red">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.7" />
                </filter>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={palette.arrowFill} />
                </marker>
                <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={palette.activeEdgeStroke} />
                </marker>
              </defs>

              {config.edges.map((edge: CaseFlowEdge) => {
                const from = nodeById.get(edge.from)!;
                const to = nodeById.get(edge.to)!;
                const key = `${edge.from}->${edge.to}`;
                const isActive = activeEdges.includes(key);
                const d = edgePath(from, to, edge.via);
                const mid = edgeMidpoint(from, to, edge.via);

                return (
                  <g key={key}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={isActive ? palette.activeEdgeStroke : palette.edgeStroke}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                      animate={{
                        stroke: isActive ? palette.activeEdgeStroke : palette.edgeStroke,
                        strokeWidth: isActive ? 2.5 : 1.5,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    {edge.label && (
                      <text
                        x={mid.x}
                        y={mid.y - 6}
                        textAnchor="middle"
                        className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {config.nodes.map((node) => {
                const isActive = activeNodes.includes(node.id);
                const filterAttr = isActive
                  ? node.danger
                    ? "url(#glow-red)"
                    : node.end
                      ? "url(#glow-purple)"
                      : "url(#glow-blue)"
                  : "none";
                const activeFill = node.danger
                  ? "#ef4444"
                  : node.end
                    ? palette.endNodeFill
                    : palette.activeNodeFill;
                const activeStroke = node.danger
                  ? "#dc2626"
                  : node.end
                    ? palette.endNodeStroke
                    : palette.activeNodeStroke;

                if (node.type === "diamond") {
                  const cx = node.x;
                  const cy = node.y;
                  const hw = node.w / 2;
                  const hh = node.h / 2;
                  const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
                  return (
                    <g key={node.id}>
                      <motion.polygon
                        points={points}
                        fill={isActive ? activeFill : palette.nodeFill}
                        stroke={isActive ? activeStroke : palette.nodeStroke}
                        strokeWidth={1.5}
                        filter={filterAttr}
                        animate={{
                          fill: isActive ? activeFill : palette.nodeFill,
                          stroke: isActive ? activeStroke : palette.nodeStroke,
                        }}
                        transition={{ duration: 0.4 }}
                      />
                      <motion.text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        fontFamily="monospace"
                        animate={{ fill: isActive ? palette.activeNodeText : palette.nodeText }}
                        transition={{ duration: 0.4 }}
                      >
                        {node.label}
                      </motion.text>
                    </g>
                  );
                }

                return (
                  <g key={node.id}>
                    <motion.rect
                      x={node.x - node.w / 2}
                      y={node.y - node.h / 2}
                      width={node.w}
                      height={node.h}
                      rx={8}
                      fill={isActive ? activeFill : palette.nodeFill}
                      stroke={isActive ? activeStroke : palette.nodeStroke}
                      strokeWidth={1.5}
                      filter={filterAttr}
                      animate={{
                        fill: isActive ? activeFill : palette.nodeFill,
                        stroke: isActive ? activeStroke : palette.nodeStroke,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fontFamily="monospace"
                      animate={{ fill: isActive ? palette.activeNodeText : palette.nodeText }}
                      transition={{ duration: 0.4 }}
                    >
                      {node.label}
                    </motion.text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right panel: data flow + ideology highlight (40%) */}
          <div className="flex w-full flex-col gap-3 lg:w-[40%]">
            <div className="flex-1">
              <div className="mb-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                数据流
              </div>
              <div className="min-h-[180px] space-y-2 rounded-md border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <AnimatePresence mode="popLayout">
                  {visibleMessages.length === 0 && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600"
                    >
                      [ 等待数据流入 ]
                    </motion.div>
                  )}
                  {visibleMessages.map((msg, i) => (
                    <motion.div
                      key={`${msg.role}-${msg.detail}-${i}`}
                      initial={{ opacity: 0, y: 12, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35, type: "spring", bounce: 0.3 }}
                      className={`rounded-md px-3 py-2 ${msg.colorClass}`}
                    >
                      <div className="font-mono text-[11px] font-semibold text-white">
                        {msg.role}
                      </div>
                      <div className="mt-0.5 text-[10px] text-white/85">{msg.detail}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-amber-700 dark:text-amber-300">
                    思政映射
                  </span>
                  {onAhaTrigger && step.ideology && (
                    <button
                      onClick={() => onAhaTrigger(`数据流 · ${step.title}`)}
                      className="flex items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 text-[11px] text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
                    >
                      <Lightbulb size={11} />
                      记录此刻顿悟
                    </button>
                  )}
                </div>
                <div className="text-xs leading-5 text-amber-900 dark:text-amber-200">
                  {step.ideology}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <StepControls
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrev={prev}
        onNext={next}
        onReset={reset}
        isPlaying={isPlaying}
        onToggleAutoPlay={toggleAutoPlay}
        stepTitle={step.title}
        stepDescription={step.desc}
      />
    </section>
  );
}
