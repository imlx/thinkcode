#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_repair.py - “测试—失败—诊断—修复”闭环示例（s7_audit_repair 目录文件）

复用任务记录与磁盘持久化机制（优先 from code import，本目录自带
lessons_memory.py 时亦然），对金融场景智能体的输出设置断言（如“营销文案
必须包含风险提示”“授信结论必须附适当性评估”），故意制造一次失败，演示
异常捕获、日志回溯与自修复的完整流程；每次失败通过本目录
lessons_memory.py 固化进错题本，并在后续运行中作为前置校验项自动加载。

反面用例出处：金融管理部门公开的
消费者权益保护通报案例，禁止编造）：
- F1 夸大收益、混淆自营与代销（银保监会消保局2021年第3号通报）；
- F2 风险揭示不足（银监会2008年通报）；
- F3 收益率展示虚高、口径不一致（2024年8月每日经济新闻报道）。

用法：
    python s7_audit_repair/audit_repair.py
"""

import os
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Callable, Dict, List, Optional

# -- 任务记录与磁盘持久化：环境具备可选依赖时直接 import，否则使用接口一致的退化实现 --
try:
    from code import Task, TaskStore  # noqa: F401  复用任务记录与磁盘持久化机制
except Exception:  # 运行环境缺少可选依赖时，启用本地退化版本
    import json
    import secrets
    from dataclasses import asdict, dataclass

    @dataclass
    class Task:
        id: str
        subject: str
        description: str
        status: str
        owner: Optional[str]
        blockedBy: list

    class TaskStore:
        """与 code.py 中 TaskStore 接口一致的退化实现（JSON 磁盘持久化）。"""

        def __init__(self, directory: Path):
            self.directory = directory

        def create(self, subject: str, description: str = "") -> Task:
            self.directory.mkdir(parents=True, exist_ok=True)
            task = Task(id=f"task_{secrets.token_hex(4)}", subject=subject,
                        description=description, status="pending",
                        owner=None, blockedBy=[])
            self.save(task)
            return task

        def save(self, task: Task) -> None:
            self.directory.mkdir(parents=True, exist_ok=True)
            (self.directory / f"{task.id}.json").write_text(
                json.dumps(asdict(task), ensure_ascii=False, indent=2), encoding="utf-8")

        def load(self, task_id: str) -> Task:
            data = json.loads((self.directory / f"{task_id}.json").read_text(encoding="utf-8"))
            return Task(**data)

        def list(self) -> list:
            if not self.directory.exists():
                return []
            return [self.load(path.stem) for path in sorted(self.directory.glob("task_*.json"))]

# 本目录自带的错题本记忆机制
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from lessons_memory import 前置校验, 固化教训  # noqa: E402


# -- 断言规则：反面用例均为金融管理部门公开通报案例 --
ASSERTIONS: List[Dict[str, object]] = [
    {
        "名称": "营销文案必须包含风险提示",
        "检查": lambda 输出: "风险提示" in 输出,
        "反面用例": "F1（片面夸大收益、混淆自营理财与代销产品，银保监会消保局2021年第3号通报）、"
                  "F2（风险揭示不足、过分强调预期收益率，银监会2008年通报）",
    },
    {
        "名称": "授信结论必须附适当性评估",
        "检查": lambda 输出: "适当性评估" in 输出,
        "反面用例": "F2（客户风险偏好评估流于形式）",
    },
    {
        "名称": "收益展示必须口径一致",
        "检查": lambda 输出: "成立以来" not in 输出 or "近1个月" in 输出,
        "反面用例": "F3（App展示成立以来年化超5%，近1个月实际仅约1.6%，2024年8月报道）",
    },
]


def 执行断言(输出: str, 断言规则: Dict[str, object]) -> None:
    # 反馈不是否定，而是系统优化的必要条件
    """单条断言：不通过即抛出 AssertionError，交由闭环捕获处理。"""
    检查: Callable[[str], bool] = 断言规则["检查"]  # type: ignore[assignment]
    if not 检查(输出):
        raise AssertionError(f"断言未通过：{断言规则['名称']}（反面用例：{断言规则['反面用例']}）")


def 生成营销文案(含风险提示: bool = True) -> str:
    """模拟金融场景Agent生成营销文案；含风险提示=False 用于演示故意失败。"""
    文案 = "本期理财产品业绩比较基准3.2%，额度有限，先到先得。"
    if 含风险提示:
        文案 += "【风险提示】理财非存款，产品有风险，投资须谨慎；"
        文案 += "业绩比较基准不代表收益承诺，实际收益以产品到期兑付为准（口径：成立以来与近1个月并列展示）。"
    return 文案


def 生成授信结论(含适当性评估: bool = True) -> str:
    """模拟金融场景Agent输出授信结论。"""
    结论 = "授信结论：B公司补充材料后再议。"
    if 含适当性评估:
        结论 += "客户适当性评估：已核对客户风险承受能力与授信用途匹配性。"
    return 结论


def 运行闭环审计(store: TaskStore) -> None:
    """完整演示“测试—失败—诊断—修复”闭环。"""
    print("【闭环审计】创建审计任务并持久化……")
    task = store.create("营销文案合规断言审计", "对Agent输出执行三条合规断言")
    print(f"  任务已落盘：{task.id}（status={task.status}）")

    agents = [
        ("营销文案Agent", 生成营销文案, {"含风险提示": True}, [ASSERTIONS[0], ASSERTIONS[2]]),
        ("授信结论Agent", 生成授信结论, {"含适当性评估": True}, [ASSERTIONS[1]]),
    ]

    for 名称, 生成函数, 参数, 适用断言 in agents:
        print(f"\n【正常路径】{名称} 输出自检：")
        输出 = 生成函数(**参数)
        for 规则 in 适用断言:
            执行断言(输出, 规则)
            print(f"  ✓ {规则['名称']}")

    print("\n【故意制造失败】临时移除营销文案的风险提示输出：")
    store.save(Task(id=task.id, subject=task.subject, description=task.description,
                    status="in_progress", owner="audit_agent", blockedBy=[]))
    try:
        问题输出 = 生成营销文案(含风险提示=False)
        for 规则 in ASSERTIONS:
            执行断言(问题输出, 规则)
        print("  未捕获到失败（不应到达此处）")
    except AssertionError as error:
        print(f"  ✗ 异常捕获：{error}")
        print("  【日志回溯】")
        for line in traceback.format_exc().strip().splitlines()[-3:]:
            print(f"    {line}")

        print("\n【自修复】自动恢复风险提示并重新断言：")
        修复输出 = 生成营销文案(含风险提示=True)
        执行断言(修复输出, ASSERTIONS[0])
        执行断言(修复输出, ASSERTIONS[2])
        print("  ✓ 修复后断言全部通过")
        store.save(Task(id=task.id, subject=task.subject, description=task.description,
                        status="completed", owner="audit_agent", blockedBy=[]))
        print(f"  任务状态已更新：completed（{task.id}）")

        print("\n【错题本固化】将本次失败写入 memory/lessons.md：")
        路径 = 固化教训(
            标题="营销文案缺失风险提示",
            失败原因="生成环节临时移除了风险提示输出，触发断言“营销文案必须包含风险提示”",
            教训="营销文案生成必须默认附带风险提示，且收益展示须成立以来与近1个月口径并列；"
                 "合规断言前置到输出环节，而非事后抽查",
            反面用例编号="F1、F2、F3（公开通报案例脱敏编号）",
        )
        print(f"  已固化：{Path(路径).relative_to(Path.cwd()) if 路径.is_relative_to(Path.cwd()) else 路径}")


if __name__ == "__main__":
    print("s10: 测试—失败—诊断—修复闭环 + 错题本记忆")
    print("数据出处：公开消保通报案例（脱敏编号F1—F3）\n")

    print("【前置校验】自动加载错题本历史教训：")
    lessons = 前置校验()
    if lessons:
        for lesson in lessons:
            print(f"  · 历史教训：{lesson['标题']}（{lesson.get('反面用例编号', '未登记')}）")
    else:
        print("  · 错题本暂无历史记录，本次运行为首轮审计")

    with tempfile.TemporaryDirectory(prefix="audit_tasks_") as tmp:
        运行闭环审计(TaskStore(Path(tmp)))

    print("\n验证完成：“失败—记录—前置校验—修复”完整闭环走通。")
