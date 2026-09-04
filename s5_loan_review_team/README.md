# 案例 s5：Subagents——集体主义与组织纪律性

小微企业贷款专项排查：公司金融部、风险管理部、运营管理部三个子智能体并行排查 E1—E5，对 E2 给出相反结论时由主 Agent 裁决采纳风控意见。企业以脱敏代号 E1—E5 引用。

## 思政映射

- 任务隔离（独立 messages 列表）→ 分工负责
- 协议通信（sender/intent/payload/requires_consensus）→ 民主集中制：组织的协议层
- 主 Agent 集中裁决 → 集中统一领导：充分讨论、集中裁决
- 并行执行 → 协同作战：整体合力大于个体之和

## 运行

```bash
python s5_loan_review_team/loan_review_team.py
```
