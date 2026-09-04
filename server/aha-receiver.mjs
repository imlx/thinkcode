// 匿名顿悟回传接收服务（零依赖 Node，可运行于宝塔 Node 项目或 pm2）
// 隐私红线：不读取、不记录 IP 与任何请求头身份信息；数据以 JSONL 追加写入本地文件。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.AHA_DATA_DIR ?? path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "aha-records.jsonl");
const PORT = Number(process.env.AHA_PORT ?? 8787);

fs.mkdirSync(DATA_DIR, { recursive: true });

function isValidRecord(record) {
  return (
    typeof record.timestamp === "string" &&
    !Number.isNaN(Date.parse(record.timestamp)) &&
    typeof record.module_id === "string" &&
    /^s[1-8]$/.test(record.module_id) &&
    typeof record.choice_id === "string" &&
    /^(option_\d+|option_custom)$/.test(record.choice_id)
  );
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    // 匿名公共接口：允许任意前端来源读取（如本地开发时前端与 receiver 不同端口）
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/aha") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) req.destroy(); // 防超大载荷
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return json(res, 400, { error: "invalid_json" });
      }
      const records = Array.isArray(body.records) ? body.records : [];
      if (records.length === 0 || records.length > 1000) {
        return json(res, 400, { error: "invalid_records" });
      }
      if (!records.every(isValidRecord)) {
        return json(res, 400, { error: "invalid_fields" });
      }
      const lines = records.map((record) =>
        JSON.stringify({ ...record, received_at: new Date().toISOString() })
      );
      fs.appendFileSync(DATA_FILE, lines.join("\n") + "\n");
      return json(res, 200, { ok: true, received: records.length });
    });
    return;
  }

  // 匿名记录公开读取：仅含时间戳、模块编号与选项编号，供前端时间线渲染
  if (req.method === "GET" && url.pathname === "/api/aha/records") {
    const records = [];
    if (fs.existsSync(DATA_FILE)) {
      for (const line of fs.readFileSync(DATA_FILE, "utf-8").split("\n")) {
        if (!line.trim()) continue;
        const { timestamp, module_id, choice_id } = JSON.parse(line);
        records.push({ timestamp, module_id, choice_id });
      }
    }
    return json(res, 200, { records });
  }

  // 聚合统计仅含匿名群体分布（总量、模块分布、选项分布、没有共鸣占比），
  // 不含任何个体记录，无需令牌即可公开读取
  if (req.method === "GET" && url.pathname === "/api/aha/stats") {
    const counts = {};
    const choices = {};
    let total = 0;
    let noResonance = 0;
    if (fs.existsSync(DATA_FILE)) {
      for (const line of fs.readFileSync(DATA_FILE, "utf-8").split("\n")) {
        if (!line.trim()) continue;
        total += 1;
        const { module_id, choice_id } = JSON.parse(line);
        counts[module_id] = (counts[module_id] ?? 0) + 1;
        choices[choice_id] = (choices[choice_id] ?? 0) + 1;
        if (choice_id === "option_7") noResonance += 1;
      }
    }
    return json(res, 200, {
      total,
      by_module: counts,
      by_choice: choices,
      no_resonance: noResonance,
    });
  }

  json(res, 404, { error: "not_found" });
});

// 仅监听本机回环地址，由宝塔 Nginx 反向代理对外暴露
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[aha-receiver] listening on 127.0.0.1:${PORT}`);
  console.log(`[aha-receiver] data file: ${DATA_FILE}`);
});
