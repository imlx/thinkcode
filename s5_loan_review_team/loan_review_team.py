#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
loan_review_team.py - “小微企业贷款专项排查”多智能体协作示例（s5_loan_review_team 目录文件）

参照“子智能体使用全新 messages 列表、上下文隔离”的经典实现，
搭建主Agent与三个子Agent（公司金融部、风险管理部、运营管理部）的协作框架：
任务隔离、协议消息通信、主Agent集中裁决。

数据依据（公开罚单脱敏整理，禁止编造）：
五类违规情形（脱敏代号E1—E5）取自监管公开罚单披露的违规形态：
- E1 划型不实（某城商行被没罚合计1495.13万元，2024年1月，山东监管局）；
- E2 贷款资金回流滞留、挪用购买理财（某股份制银行杭州分行被罚款380万元，2024年2月，浙江监管局）；
- E3 借款人与实际用款人不一致（2024年一季度“贷款三查不尽职”罚单129张、金额5885万元，普华永道分析）；
- E4 贷后管理缺失、风险分类不准确（某城商行合计被罚465万元、10名责任人被追责，2025-05-14，河北监管局）；
- E5 正常经营小微企业对照组（依据：《商业银行小企业授信工作尽职指引（试行）》2006年）；
- 冲突裁决场景原型：互联网银行因“三查”不到位被罚款105万元（2025-11-21，浙江监管局），
  媒体指出小微领域“过度依赖模型快速放款、弱化实质审查”的行业现象。

用法：
    python s5_loan_review_team/loan_review_team.py
