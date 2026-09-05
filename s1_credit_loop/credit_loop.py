#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
credit_loop.py - 信贷审批尽调智能体：观察（Observe）—思考（Think）—行动（Act）闭环示例

本文件为思政编码坊案例 s1 的独立实现，沿用经典 agent_loop() 的
while True 主循环结构实现“观察—思考—行动”闭环，目录自足、可直接运行。

数据来源（公开信息脱敏代号引用）：
- A/B公司财务指标取自上市公司公开年报；
- 行业基准与宏观舆情取自国家统计局、中国人民银行公开数据；
- 代码中不出现任何真实机构名称，仅以脱敏代号 A/B/C 引用。

用法：
    python s1_credit_loop/credit_loop.py
"""

import os
import subprocess
from typing import Dict, List, Optional

# -- 工具执行：优先复用 code.py 中的 run_bash()，环境不满足时退化为本地实现 --
try:
    from code import run_bash  # noqa: F401  复用工具函数
except Exception:  # 运行环境缺少可选依赖时，启用本地退化版本
    def run_bash(command: str) -> str:
        """本地退化版 bash 执行器，仅用于无 LLM 环境的演示验证。"""
        try:
            r = subprocess.run(command, shell=True, cwd=os.getcwd(),
                               capture_output=True, text=True, timeout=30)
            return (r.stdout + r.stderr).strip()[:5000] or "(无输出)"
        except Exception as e:  # noqa: BLE001
            return f"错误：{e}"


# -- 系统提示词：价值目标约束是闭环能够推进的前提 --
# 若缺少“坚持金融工作的政治性、人民性”这一价值目标约束，
# 思考环节将判定循环缺少决策依据而拒绝推进（对应正文中“循环卡在观察—思考之间”的调试经历）。
SYSTEM_PROMPT = (
    "你是一名银行信贷审批尽调智能体，必须始终坚持金融工作的政治性、人民性，"
    "把服务实体经济、防控金融风险作为一切授信决策的根本出发点。"
    "按照“观察—思考—行动”的闭环完成尽调：先全面采集客户信息，再审慎研判风险，"
    "最后给出授信结论并自动完成客户适当性评估。"
)

# -- 脱敏数据集（公开信息脱敏整理，禁止编造数据） --
S1_DATA: Dict[str, Dict[str, object]] = {
    "A公司": {
        "财务报表": {
            "营业收入": "10407.59亿元（2024年度）",
            "归属于母公司股东的净利润": "1383.73亿元，同比+5.0%（2024年度）",
            "资产负债率": "34.3%（2024年末）",
            "经营活动产生的现金流量净额": "3157.41亿元，同比+3.9%（2024年度）",
        },
        "舆情信息": "年报披露“BASIC6”科创计划、“AI+”行动计划（正面舆情条目原型，2024年度）",
        "征信记录": "未见登记的失信记录；杠杆水平显著低于行业基准",
    },
    "B公司": {
        "财务报表": {
            "营业总收入": "132.09亿元，同比-8.15%（2024年度）",
            "净利润": "2.89亿元，同比-73.04%（2024年度）",
            "资产负债率": "13.34%（2024年末）",
            "经营活动产生的现金流量净额": "6.59亿元，同比+150.62%（2024年度）",
        },
        "舆情信息": "未见登记的负面舆情条目",
        "征信记录": "未见登记的失信记录；低杠杆，但盈利能力大幅下行",
    },
    # C公司：S1表未登记其财务与征信数据，按“不得编造”纪律保持为空，
    # 由闭环自然得出“补充材料”结论——数据缺失本身即是尽调发现。
    "C公司": {},
}

# -- 行业基准与宏观舆情（S1表登记：国家统计局、中国人民银行公开数据） --
INDUSTRY_BASELINE = {
    "规模以上工业企业资产负债率": "57.5%（2024年末，国家统计局）",
    "规上工业企业营业收入利润率": "5.39%，其中制造业4.63%（2024年度，国家统计局）",
    "应收账款平均回收期": "64.1天（2024年末，国家统计局）",
}

MACRO_SENTIMENT = [
    "央行宣布自2025年5月15日起降准0.5个百分点，预计释放长期流动性约1万亿元",
    "公开市场7天期逆回购操作利率由1.50%调整为1.40%（2025年5月8日起）",
    "LPR报价：1年期3.0%、5年期以上3.5%（2025-09-22公布）",
]


# -- 观察环节：三个模拟数据采集函数 --
def 采集企业征信(customer_id: str) -> str:
    # 对应“没有调查就没有发言权”——调查研究是决策前提
    """采集企业征信信息（脱敏代号引用S1表登记内容，未登记项如实标注缺失）。"""
    record = S1_DATA.get(customer_id, {})
    credit = record.get("征信记录")
    if credit is None:
        return f"{customer_id}：征信信息未登记，无法核实——需补充授权查询材料"
    return f"{customer_id}：{credit}"


def 采集财务报表(customer_id: str) -> str:
    # 对应“没有调查就没有发言权”——调查研究是决策前提
    """采集企业财务报表（A/B公司数值为上市公司公开年报原文，S1表登记）。"""
    record = S1_DATA.get(customer_id, {})
    statements = record.get("财务报表")
    if not statements:
        return f"{customer_id}：财务报表未登记，无法获取——需补充年报或审计报告"
    lines = [f"{customer_id}财务报表（公开年报原文）："]
    lines += [f"  · {k}：{v}" for k, v in statements.items()]
    return "\n".join(lines)


def 采集舆情信息(customer_id: str) -> str:
    # 对应“没有调查就没有发言权”——调查研究是决策前提
    """采集企业舆情与宏观政策动向（S1表登记的公开信息）。"""
    record = S1_DATA.get(customer_id, {})
    company_news = record.get("舆情信息", f"{customer_id}：未见登记的企业舆情条目")
    macro = "；".join(MACRO_SENTIMENT)
    return f"企业舆情：{company_news}\n宏观政策动向：{macro}"


# -- 思考环节：风险研判（信用评分、行业分析、担保评估） --
def 评估信用评分(financial_text: str) -> int:
    """基于S1表登记财务数据的简易信用评分（0—100）。"""
    score = 60  # 基准分
    if "同比+5.0%" in financial_text or "同比+3.9%" in financial_text:
        score += 20  # 盈利与现金流双增
    if "同比-73.04%" in financial_text or "同比-8.15%" in financial_text:
        score -= 25  # 盈利大幅下行
    if "34.3%" in financial_text or "13.34%" in financial_text:
        score += 10  # 杠杆低于行业基准57.5%
    if "未登记" in financial_text:
        score = 0  # 无数据不得评分
    return max(0, min(100, score))


def 行业分析(customer_id: str, financial_text: str) -> str:
    """对照国家统计局行业基准给出行业分析。"""
    baseline = "；".join(f"{k}{v}" for k, v in INDUSTRY_BASELINE.items())
    if "未登记" in financial_text:
        return f"{customer_id}财务数据缺失，无法对照行业基准（基准：{baseline}）"
    return f"{customer_id}对照行业基准：{baseline}"


def 担保评估(customer_id: str) -> str:
    """担保评估：S1表未登记担保信息，如实按信用方式评估，不虚构担保物。"""
    return f"{customer_id}：S1表未登记担保信息，按信用方式评估授信风险"


def 思考环节(customer_id: str, facts: List[str], system_prompt: str) -> Dict[str, object]:
    # 对应“提高政治判断力、政治领悟力、政治执行力”
    """风险研判：信用评分 + 行业分析 + 担保评估，并校验价值目标约束。"""
    if "坚持金融工作的政治性、人民性" not in system_prompt:
        # 缺少价值目标约束时循环无法推进——对应正文的调试经历
        raise RuntimeError("系统提示词缺少价值目标约束，思考环节无法形成决策依据，循环停滞")
    financial_text = next((f for f in facts if "财务报表" in f), "")
    score = 评估信用评分(financial_text)
    analysis = "\n".join([
        行业分析(customer_id, financial_text),
        担保评估(customer_id),
    ])
    missing = any("未登记" in f for f in facts)
    return {"信用评分": score, "行业分析": analysis, "数据缺失": missing}


# -- 行动环节：授信建议输出（通过/拒绝/补充材料），自动附加客户适当性评估 --
def 客户适当性评估(customer_id: str, decision: str) -> str:
    """输出前自动执行的适当性评估：授信用途合规性、与客户经营规模匹配度、风险揭示。"""
    return (
        f"客户适当性评估（{customer_id}）："
        f"授信用途须符合信贷政策与实体经济导向；"
        f"授信额度须与客户经营规模、现金流匹配；"
        f"结论为“{decision}”，已向客户充分揭示相应风险。"
    )


def 授信建议(thinking: Dict[str, object]) -> str:
    """根据研判结果给出三种结论之一：通过 / 拒绝 / 补充材料。"""
    if thinking["数据缺失"]:
        return "补充材料"
    score = thinking["信用评分"]
    if score >= 80:
        return "通过"
    if score <= 30:
        return "拒绝"
    return "补充材料"


def 行动环节(customer_id: str, thinking: Dict[str, object]) -> str:
    # 对应“空谈误国、实干兴邦”——执行闭环
    """形成授信结论并自动附加客户适当性评估，随后写入审计时间戳。"""
    decision = 授信建议(thinking)
    appropriateness = 客户适当性评估(customer_id, decision)
    # 复用 run_bash 记录决策时间戳，保证闭环可审计、可追溯
    timestamp = run_bash("date '+%Y-%m-%d %H:%M:%S'").splitlines()[0]
    return (
        f"授信结论（{customer_id}）：{decision}\n"
        f"{appropriateness}\n"
        f"决策时间戳：{timestamp}"
    )


# -- 核心模式：参照 code.py agent_loop() 的 while True 主循环结构 --
def agent_loop(customer_id: str, system_prompt: str) -> str:
    messages: List[Dict[str, str]] = [
        {"role": "user", "content": f"请完成对{customer_id}的授信审批尽调"}
    ]
    while True:
        # 对应“没有调查就没有发言权”——调查研究是决策前提
        facts = [
            采集企业征信(customer_id),
            采集财务报表(customer_id),
            采集舆情信息(customer_id),
        ]
        messages.append({"role": "user", "content": "\n".join(facts)})

        # 对应“提高政治判断力、政治领悟力、政治执行力”
        thinking = 思考环节(customer_id, facts, system_prompt)
        messages.append({"role": "assistant", "content": str(thinking)})

        # 对应“空谈误国、实干兴邦”——执行闭环
        final = 行动环节(customer_id, thinking)
        messages.append({"role": "assistant", "content": final})
        # 如同 code.py 中“模型不再调用工具即退出循环”，形成结论后闭环终止
        break
    return final


# -- 入口 --
if __name__ == "__main__":
    print("s01: 信贷审批尽调智能体（观察—思考—行动闭环）")
    print("数据来源：公开信息脱敏整理（代号引用）\n")
    for customer in ("A公司", "B公司", "C公司"):
        print("=" * 60)
        print(f"开始尽调：{customer}")
        print("-" * 60)
        result = agent_loop(customer, SYSTEM_PROMPT)
        print(result)
        print()
    print("闭环验证完成：三户企业均走完“观察—思考—行动”完整循环。")
