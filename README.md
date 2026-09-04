# 思政编码坊 ThinkCode

以 AI 大模型工程化实践为载体，加强金融从业者思想政治工作的范式创新平台。

平台将八个金融场景下的 Agent Harness 工程案例（s1–s8）与思想政治工作方法论双轨融合：每个技术机制都对应一条思政映射，学习过程中通过"顿悟时刻"邀约记录价值共鸣，并经知情同意后匿名回传至研究库用于群体共鸣分析。

本项目的工程底座借鉴开源课程项目 [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)（原 17 章渐进式 Agent 构建课程）的技术栈与交互形态，内容与案例为原创。

## 八个实践模块

| 模块 | 工程机制 | 思政主题 |
|---|---|---|
| s1 | Agent Loop | 观察—思考—行动的闭环思维 |
| s2 | Tool Use 与权限管理 | 权责对等的制度意识 |
| s3 | TodoWrite 与 Planning | 系统思维与战略统筹 |
| s4 | Context Compact | 去伪存真、把握主要矛盾 |
| s5 | Subagents | 集体主义与组织纪律性 |
| s6 | Skills 与记忆系统 | 学习型党组织建设 |
| s7 | Feedback Layer | 批评和自我批评的闭环机制 |
| s8 | Worktree Isolation | 底线思维与廉洁从业 |

## 技术栈

Next.js 16（静态导出）· React 19 · TypeScript · Tailwind CSS 4 · ECharts · framer-motion

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
```

## 匿名回传研究库（receiver）

零依赖 Node 服务，接收前端匿名回传的顿悟记录（仅时间戳、模块编号、选项编号，不含任何个人身份信息）：

```bash
npm run receiver   # 监听 127.0.0.1:8787
```

- `POST /api/aha` 回传记录（JSONL 追加写入 `data/aha-records.jsonl`）
- `GET /api/aha/records` 匿名记录公开读取
- `GET /api/aha/stats` 群体聚合统计（总量、模块分布、选项分布、没有共鸣占比）

生产环境由 Nginx 反向代理对外暴露（宝塔部署），前端经 `NEXT_PUBLIC_AHA_ENDPOINT` 或同源 `/api/aha` 访问。

向研究库补写社区基线样本（幂等，可重复执行）：

```bash
npm run seed-baseline [回传端点]
```

## 目录结构

```
src/
  app/[locale]/(learn)/   架构层次 / 学习路径 / 案例实践 / 版本对比 / 思想Harness / 思想成长 / 参与研究
  components/             可视化、模拟器、顿悟邀约、成长时间线等
  data/                   思政映射规则（yml）与生成产物
  i18n/                   文案
  lib/                    触发引擎、数据存储、基线生成
scripts/                  数据抽取与基线种子脚本
server/aha-receiver.mjs   匿名回传接收服务
s1_*–s8_*/                八个案例的 Python 源码（实践代码轨道）
```
