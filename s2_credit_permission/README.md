# 案例 s2：Tool Use 与权限管理——权责对等的制度意识

岗位权限配置：客户经理持客户书面授权方可查询征信；授信额度审批必须两名审批官双签，同一操作员不能发起又审批；大额划转强制双人复核。

## 思政映射

- 工具注册与调度字典 → 岗位授权清单
- permission 元数据（角色/级别/风险）→ 权责对等：权限即责任
- 默认拒绝（Deny by Default）→ 底线思维：法无授权不可为
- 双人复核（dual approval）→ 用权受监督：双签制的技术实现

## 运行

```bash
python s2_credit_permission/credit_tools.py
```

## 可选：接入真实大模型

默认无需任何密钥，合规研判环节由内置规则完成（确定性推演，输出可复现）。
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
