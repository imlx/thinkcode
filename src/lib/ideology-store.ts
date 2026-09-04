"use client";

import { buildCommunityBaseline } from "./ideology-baseline";
import { IDEOLOGY_MODULES } from "./trigger-engine";

export interface AhaRecord {
  id: string;
  timestamp: string;
  module_id: string;
  choice_id: string;
  content: string;
  // 触发场景（如「数据流 · 思考：风险研判」），手动唤出时为空
  code_location?: string;
  // 邀约来源：trigger 自动命中 / manual 手动唤出
  trigger?: "trigger" | "manual";
}

export interface BehaviorLog {
  id: string;
  timestamp: string;
  action: string;
  module_id?: string;
  detail?: string;
}

const AHA_KEY = "thinkcode.aha.records";
const BEHAVIOR_KEY = "thinkcode.behavior.logs";
const CONSENT_KEY = "thinkcode.anonymous-upload-consent";
const COMMUNITY_KEY = "thinkcode.community-data";
const COMMUNITY_SPLIT_KEY = "thinkcode.community-split.v3";

// 个人记录与社区基线的 id 形态不同：个人为时间戳型，基线为日期+序号型
const BASELINE_AHA_ID = /^aha_\d{4}-\d{2}-\d{2}_\d+$/;
const BASELINE_LOG_ID = /^log_\d{4}-\d{2}-\d{2}_\d+$/;

interface CommunityData {
  records: AhaRecord[];
  logs: BehaviorLog[];
}

export function ensureBaselineData() {
  if (typeof window === "undefined") return;
  pruneStaleEntries();
  splitCommunityEntries();
  if (!window.localStorage.getItem(COMMUNITY_KEY)) {
    const baseline = buildCommunityBaseline();
    writeJson(COMMUNITY_KEY, { records: baseline.records, logs: baseline.logs });
  }
}

// 旧版本曾把社区基线并入个人存储：按 id 形态识别并迁回社区存储，只执行一次
function splitCommunityEntries() {
  if (window.localStorage.getItem(COMMUNITY_SPLIT_KEY)) return;
  const records = getAhaRecords();
  const logs = getBehaviorLogs();
  const communityRecords = records.filter((r) => BASELINE_AHA_ID.test(r.id));
  const communityLogs = logs.filter((l) => BASELINE_LOG_ID.test(l.id));
  if (communityRecords.length || communityLogs.length) {
    const existing = getCommunityData();
    writeJson(COMMUNITY_KEY, {
      records: [...existing.records, ...communityRecords],
      logs: [...existing.logs, ...communityLogs],
    });
    writeJson(AHA_KEY, records.filter((r) => !BASELINE_AHA_ID.test(r.id)));
    writeJson(BEHAVIOR_KEY, logs.filter((l) => !BASELINE_LOG_ID.test(l.id)));
  }
  window.localStorage.setItem(COMMUNITY_SPLIT_KEY, "1");
}

function getCommunityData(): CommunityData {
  if (typeof window === "undefined") return { records: [], logs: [] };
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEY);
    if (raw) return JSON.parse(raw) as CommunityData;
  } catch {
    // fallthrough
  }
  return { records: [], logs: [] };
}

// 含社区基线的合并视图：仅用于思想成长页的曲线与清单
export function getAllAhaRecords(): AhaRecord[] {
  return [...getAhaRecords(), ...getCommunityData().records].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
}

export function getAllBehaviorLogs(): BehaviorLog[] {
  return [...getBehaviorLogs(), ...getCommunityData().logs].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
}

