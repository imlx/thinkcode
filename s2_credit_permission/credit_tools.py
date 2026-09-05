#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
credit_tools.py - 岗位授权审批主题的工具调用示例（s2_credit_permission 目录文件）

参照工具调度字典（TOOL_HANDLERS）的经典模式，注册三个模拟信贷工具：
查询客户征信、审批授信额度、资金划转。每个工具附带 permission 元数据
（允许角色 role / 所需授权级别 level / 风险等级 risk）。

制度依据（公开法规脱敏整理，禁止虚构）：
- 双人复核（dual approval）原型：《商业银行小企业授信工作尽职指引（试行）》（中国银监会，2006年）双签制；
- 权限元数据设计依据：《商业银行授信工作尽职指引》（银监发〔2004〕51号）各环节尽职要求；
- 高风险拒绝与告警规则依据：小微企业授信尽职免责“不得免责”五种情形（银监会，2018年）。

用法：
    python s2_credit_permission/credit_tools.py
"""

from typing import Callable, Dict


# -- 三个模拟工具实现（演示用，不触达真实系统） --
def query_customer_credit(customer_id: str, operator: str) -> str:
    """查询客户征信（须已取得信息主体书面授权，见 role_permission.check_permission 前置校验）。"""
    return f"已受理{operator}对{customer_id}的征信查询申请（模拟）"


def approve_credit_limit(customer_id: str, amount: float, operator: str) -> str:
    """审批授信额度（高风险工具，强制双人复核）。"""
    return f"已完成对{customer_id}授信额度{amount:.2f}万元的审批（模拟）"


def transfer_fund(account: str, amount: float, operator: str) -> str:
    """资金划转（高风险工具，强制双人复核）。"""
    return f"已从账户{account}划转资金{amount:.2f}万元（模拟）"


# -- 工具注册表：参照 code.py 的 TOOL_HANDLERS 调度字典模式 --
TOOLS = [
    {
        "name": "query_customer_credit",
        "description": "查询客户征信：查询前必须取得信息主体本人书面授权（《征信业管理条例》）",
        "permission": {"role": ["客户经理", "风险经理"], "level": 1, "risk": "中"},
    },
    {
        "name": "approve_credit_limit",
        "description": "审批授信额度：高风险操作，同一操作员不得同时发起与审批（双签制）",
        "permission": {"role": ["审批官"], "level": 3, "risk": "高"},
    },
    {
        "name": "transfer_fund",
        "description": "资金划转：高风险操作，强制双人复核，同一操作员不得同时发起与审批",
        "permission": {"role": ["资金运营", "柜员"], "level": 3, "risk": "高"},
    },
]

TOOL_HANDLERS: Dict[str, Callable] = {
    "query_customer_credit": query_customer_credit,
    "approve_credit_limit": approve_credit_limit,
    "transfer_fund": transfer_fund,
}

# 权限即责任——客户经理有授信发起权，就必须承担尽职调查责任
TOOL_PERMISSION = {t["name"]: t["permission"] for t in TOOLS}


if __name__ == "__main__":
    print("s02: 岗位授权工具注册表（信贷主题）")
    for tool in TOOLS:
        perm = tool["permission"]
        print(f"- {tool['name']}（风险等级：{perm['risk']}）")
        print(f"  描述：{tool['description']}")
        print(f"  允许角色：{'、'.join(perm['role'])}；所需授权级别：{perm['level']}")
    print("\n调度字典 TOOL_HANDLERS 已注册：", "、".join(TOOL_HANDLERS))
