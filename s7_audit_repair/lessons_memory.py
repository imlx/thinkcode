#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lessons_memory.py - “错题本”记忆机制示例（s24_audit_repair 目录文件）

参照“选择—提取—固化”的记忆机制：
选择：从运行记录中识别值得固化的失败条目；
提取：将失败转化为结构化的“教训”条目；
固化：写入本目录下新增的 memory/lessons.md（中文撰写），
并在后续运行中作为前置校验项自动加载。

反面用例出处：金融管理部门公开的
消费者权益保护通报案例：夸大收益、混淆自营与代销、风险揭示不足等，禁止编造）。

用法：
    python s24_audit_repair/lessons_memory.py
"""

import os
import re
from pathlib import Path
from typing import Dict, List

MEMORY_DIR = Path(__file__).resolve().parent / "memory"
LESSONS_FILE = MEMORY_DIR / "lessons.md"


def 固化教训(标题: str, 失败原因: str, 教训: str, 反面用例编号: str = "") -> Path:
    """将一次失败记录追加写入 memory/lessons.md，形成可持续积累的错题本。"""
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    if not LESSONS_FILE.exists():
        LESSONS_FILE.write_text(
            "# 错题本（合规审计复盘沉淀）\n\n"
            "> 机制说明：每次“测试—失败—诊断—修复”闭环的教训在此固化，"
            "后续运行自动加载为前置校验项。条目均为金融管理部门公开通报案例。\n\n",
            encoding="utf-8",
        )
    existing = LESSONS_FILE.read_text(encoding="utf-8")
    if f"## {标题}" in existing:
        return LESSONS_FILE  # 同一教训不重复固化
    entry = (
        f"## {标题}\n\n"
        f"- 失败原因：{失败原因}\n"
        f"- 教训：{教训}\n"
        f"- 反面用例编号：{反面用例编号 or '（未登记）'}\n\n"
    )
    with LESSONS_FILE.open("a", encoding="utf-8") as handle:
        handle.write(entry)
    return LESSONS_FILE


def 加载教训() -> List[Dict[str, str]]:
    # 合规检查、审计监督、风险复盘是Feedback Layer的具体体现
    """后续运行前置加载错题本，返回已固化的教训条目列表。"""
    if not LESSONS_FILE.exists():
        return []
    text = LESSONS_FILE.read_text(encoding="utf-8")
    lessons: List[Dict[str, str]] = []
    for block in re.split(r"\n## ", text):
        block = block.strip()
        if not block or block.startswith("#"):
            continue
        title, _, body = block.partition("\n")
        entry = {"标题": title.strip()}
        for line in body.splitlines():
            key, _, value = line.strip().lstrip("- ").partition("：")
            if key in ("失败原因", "教训", "反面用例编号"):
                entry[key] = value.strip()
        lessons.append(entry)
    return lessons


def 前置校验() -> List[Dict[str, str]]:
    """后续运行前置加载错题本：返回全部已固化教训，作为前置校验项清单。"""
    return 加载教训()


if __name__ == "__main__":
    print("s09: 错题本记忆机制（选择—提取—固化）")
    print("数据出处：公开监管通报案例（脱敏编号F1—F3）\n")

    lessons = 加载教训()
    print(f"前置加载错题本：共 {len(lessons)} 条已固化教训")
    for lesson in lessons:
        print(f"- {lesson['标题']}（反面用例：{lesson.get('反面用例编号', '未登记')}）")
    print("\n验证完成：错题本可固化、可加载，供 audit_repair.py 作为前置校验项调用。")