// 模块重编号（s18–s25 → s1–s8）后，清理本机残留的旧编号记录
function pruneStaleEntries() {
  const moduleIds = new Set(IDEOLOGY_MODULES.map((mod) => mod.id));
  const records = getAhaRecords();
  const validRecords = records.filter((r) => moduleIds.has(r.module_id));
  if (validRecords.length !== records.length) writeJson(AHA_KEY, validRecords);
  const logs = getBehaviorLogs();
  const validLogs = logs.filter((l) => !l.module_id || moduleIds.has(l.module_id));
  if (validLogs.length !== logs.length) writeJson(BEHAVIOR_KEY, validLogs);
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getAhaRecords(): AhaRecord[] {
  return readJson<AhaRecord>(AHA_KEY);
}

export function saveAhaRecord(record: AhaRecord) {
  const records = getAhaRecords();
  records.push(record);
  writeJson(AHA_KEY, records);
  logBehavior({ action: "aha_recorded", module_id: record.module_id });
  notifyAhaChanged();
}

function notifyAhaChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("thinkcode:aha-changed"));
}

export function removeAhaRecord(moduleId: string, choiceId: string) {
  const records = getAhaRecords();
  const index = records.findIndex(
    (r) => r.module_id === moduleId && r.choice_id === choiceId
  );
  if (index === -1) return;
  records.splice(index, 1);
  writeJson(AHA_KEY, records);
  notifyAhaChanged();
}

export function getBehaviorLogs(): BehaviorLog[] {
  return readJson<BehaviorLog>(BEHAVIOR_KEY);
}

export function logBehavior(log: Omit<BehaviorLog, "id" | "timestamp">) {
  const logs = getBehaviorLogs();
  logs.push({ ...log, id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, timestamp: new Date().toISOString() });
  writeJson(BEHAVIOR_KEY, logs);
}

// 社区基线样本（仅用于服务器研究库不可达时的兜底展示）
export function getBaselineRecords(): AhaRecord[] {
  return getCommunityData().records;
}

export function getBaselineLogs(): BehaviorLog[] {
  return getCommunityData().logs;
}

// 从真实服务器研究库拉取匿名顿悟记录；不可达时抛错，由调用方回退到基线样本。
// 服务器仅存时间戳/模块编号/选项编号，展示文本按选项编号从映射规则库还原。
export async function fetchServerAhaRecords(): Promise<AhaRecord[]> {
  const endpoint = getAhaEndpoint();
  const res = await fetch(`${endpoint}/records`);
  if (!res.ok) throw new Error("records_unavailable");
  const data = (await res.json()) as { records?: { timestamp: string; module_id: string; choice_id: string }[] };
  if (!Array.isArray(data.records)) throw new Error("records_invalid");
  return data.records.map((record, index) => {
    const mod = IDEOLOGY_MODULES.find((m) => m.id === record.module_id) ?? null;
    const optionMatch = /^option_(\d+)$/.exec(record.choice_id);
    const content =
      mod && optionMatch
        ? (mod.ahaOptions[Number(optionMatch[1])] ?? "")
        : "";
    return {
      id: `srv_${record.module_id}_${record.choice_id}_${index}`,
      timestamp: record.timestamp,
      module_id: record.module_id,
      choice_id: record.choice_id,
      content,
    };
  });
}

export function hasUploadConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) === "granted";
}

// 匿名回传端点：优先环境变量；本地开发（localhost/127.0.0.1）直连本机 receiver
// （已开 CORS）；线上同源走 Nginx 反代。
export function getAhaEndpoint(): string {
  if (process.env.NEXT_PUBLIC_AHA_ENDPOINT) {
    return process.env.NEXT_PUBLIC_AHA_ENDPOINT;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://127.0.0.1:8787/api/aha";
  }
  return "/api/aha";
}

export function setUploadConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
}

export function exportAhaRecordsAsMarkdown(): string {
  const records = getAhaRecords();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const lines = [`# 思想成长记录_${date}`, ""];
  for (const record of records) {
    lines.push(
      `- ${record.timestamp.slice(0, 10)} · ${record.module_id} · ${record.content}` +
        (record.code_location ? ` · ${record.code_location}` : "")
    );
  }
  return lines.join("\n");
}
