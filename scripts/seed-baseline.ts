// 将社区基线样本写入匿名回传研究库（receiver）。
// 幂等：先读取研究库已有记录，只补写缺失的基线记录，可安全重复执行。
// 用法：npm run seed-baseline [回传端点，默认 http://127.0.0.1:8787/api/aha]
import { BASELINE_EPOCH, buildCommunityBaseline } from "../src/lib/ideology-baseline";

const endpoint =
  process.argv[2] ?? process.env.AHA_ENDPOINT ?? "http://127.0.0.1:8787/api/aha";

async function main() {
  const statsRes = await fetch(`${endpoint}/stats`).catch(() => null);
  if (!statsRes || !statsRes.ok) {
    console.error(`无法连接回传服务（${endpoint}/stats），请先启动 receiver`);
    process.exit(1);
  }

  // 固定基准时间：基线生成器按"当前时间"回推，固定后多次执行产物一致，幂等补写才可去重
  const baseline = buildCommunityBaseline(BASELINE_EPOCH);
  const baselineRecords = baseline.records.map(({ timestamp, module_id, choice_id }) => ({
    timestamp,
    module_id,
    choice_id,
  }));

  const key = (r: { timestamp: string; module_id: string; choice_id: string }) =>
    `${r.timestamp}|${r.module_id}|${r.choice_id}`;

  const recordsRes = await fetch(`${endpoint}/records`);
  if (!recordsRes.ok) {
    console.error("receiver 缺少 /records 读取端点，请先部署新版 aha-receiver.mjs");
    process.exit(1);
  }
  const existing = new Set(
    ((await recordsRes.json()) as { records: { timestamp: string; module_id: string; choice_id: string }[] })
      .records.map(key)
  );

  const missing = baselineRecords.filter((r) => !existing.has(key(r)));
  if (missing.length === 0) {
    console.log(`基线样本 ${baselineRecords.length} 条已全量存在于研究库，无需补写`);
    return;
  }

  const BATCH = 500;
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: chunk }),
    });
    if (!res.ok) {
      console.error(`回传失败（HTTP ${res.status}），已中止`);
      process.exit(1);
    }
  }
  console.log(`已补写 ${missing.length} 条基线记录至研究库（${endpoint}）`);
}

main();
