# 案例 s3：TodoWrite 与 Planning——系统思维与战略统筹

总行把「五篇大文章」拆解为部门任务清单：科技金融投早投小客户清单梳理、绿色金融标准对标、普惠触达率提升，依赖关系清晰、进度可追踪。数据为公开监管数据脱敏整理。

## 思政映射

- 任务拆解（decompose）→ 战略拆解：宏大叙事落实为岗位动作
- 依赖排序（拓扑排序）→ 系统观念：把握先后次序
- 进度看板与状态流转 → 可追踪、可检验的执行力
- 优先级（priority）→ 主要矛盾：牵住牛鼻子

## 运行

```bash
python s3_strategy_todos/strategy_todos.py
```

## 可选：接入真实大模型

默认无需任何密钥，统筹规划环节由内置规则完成（确定性推演，输出可复现）。
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
