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

import sys
from typing import Callable, Dict, List, Optional

try:
    from llm_client import chat_json, describe_mode, ensure_config, last_error
except Exception:  # 可选依赖缺失时自动回退本地规则版
    chat_json = None  # type: ignore[assignment]

    def describe_mode() -> str:  # noqa: D103
        return "本地规则推演（可选大模型客户端不可用）"

    def ensure_config() -> None:  # noqa: D103
        return None

    def last_error() -> str:  # noqa: D103
        return ""


# -- 合规研判：权限即责任——有权必有责、用权受监督 --
def 规则合规研判(操作员角色: str, 工具名: str) -> Dict[str, object]:
    """规则版：按工具元数据判定角色是否在允许列表内；高风险工具提示双签要求。"""
    permission = TOOL_PERMISSION.get(工具名)
    if permission is None:
        return {"是否合规": False, "依据": "工具未注册，禁止调用"}
    if 操作员角色 not in permission["role"]:
        return {"是否合规": False, "依据": f"角色不在允许列表（允许：{'、'.join(permission['role'])}）"}
    extra = "；高风险工具，须双签复核，发起与审批不得同人" if permission["risk"] == "高" else ""
    return {"是否合规": True, "依据": f"角色与授权级别匹配（level {permission['level']}）{extra}"}


def 大模型合规研判(场景: str) -> Optional[Dict[str, object]]:
    """可选增强：由真实大模型按岗位授权制度研判场景合规性；未配置密钥或失败返回 None。"""
    if chat_json is None:
        return None
    rules = "\n".join(
        "- {}：角色 [{}]，授权级别 {}，风险 {}{}".format(
            t["name"], "、".join(t["permission"]["role"]), t["permission"]["level"],
            t["permission"]["risk"],
            "，双签制：同一操作员不得同时发起与审批" if t["permission"]["risk"] == "高" else "")
        for t in TOOLS)
    messages = [{"role": "user", "content": (
        "你是银行内控合规官。工具授权表：\n{}\n\n场景：{}\n\n"
        "请研判该场景是否合规，只输出 JSON 对象："
        "{{\"是否合规\": true/false, \"依据\": \"不超过50字\"}}"
    ).format(rules, 场景)}]
    return chat_json(messages)


def 对照研判(操作员角色: str, 工具名: str) -> None:
    """同一授权场景，并列展示规则版与大模型版研判结论。"""
    rule_result = 规则合规研判(操作员角色, 工具名)
    print("场景：{} 申请调用 {}".format(操作员角色, 工具名))
    print("  规则版：{}——{}".format("合规" if rule_result["是否合规"] else "不合规", rule_result["依据"]))
    llm_result = 大模型合规研判("角色为{}的操作员申请调用工具{}".format(操作员角色, 工具名))
    if isinstance(llm_result, dict) and "是否合规" in llm_result:
        print("  大模型版：{}——{}".format("合规" if llm_result["是否合规"] else "不合规", llm_result.get("依据", "")))
    elif last_error():
        print("  大模型版：调用失败[{}]，未出结果".format(last_error()), file=sys.stderr)
    else:
        print("  大模型版：未配置密钥")


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
    ensure_config()  # 交互式终端未配置密钥时询问一次；其余场景静默回退本地规则版
    print("s02: 岗位授权工具注册表（信贷主题）")
    print("研判环节模式：{}".format(describe_mode()))
    for tool in TOOLS:
        perm = tool["permission"]
        print(f"- {tool['name']}（风险等级：{perm['risk']}）")
        print(f"  描述：{tool['description']}")
        print(f"  允许角色：{'、'.join(perm['role'])}；所需授权级别：{perm['level']}")
    print("\n调度字典 TOOL_HANDLERS 已注册：", "、".join(TOOL_HANDLERS))

    print("\n[研判对照] 同一授权场景，规则版（权限元数据）与大模型版（语义研判）：")
    for 角色, 工具 in (("客户经理", "query_customer_credit"),
                       ("客户经理", "approve_credit_limit"),
                       ("审批官", "approve_credit_limit")):
        对照研判(角色, 工具)
    print("\n验证完成：权限元数据判定与双签要求提示均按注册表生效。")
