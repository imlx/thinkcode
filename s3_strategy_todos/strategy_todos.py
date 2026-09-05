#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
strategy_todos.py - “金融五篇大文章”战略任务拆解器（s3_strategy_todos 目录文件）

任务基类 TodoManager 负责任务描述、优先级、依赖任务与状态流转
（pending→in_progress→completed）：运行时优先复用标准实现，缺失时启用
本文件内置的接口一致退化版本。本文件在其模式上扩展战略任务拆解、
依赖拓扑排序与中文进度看板。

数据依据（公开监管数据脱敏整理，禁止编造）：
- 各篇大文章贷款余额、增速与特色场景：国有大行2025年年度报告（新华财经读财报报道）；
- 再贷款额度与利率、科创债券公告：中国人民银行公开信息；
- 总体政策依据：国务院办公厅《关于做好金融“五篇大文章”的指导意见》、
  中国人民银行等《金融“五篇大文章”总体统计制度（试行）》。

用法：
    python s3_strategy_todos/strategy_todos.py
"""

from typing import Dict, List, Optional

# -- 复用 TodoManager：环境具备依赖时直接 import，否则使用接口一致的退化实现 --
try:
    from code import TodoManager  # noqa: F401  复用任务管理器
except Exception:  # 运行环境缺少可选依赖时，启用本地退化版本
    class TodoManager:
        """与 code.py 中 TodoManager 接口一致的退化实现（content/status 校验与渲染）。"""

        状态标记 = {"pending": "[ ]", "in_progress": "[>]", "completed": "[x]"}

        def __init__(self) -> None:
            self.items: List[Dict[str, str]] = []

        def update(self, todos: List[Dict[str, str]]) -> str:
            for todo in todos:
                if todo.get("status") not in self.状态标记:
                    raise ValueError(f"非法状态：{todo.get('status')}")
            self.items = todos
            return self.render()

        def render(self) -> str:
            lines = [f"{self.状态标记[t['status']]} {t['content']}" for t in self.items]
            done = sum(t["status"] == "completed" for t in self.items)
            lines.append(f"\n({done}/{len(self.items)} completed)")
            return "\n".join(lines)


class StrategyTodoManager(TodoManager):
    """在 TodoManager 之上扩展优先级与依赖关系的战略任务管理器。"""

    def __init__(self) -> None:
        super().__init__()
        self.tasks: Dict[str, Dict[str, object]] = {}

    def add_task(self, task_id: str, content: str, priority: int,
                 depends_on: Optional[List[str]] = None,
                 belongs_to: str = "") -> None:
        self.tasks[task_id] = {
            "内容": content,
            "优先级": priority,
            "依赖": depends_on or [],
            "状态": "pending",
            "所属篇章": belongs_to,
        }

    def set_status(self, task_id: str, status: str) -> None:
        if status not in ("pending", "in_progress", "completed"):
            raise ValueError(f"非法状态：{status}")
        self.tasks[task_id]["状态"] = status

    def topo_order(self) -> List[str]:
        """依赖拓扑排序：保证每个任务排在它的依赖之后。"""
        visited, order = set(), []

        def visit(task_id: str) -> None:
            if task_id in visited:
                return
            for dep in self.tasks[task_id]["依赖"]:  # 先完成依赖，再推进本任务
                visit(dep)
            visited.add(task_id)
            order.append(task_id)

        for task_id in self.tasks:
            visit(task_id)
        return order

    def render_board(self) -> str:
        """中文进度看板：按状态分组展示优先级、依赖与所属篇章。"""
        分组 = {"in_progress": [], "pending": [], "completed": []}
        for task_id, task in self.tasks.items():
            分组[task["状态"]].append((task_id, task))

        lines = ["=" * 62, "“五篇大文章”战略任务进度看板", "=" * 62]
        标签 = {"in_progress": "进行中", "pending": "待启动", "completed": "已完成"}
        for status in ("in_progress", "pending", "completed"):
            lines.append(f"\n【{标签[status]}】")
            if not 分组[status]:
                lines.append("  （无）")
            for task_id, task in 分组[status]:
                deps = "、".join(task["依赖"]) if task["依赖"] else "无"
                lines.append(
                    f"  · [{task_id}] {task['内容']}"
                    f"（优先级P{task['优先级']}；依赖：{deps}；篇章：{task['所属篇章']}）"
                )
        done = sum(1 for t in self.tasks.values() if t["状态"] == "completed")
        lines.append(f"\n完成进度：{done}/{len(self.tasks)}")
        return "\n".join(lines)


# -- 战略拆解：数据为公开监管数据脱敏整理 --
def decompose_strategy(manager: StrategyTodoManager) -> None:
    # 系统观念——五篇大文章是有机整体，不能“单打一”
    """将“做好金融五篇大文章”拆解为五个一级子任务及可执行动作。"""
    # 总体框架：统计口径先行（《金融“五篇大文章”总体统计制度（试行）》）
    manager.add_task("T0", "统计口径与考核对标（总体统计制度先行）", priority=0, belongs_to="总体框架")

    # 科技金融（某国有大行科技贷款余额6万亿元、增速19.9%，S3表）
    manager.add_task("T1", "科技金融·“投早投小”客户清单梳理与科技型企业贷款投放", priority=1,
                     depends_on=["T0"], belongs_to="科技金融")
    manager.add_task("T2", "科技金融·科创债券与科技创新和技术改造再贷款对接"
                           "（额度增至8000亿元，公告〔2025〕8号）", priority=2,
                     depends_on=["T1"], belongs_to="科技金融")

    # 绿色金融（某国有大行绿色贷款余额超6.7万亿元居同业第一；另一大行增速27.83%，S3表）
    manager.add_task("T3", "绿色金融·绿色信贷标准对标（对标同业6.7万亿元存量实践）", priority=1,
                     depends_on=["T0"], belongs_to="绿色金融")
    manager.add_task("T4", "绿色金融·《绿色金融支持项目目录（2025年版）》更新对标", priority=2,
                     depends_on=["T3"], belongs_to="绿色金融")

    # 普惠金融（某国有大行普惠型小微企业贷款余额3.6万亿元；另一大行服务180多万户，S3表）
    manager.add_task("T5", "普惠金融·小微企业触达率提升方案（对标3.6万亿元存量）", priority=1,
                     depends_on=["T0"], belongs_to="普惠金融")
    manager.add_task("T6", "普惠金融·支农支小再贷款运用"
                           "（央行增加额度3000亿元，利率降至1.2%—1.5%）", priority=2,
                     depends_on=["T5"], belongs_to="普惠金融")

    # 养老金融（某国有大行管理各类养老金规模超5.9万亿元，S3表）
    manager.add_task("T7", "养老金融·养老金账户体系建设（对标5.9万亿元管理规模）", priority=1,
                     depends_on=["T0"], belongs_to="养老金融")
    manager.add_task("T8", "养老金融·养老产业信贷支持（运用服务消费与养老再贷款）", priority=2,
                     depends_on=["T7"], belongs_to="养老金融")

    # 数字金融（千亿参数金融大模型；数字经济核心产业贷款余额超1万亿元，S3表）
    manager.add_task("T9", "数字金融·大模型与数字基础设施建设"
                           "（对标千亿参数金融大模型与超1万亿元数字经济贷款）", priority=1,
                     depends_on=["T0"], belongs_to="数字金融")


def 拓扑排序并演示(manager: StrategyTodoManager) -> None:
    # 战略拆解——宏大叙事必须落实为岗位动作与先后次序
    """按依赖顺序推进任务状态流转，验证拆解、排序与进度追踪。"""
    order = manager.topo_order()
    print("依赖拓扑排序结果：")
    print("  " + " → ".join(order))
    print("\n按拓扑次序模拟执行（pending → in_progress → completed）：")
    for task_id in order:
        manager.set_status(task_id, "in_progress")
        print(f"  [{task_id}] 进入执行：{manager.tasks[task_id]['内容']}")
        manager.set_status(task_id, "completed")
        print(f"  [{task_id}] 已完成")


if __name__ == "__main__":
    print("s05: “金融五篇大文章”战略任务拆解器")
    print("数据出处：国有大行年报、中国人民银行公开信息（脱敏整理）\n")

    manager = StrategyTodoManager()
    decompose_strategy(manager)
    print(f"已将战略拆解为 {len(manager.tasks)} 项可执行任务（含1项总体框架任务）\n")

    拓扑排序并演示(manager)

    print()
    print(manager.render_board())
    print("\n验证完成：拆解、依赖排序与状态流转全部走通。")
