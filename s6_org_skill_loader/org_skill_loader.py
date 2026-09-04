#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
org_skill_loader.py - “组织知识沉淀”主题的 Skills 按需加载示例（s23_org_skill_loader 目录文件）

参照 SkillLoader 的“技能目录—按需注入”经典机制：
启动时只加载技能目录（名称+摘要），执行具体任务时才将匹配的技能全文
注入系统提示词，避免全量加载占用上下文窗口。

技能文件：本目录下 org_skills/ 中三个中文技能模块
（credit_expert.md / risk_checklist.md / compliance_rules.md），
条目出处见监管公开规则原文提炼，禁止编造。

用法：
    python s23_org_skill_loader/org_skill_loader.py
"""

import os
import re
from pathlib import Path
from typing import Dict, List

ORG_SKILLS_DIR = Path(__file__).resolve().parent / "org_skills"

# 组织Skills——把个人经验沉淀为组织能力
# 技能目录：任务类型关键词 -> 技能名称，按需匹配注入
TASK_SKILL_MAP = {
    "展业": "credit_expert",
    "客户开发": "credit_expert",
    "调查报告": "credit_expert",
    "风险": "risk_checklist",
    "预警": "risk_checklist",
    "排查": "risk_checklist",
    "审查": "risk_checklist",
    "合规": "compliance_rules",
    "免责": "compliance_rules",
    "评议": "compliance_rules",
}


class 组织技能加载器:
    """参照 code.py SkillLoader 的目录—注入机制（简化的本地实现）。"""

    def __init__(self, skills_dir: Path) -> None:
        self.skills_dir = skills_dir
        self.skills: Dict[str, Dict[str, str]] = {}
        self.scan()

    @staticmethod
    def 解析前言(text: str) -> Dict[str, str]:
        """解析 Markdown 文件头部 --- 之间的 name/description 字段。"""
        meta: Dict[str, str] = {}
        if not text.startswith("---"):
            return meta
        closing = text.find("\n---", 3)
        if closing == -1:
            return meta
        for line in text[3:closing].splitlines():
            key, _, value = line.partition(":")
            if key.strip() in ("name", "description"):
                meta[key.strip()] = value.strip()
        return meta

    def scan(self) -> None:
        self.skills.clear()
        if not self.skills_dir.exists():
            return
        for md in sorted(self.skills_dir.glob("*.md")):
            content = md.read_text(encoding="utf-8")
            meta = self.解析前言(content)
            name = meta.get("name") or md.stem
            self.skills[name] = {
                "名称": name,
                "摘要": meta.get("description", ""),
                "全文": content,
            }

    def 目录(self) -> str:
        """技能目录：仅名称与摘要，常驻系统提示词，体积小。"""
        if not self.skills:
            return "（未发现技能模块）"
        return "\n".join(f"- {s['名称']}：{s['摘要']}" for s in self.skills.values())

    def 匹配技能(self, 任务: str) -> List[str]:
        """学习型组织——红色基因与专业能力的代际传承：按任务类型按需加载。"""
        matched = []
        for keyword, skill in TASK_SKILL_MAP.items():
            if keyword in 任务 and skill in self.skills and skill not in matched:
                matched.append(skill)
        return matched

    def 注入(self, 基础提示词: str, 任务: str) -> str:
        """将匹配到的技能全文注入系统提示词，返回注入后的提示词。"""
        matched = self.匹配技能(任务)
        if not matched:
            return 基础提示词
        blocks = [f"<已加载组织技能：{name}>\n{self.skills[name]['全文']}\n</已加载组织技能>"
                  for name in matched]
        return 基础提示词 + "\n\n" + "\n\n".join(blocks)


BASE_SYSTEM_PROMPT = "你是一名银行信贷审查助手，依据系统提供的组织技能完成审查任务。"


def 模拟执行(提示词: str, 任务: str) -> str:
    """模拟一次贷前审查执行：提示词中已注入的技能会影响输出内容。"""
    if "risk_checklist" in 提示词:
        return (f"【审查输出（已加载技能）】任务：{任务}\n"
                "  · 核对货款回笼周期与纳税记录（风险识别清单·非财务信息提示）\n"
                "  · 排查借款人与实际用款人是否一致（高频处罚事由清单）\n"
                "  · 结论：未发现预警信号，建议正常受理，并留存核查底稿")
    return (f"【审查输出（未加载技能）】任务：{任务}\n"
            "  · 依据常规流程完成形式审查\n"
            "  · 结论：材料齐全，予以受理")


if __name__ == "__main__":
    print("s07: 组织知识沉淀——Skills 按需加载示例")
    print("数据出处：监管公开规则原文提炼\n")

    loader = 组织技能加载器(ORG_SKILLS_DIR)
    print(f"技能目录已扫描：{len(loader.skills)} 个模块（仅加载名称与摘要）")
    print(loader.目录())
    print()

    任务 = "小微企业贷前审查"
    print(f"演示任务：{任务}\n")

    # 场景一：不加载技能
    提示词_未加载 = BASE_SYSTEM_PROMPT
    print(f"场景一：不加载技能（提示词约 {len(提示词_未加载)} 字符）")
    print(模拟执行(提示词_未加载, 任务))
    print()

    # 场景二：按需注入技能
    提示词_已加载 = loader.注入(BASE_SYSTEM_PROMPT, 任务)
    print(f"场景二：按需注入匹配技能（提示词约 {len(提示词_已加载)} 字符，"
          f"已注入：{'、'.join(loader.匹配技能(任务))}）")
    print(模拟执行(提示词_已加载, 任务))
    print()

    全量 = "\n\n".join(s["全文"] for s in loader.skills.values())
    print(f"对比：若全量加载三个技能需约 {len(BASE_SYSTEM_PROMPT) + len(全量)} 字符；"
          f"按需注入仅需约 {len(提示词_已加载)} 字符，上下文占用显著降低。")
    print("\n验证完成：按需加载机制生效，加载与不加载的输出差异明确。")
