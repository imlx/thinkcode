import ideologyData from "@/data/generated/ideology.json";

export interface IdeologyMappingEntry {
  tech: string;
  ideology: string;
}

export interface IdeologyModule {
  id: string;
  title: string;
  source: string;
  codePath: string;
  code: string;
  mapping: IdeologyMappingEntry[];
  scenario: { bank: string; securities: string; insurance: string };
  ahaPrompt: string;
  ahaOptions: string[];
}

interface IdeologyIndex {
  modules: IdeologyModule[];
}

export const IDEOLOGY_MODULES: IdeologyModule[] = (ideologyData as IdeologyIndex).modules;

export function getModuleById(id: string): IdeologyModule | null {
  return IDEOLOGY_MODULES.find((mod) => mod.id === id) ?? null;
}

export interface TriggerResult {
  moduleId: string;
  matchedKeywords: string[];
  mapping: IdeologyMappingEntry[];
}

const EXTRA_KEYWORDS: Record<string, string[]> = {
  s1: ["agent_loop", "observe", "think", "act", "Agent循环", "观察"],
  s2: ["tools", "tool_use", "权限", "role", "permission"],
  s3: ["todo", "plan", "strategy", "任务", "优先级"],
  s4: ["compact", "context", "token", "压缩", "上下文"],
  s5: ["subagent", "sender", "intent", "payload", "子智能体"],
  s6: ["skill", "SKILL.md", "记忆", "memory", "知识沉淀"],
  s7: ["assert", "assertion", "修复", "repair", "assert断言"],
  s8: ["worktree", "sandbox", "guardrail", "沙箱", "护栏"],
};

export function triggerIdeology(
  codeText: string,
  moduleId: string
): TriggerResult | null {
  const mod = getModuleById(moduleId);
  if (!mod) return null;

  const haystack = codeText.toLowerCase();
  const matched: string[] = [];
  for (const keyword of EXTRA_KEYWORDS[moduleId] ?? []) {
    if (haystack.includes(keyword.toLowerCase())) matched.push(keyword);
  }
  for (const entry of mod.mapping) {
    const tech = entry.tech.toLowerCase();
    if (tech.length >= 2 && haystack.includes(tech)) matched.push(entry.tech);
  }

  if (matched.length === 0) return null;
  return { moduleId, matchedKeywords: matched, mapping: mod.mapping };
}
