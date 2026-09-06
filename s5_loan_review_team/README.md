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

## 可选：接入真实大模型

默认无需任何密钥，集中裁决环节由内置规则完成（确定性推演，输出可复现）。
配置密钥后可切换为真实大模型研判，两种模式输出结构一致、可对照验证：

```bash
export LLM_API_KEY=你的密钥
export LLM_BASE_URL=https://api.deepseek.com/v1   # OpenAI 兼容服务均可
export LLM_MODEL=deepseek-chat
export LLM_TIMEOUT=180        # 慢速推理模型可调大请求超时（秒）
# export LLM_TEMPERATURE=1    # 部分模型只允许特定温度值，需要时再设
```

交互式终端首次运行会提示粘贴密钥（不回显，仅保存到本机 `.env`，权限 600，
已被 .gitignore 忽略，不会进入版本库）；直接回车则始终使用本地规则版。
密钥无效、网络超时或模型返回异常时，自动回退本地规则版，主流程不中断。
