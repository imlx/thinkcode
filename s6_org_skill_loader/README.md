# 案例 s6：Skills 与记忆系统——学习型党组织建设

信贷审查要点知识库：骨干客户经理的展业经验、风险识别清单、合规审查要点固化为三个技能模块（org_skills/ 目录），新人贷前审查按需加载。

## 思政映射

- 技能模块（SKILL.md）→ 组织知识沉淀
- 按需加载（load on demand）→ 学习型组织：学以致用、急用先学
- 目录常驻、全文按需注入 → 知识管理：索引在手、用时调取
- 记忆固化与复用 → 红色基因与专业能力的代际传承

## 运行

```bash
python s6_org_skill_loader/org_skill_loader.py
```

## 可选：接入真实大模型

默认无需任何密钥，技能匹配环节由内置规则完成（确定性推演，输出可复现）。
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
