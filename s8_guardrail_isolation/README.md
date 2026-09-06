# 案例 s8：Worktree Isolation——底线思维与廉洁从业

员工行为管理：Agent 试图将客户数据导出到个人目录，被环境沙箱、工作树隔离、协议白名单三层护栏逐级阻断并即时告警、写入审计日志。处罚案例为公开渠道脱敏整理。

## 思政映射

- 环境沙箱 → 公与私的隔离
- 工作树隔离 → 权与钱的隔离：高风险操作在制度轨道上运行
- 协议层白名单 → 亲与清的隔离：法无授权不可为
- 「成功静默、失败发声」日志策略 → 合规无小事、风险零容忍

## 运行

```bash
python s8_guardrail_isolation/guardrail_isolation.py
```

## 可选：接入真实大模型

默认无需任何密钥，越权研判环节由内置规则完成（确定性推演，输出可复现）。
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
