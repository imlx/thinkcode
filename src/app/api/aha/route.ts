import { NextResponse } from "next/server";

interface AhaPayload {
  timestamp: string;
  module_id: string;
  choice_id: string;
}

// 匿名顿悟回传（本地开发）：receiver 可用时转发落盘，不可用时仅打印日志。
// 生产为静态导出，无此路由，/api/aha 由 Nginx 直接反代至 receiver。
const RECEIVER = process.env.AHA_RECEIVER ?? "http://127.0.0.1:8787";

// 匿名顿悟回传：仅接受模块编号与选项编号，不接收、不记录任何 IP 或身份信息。
export async function POST(request: Request) {
  let body: { records?: AhaPayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const records = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0 || records.length > 1000) {
    return NextResponse.json({ error: "invalid_records" }, { status: 400 });
  }

  const valid = records.every(
    (record) =>
      typeof record.timestamp === "string" &&
      typeof record.module_id === "string" &&
      /^s\d{2}$/.test(record.module_id) &&
      typeof record.choice_id === "string" &&
      /^(option_\d+|option_custom)$/.test(record.choice_id)
  );
  if (!valid) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  // receiver 可用时转发落盘；不可用时降级为仅日志（纯静态预览场景）
  try {
    const upstream = await fetch(`${RECEIVER}/api/aha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    console.log(`[aha] receiver unreachable, logged ${records.length} anonymous records only`);
    return NextResponse.json({ ok: true, received: records.length, persisted: false });
  }
}