"""

import sys
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional

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


def 大模型裁决(conflict: str, statements: List[str]) -> Optional[Dict[str, object]]:
    """可选增强：由真实大模型扮演主Agent，对部门冲突集中裁决；未配置密钥或失败返回 None。

    与主Agent.汇总裁决的规则版裁决对照——民主集中制：先充分讨论，再集中裁决。
    """
    if chat_json is None:
        return None
    messages = [{"role": "user", "content": (
        "你是小微企业贷款专项排查的牵头主Agent，遵循民主集中制：先充分讨论，再由你集中裁决。\n"
        "争议事项：{}\n各部门依据：\n{}\n\n"
        "请输出 JSON 对象：{{\"裁决\": \"一句话结论\", \"理由\": \"不超过80字\"}}"
    ).format(conflict, "\n".join("· " + s for s in statements))}]
    return chat_json(messages)


# -- 排查对象（脱敏代号E1—E5，属性取自S5表登记的违规形态，未登记属性一律不虚构） --
E_RECORDS: Dict[str, Dict[str, object]] = {
    "E1企业": {"划型不实": True, "设定情形": "借用小微企业业务流程为大中型企业办理授信"},
    "E2企业": {"资金回流": True, "还款流水正常": True,
             "设定情形": "贷款资金回流并长期滞留于借款人账户、挪用购买理财"},
    "E3企业": {"用款人不一致": True, "设定情形": "借款人与实际用款人不一致"},
    "E4企业": {"贷后管理缺失": True, "设定情形": "贷后管理缺失、风险分类不准确"},
    "E5企业": {"正常对照组": True, "设定情形": "正常经营的小微企业：货款回笼、纳税、诚信记录良好"},
}


# -- 协议层：消息格式 sender / intent / payload / requires_consensus，字段值使用中文 --
class 协议消息:
    # 协议通信——组织共同语言
    """子智能体之间唯一的通信方式：不共享内存，只传递协议消息。"""

    def __init__(self, sender: str, intent: str, payload: str,
                 requires_consensus: bool = False) -> None:
        self.sender = sender          # 发送方：主Agent / 部门名称
        self.intent = intent          # 意图：任务分派 / 排查结论 / 陈述依据 / 集中裁决
        self.payload = payload        # 内容：中文文本
        self.requires_consensus = requires_consensus  # 是否要求主Agent集中裁决

    def to_dict(self) -> Dict[str, object]:
        return {
            "sender": self.sender,
            "intent": self.intent,
            "payload": self.payload,
            "requires_consensus": self.requires_consensus,
        }

    def __str__(self) -> str:
        flag = "；需集中裁决" if self.requires_consensus else ""
        return f"[协议消息] 发送方：{self.sender}；意图：{self.intent}；内容：{self.payload}{flag}"


# -- 子智能体：全新 messages 列表，任务隔离，仅通过协议消息通信 --
class 子智能体:
    def __init__(self, name: str, mandate: str) -> None:
        self.name = name
        self.mandate = mandate
        self.messages: List[Dict[str, str]] = []  # 任务隔离——分工负责：每个子Agent独享上下文
        self.knowledge = ""                        # 本部门可见的内部工作记录，不与其他子Agent共享

    def 排查(self, msg: 协议消息) -> 协议消息:
        """接收主Agent分派的排查任务，返回本部门结论（协议消息）。"""
        self.messages.append({"role": "user", "content": str(msg)})
        conclusion = self.形成结论()
        reply = 协议消息(sender=self.name, intent="排查结论", payload=conclusion,
                         requires_consensus=self.要求裁决(conclusion))
        self.messages.append({"role": "assistant", "content": str(reply)})
        return reply

    def 陈述依据(self, msg: 协议消息) -> 协议消息:
        """集中裁决前的“充分讨论”环节：陈述本部门结论的制度与事实依据。"""
        self.messages.append({"role": "user", "content": str(msg)})
        reply = 协议消息(sender=self.name, intent="依据陈述", payload=self.依据())
        self.messages.append({"role": "assistant", "content": str(reply)})
        return reply

    def 形成结论(self) -> str:  # pragma: no cover - 由子类实现
        raise NotImplementedError

    def 要求裁决(self, conclusion: str) -> bool:
        return False

    def 依据(self) -> str:  # pragma: no cover - 由子类实现
        raise NotImplementedError


class 公司金融部(子智能体):
    """从客户经营与流水视角排查：关注还款流水与续贷价值。"""

    def __init__(self) -> None:
        super().__init__("公司金融部", "依据客户经营与还款流水评估续贷安排")

    def 形成结论(self) -> str:
        findings = []
        for name, rec in E_RECORDS.items():
            if rec.get("正常对照组"):
                findings.append(f"{name}：货款回笼、纳税、诚信记录良好，维持正常授信")
            elif rec.get("还款流水正常"):
                findings.append(f"{name}：还款流水正常，依据流水表现建议续贷")
            else:
                findings.append(f"{name}：客户经营层面存在疑点，建议风控部门重点关注")
        return "；".join(findings)

    def 要求裁决(self, conclusion: str) -> bool:
        return "建议续贷" in conclusion  # 与风控结论相反时主动要求主Agent裁决

    def 依据(self) -> str:
        return ("依据：本部门掌握的对公还款流水显示E2企业还款记录正常；"
                "但本部门仅掌握流水维度信息，不具备资金流向穿透核查能力。")


class 风险管理部(子智能体):
    """从资金流向与风险信号视角排查：关注资金回流、挪用与分类准确性。"""

    def __init__(self) -> None:
        super().__init__("风险管理部", "穿透核查资金流向与风险分类准确性")

    def 形成结论(self) -> str:
        findings = []
        for name, rec in E_RECORDS.items():
            if rec.get("划型不实"):
                findings.append(f"{name}：划型不实，大中型企业套用小微流程，判定违规")
            elif rec.get("资金回流"):
                findings.append(f"{name}：发现资金回流并滞留痕迹、疑似挪用购买理财，"
                                f"结论为暂停续贷并启动贷后检查（原型：某股份制银行杭州分行"
                                f"同类违规被罚款380万元，2024年2月，浙江监管局）")
            elif rec.get("用款人不一致"):
                findings.append(f"{name}：借款人与实际用款人不一致，判定违规")
            elif rec.get("贷后管理缺失"):
                findings.append(f"{name}：贷后管理缺失、风险分类不准确，判定违规")
            else:
                findings.append(f"{name}：未发现风险信号")
        return "；".join(findings)

    def 要求裁决(self, conclusion: str) -> bool:
        return "暂停续贷" in conclusion  # 与公司金融部结论相反，要求集中裁决

    def 依据(self) -> str:
        return ("依据：资金流向穿透核查发现E2企业贷款资金回流并长期滞留于借款人账户；"
                "监管公开案例显示同类违规已被处罚（罚款380万元）；"
                "媒体已指出小微领域“过度依赖模型快速放款、弱化实质审查”的行业现象"
                "（互联网银行“三查”不到位被罚105万元，2025-11-21，浙江监管局）。")


class 运营管理部(子智能体):
    """从资料完整性与流程合规视角排查：核对授信档案与操作合规。"""

    def __init__(self) -> None:
        super().__init__("运营管理部", "核对授信资料完整性与流程操作合规")

    def 形成结论(self) -> str:
        findings = []
        for name, rec in E_RECORDS.items():
            if rec.get("正常对照组"):
                findings.append(f"{name}：资料齐备、流程合规")
            else:
                findings.append(f"{name}：设定情形涉及流程违规（{rec['设定情形']}），"
                                f"档案记录需补正并纳入整改台账")
        return "；".join(findings)

    def 依据(self) -> str:
        return "依据：运营条线授信档案与操作流程核对结果。"


# -- 主Agent：拆解任务、并行调度、汇总裁决 --
class 主Agent:
    def __init__(self, subagents: List[子智能体]) -> None:
        self.subagents = subagents
        self.inbox: List[协议消息] = []

    def 拆解任务(self) -> str:
        return ("排查任务：对E1—E5五户小微企业贷款开展专项排查。"
                "公司金融部评估客户经营与流水；风险管理部穿透核查资金流向；"
                "运营管理部核对资料与流程合规。各部门仅依据本部门职责形成结论，"
                "结论相反时标记requires_consensus，由主Agent集中裁决。")

    def 并行执行(self) -> List[协议消息]:
        """三个子Agent并行执行排查，仅通过协议消息回传结果。"""
        task = 协议消息(sender="主Agent", intent="任务分派", payload=self.拆解任务())
        with ThreadPoolExecutor(max_workers=len(self.subagents)) as pool:
            futures = {pool.submit(agent.排查, task): agent for agent in self.subagents}
            replies = [f.result() for f in futures]
        self.inbox.extend(replies)
        return replies

    def 汇总裁决(self, replies: List[协议消息]) -> str:
        # 主Agent协调——集中统一领导
        """汇总各部门结论；发现相反结论时先充分讨论，再集中裁决。"""
        print("\n【主Agent】收到各部门协议消息：")
        conflict_customers = set()
        for reply in replies:
            print(f"  {reply}")
            if reply.requires_consensus:
                conflict_customers.add(reply.sender)

        if not conflict_customers:
            return "各部门结论一致，按多数意见形成排查结论。"

        print("\n【主Agent】检测到相反结论（E2企业：续贷 vs 暂停续贷），启动充分讨论：")
        for agent in self.subagents:
            if agent.name in conflict_customers:
                basis = agent.陈述依据(协议消息(sender="主Agent", intent="要求陈述依据",
                                              payload="请陈述你对E2企业结论的事实与制度依据"))
                print(f"  {basis}")
                self.inbox.append(basis)

        ruling = (
            "集中裁决（主Agent）：采纳风险管理部结论——E2企业暂停续贷并启动贷后检查。"
            "理由：资金流向穿透核查属于更高维度的风险证据，流水正常不能排除资金回流与挪用；"
            "监管公开案例已表明同类违规被处罚的确定性。公司金融部的续贷建议予以保留，"
            "待贷后检查排除风险后再行审议。"
        )
        print(f"\n【主Agent】{ruling}")
        self.inbox.append(协议消息(sender="主Agent", intent="集中裁决", payload=ruling))
        return ruling


if __name__ == "__main__":
    ensure_config()  # 交互式终端未配置密钥时询问一次；其余场景静默回退本地规则版
    print("s06: 小微企业贷款专项排查——多智能体协作示例")
    print("裁决环节模式：{}".format(describe_mode()))
    print("数据出处：监管公开罚单（脱敏代号E1—E5）\n")

    team = [公司金融部(), 风险管理部(), 运营管理部()]
    lead = 主Agent(team)

    print("【主Agent】任务拆解：")
    print(f"  {lead.拆解任务()}\n")
    print("【主Agent】并行派发排查任务（三个子Agent独立执行、协议消息回传）……")

    replies = lead.并行执行()
    lead.汇总裁决(replies)

    print("\n[裁决对照] 同一冲突事项，大模型版集中裁决：")
    conflict = ("E2企业是否续贷：公司金融部依据还款流水正常建议续贷；"
                "风险管理部穿透核查发现资金回流并滞留、疑似挪用购买理财，建议暂停续贷")
    ruling_llm = 大模型裁决(conflict, [公司金融部().依据(), 风险管理部().依据()])
    if isinstance(ruling_llm, dict) and "裁决" in ruling_llm:
        print("  大模型版：{}——{}".format(ruling_llm["裁决"], ruling_llm.get("理由", "")))
    elif last_error():
        print("  大模型版：调用失败[{}]，未出结果".format(last_error()), file=sys.stderr)
    else:
        print("  大模型版：未配置密钥（本地规则版裁决见上文）")

    print("\n验证完成：任务隔离、协议通信、并行执行与冲突集中裁决流程全部走通。")
    print("（每个子Agent仅持有本部门messages列表，全程未共享内存。）")
