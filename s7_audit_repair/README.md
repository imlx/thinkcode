# 案例 s7：Feedback Layer——批评和自我批评的闭环机制

合规审计复盘：营销文案断言「必须包含风险提示」，反面用例 F1 夸大收益、F2 风险揭示不足；失败自动记入错题本（lessons_memory.py，写入本目录 memory/lessons.md）并在后续运行前置加载。反面用例为公开消保通报脱敏编号。

## 思政映射

- 断言（assertion）→ 批评和自我批评：反馈不是否定，而是优化的必要条件
- 异常捕获与日志回溯 → 审计监督：问题显性化、责任可追溯

## 运行

```bash
python s7_audit_repair/audit_repair.py
```

## 可选：接入真实大模型

默认无需任何密钥，诊断归因环节由内置规则完成（确定性推演，输出可复现）。
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
