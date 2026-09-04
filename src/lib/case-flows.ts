// 案例 s1–s8 的数据流图配置：节点/边/分步激活 + 每步思政映射高亮
// 由 CaseFlowDiagram 组件渲染，视觉语言与课程章节可视化保持一致。

export interface CaseFlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type?: "rect" | "diamond";
  end?: boolean;
  danger?: boolean;
}

export interface CaseFlowEdge {
  from: string;
  to: string;
  label?: string;
  via?: "left" | "right";
}

export interface CaseFlowMessage {
  role: string;
  detail: string;
  colorClass: string;
}

export interface CaseFlowStep {
  title: string;
  desc: string;
  nodes: string[];
  edges: string[];
  messages?: CaseFlowMessage[];
  ideology?: string;
}

export interface CaseFlowConfig {
  caption: string;
  viewBox: string;
  nodes: CaseFlowNode[];
  edges: CaseFlowEdge[];
  steps: CaseFlowStep[];
}

const USER = "bg-blue-500 dark:bg-blue-600";
const ASSISTANT = "bg-zinc-600 dark:bg-zinc-500";
const TOOL = "bg-amber-500 dark:bg-amber-600";
const RESULT = "bg-emerald-500 dark:bg-emerald-600";
const SYSTEM = "bg-purple-500 dark:bg-purple-600";

export const CASE_FLOWS: Record<string, CaseFlowConfig> = {
  s1: {
    caption: "while (stop_reason == \"tool_use\") { 观察(); 思考(); 行动(); }",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "task", label: "提交尽调任务", x: 160, y: 45, w: 130, h: 40 },
      { id: "observe", label: "观察：征信·财报·舆情", x: 160, y: 145, w: 160, h: 44 },
      { id: "think", label: "思考：风险研判", x: 160, y: 250, w: 140, h: 44 },
      { id: "act", label: "行动：授信+适当性", x: 160, y: 355, w: 160, h: 44 },
      { id: "output", label: "闭环输出·留痕", x: 385, y: 250, w: 130, h: 40, end: true },
    ],
    edges: [
      { from: "task", to: "observe" },
      { from: "observe", to: "think" },
      { from: "think", to: "act" },
      { from: "act", to: "output" },
      { from: "act", to: "observe", label: "事实不足，回到观察", via: "left" },
    ],
    steps: [
      {
        title: "尽调闭环总览",
        desc: "信贷审批「客户尽调—风险研判—授信执行」是一个观察—思考—行动的循环，技术闭环与工作闭环是同一件事。",
        nodes: [],
        edges: [],
        ideology: "观察—思考—行动的闭环思维",
      },
      {
        title: "提交尽调任务",
        desc: "客户经理下达任务：采集 A 企业征信、财报与舆情，给出授信建议并附客户适当性评估。",
        nodes: ["task"],
        edges: [],
        messages: [{ role: "user", detail: "对 A 企业完成贷前尽调", colorClass: USER }],
        ideology: "调查研究——「没有调查就没有发言权」",
      },
      {
        title: "观察：三类事实采集",
        desc: "征信、财报、舆情三路工具调用，事实全部进入上下文，可回溯。",
        nodes: ["task", "observe"],
        edges: ["task->observe"],
        messages: [
          { role: "tool", detail: "采集企业征信(A)：近24个月无逾期", colorClass: TOOL },
          { role: "result", detail: "财报：营收三年增长，现金流为正", colorClass: RESULT },
          { role: "result", detail: "舆情：无重大诉讼处罚", colorClass: RESULT },
        ],
        ideology: "观察（Observe）→ 调查研究",
      },
      {
        title: "思考：风险研判",
        desc: "信用评分、行业分析、担保评估综合为结构化 thinking——研判过程留痕。",
        nodes: ["observe", "think"],
        edges: ["observe->think"],
        messages: [
          { role: "assistant", detail: "thinking: { 评分 82, 行业风险低, 担保充足 }", colorClass: ASSISTANT },
        ],
        ideology: "思考（Think）→ 政治判断力、政治领悟力、政治执行力",
      },
      {
        title: "行动：授信 + 适当性",
        desc: "授信建议与客户适当性评估一并输出——适当性前置，不是事后补丁。",
        nodes: ["think", "act"],
        edges: ["think->act"],
        messages: [
          { role: "tool", detail: "授信 800 万元/1 年；适当性评估：适配", colorClass: TOOL },
        ],
        ideology: "行动（Act）→ 务实作风——「空谈误国、实干兴邦」",
      },
      {
        title: "价值目标贯穿全程",
        desc: "系统提示词写入价值目标约束：金融工作的政治性、人民性，闭环每一环都受其约束。",
        nodes: ["observe", "think", "act"],
        edges: ["observe->think", "think->act", "act->observe"],
        messages: [
          { role: "system", detail: "价值目标：金融工作的政治性、人民性", colorClass: SYSTEM },
        ],
        ideology: "系统提示词中的价值目标约束 → 金融工作的政治性、人民性",
      },
      {
        title: "闭环完成",
        desc: "结论输出即闭环完成：输入、研判、结论全部留痕，可回溯、可检验。",
        nodes: ["output"],
        edges: ["act->output"],
        messages: [
          { role: "assistant", detail: "尽调闭环完成，全程留痕", colorClass: ASSISTANT },
        ],
        ideology: "闭环：留痕、可回溯、可检验",
      },
    ],
  },

  s2: {
    caption: "permission = { 角色, 级别, 风险 }; deny by default",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "auth", label: "权限字典校验", x: 150, y: 45, w: 130, h: 40 },
      { id: "credit", label: "征信查询", x: 335, y: 45, w: 110, h: 40 },
      { id: "approve", label: "额度审批", x: 335, y: 155, w: 110, h: 40 },
      { id: "deny", label: "默认拒绝", x: 150, y: 155, w: 110, h: 40, danger: true },
      { id: "dual", label: "第二审批官双签", x: 335, y: 270, w: 150, h: 40 },
      { id: "audit", label: "留痕·可追溯", x: 150, y: 270, w: 130, h: 40, end: true },
    ],
    edges: [
      { from: "auth", to: "credit" },
      { from: "credit", to: "approve" },
      { from: "approve", to: "deny", label: "发起人=审批人" },
      { from: "deny", to: "dual", label: "双人复核" },
      { from: "dual", to: "audit" },
    ],
    steps: [
      {
        title: "岗位权限总览",
        desc: "工具注册与调度字典就是岗位授权清单：每一行配置都是一份责任承诺书。",
        nodes: [],
        edges: [],
        ideology: "权限即责任——权责对等的制度意识",
      },
      {
        title: "权限字典校验",
        desc: "每个工具调用先查权限字典：角色、级别、风险三维元数据决定能否执行。",
        nodes: ["auth"],
        edges: [],
        messages: [
          { role: "system", detail: "permission: { 角色, 级别, 风险 }", colorClass: SYSTEM },
        ],
        ideology: "工具注册与调度字典 → 岗位授权清单",
      },
      {
        title: "授权查询：征信",
        desc: "客户经理持客户书面授权查询征信——授权书编号有效，本次查询留痕。",
        nodes: ["auth", "credit"],
        edges: ["auth->credit"],
        messages: [
          { role: "tool", detail: "query_credit(B, 授权 WX-2026-0187) → 允许", colorClass: TOOL },
        ],
        ideology: "permission 元数据 → 权责对等——「权限即责任」",
      },
      {
        title: "越权拦截：默认拒绝",
        desc: "同一操作员发起又审批 300 万元额度——系统默认拒绝，须第二名审批官双签。",
        nodes: ["approve", "deny"],
        edges: ["credit->approve", "approve->deny"],
        messages: [
          { role: "result", detail: "拒绝：发起人与审批人同一，需双签", colorClass: RESULT },
        ],
        ideology: "默认拒绝（Deny by Default）→ 底线思维——「法无授权不可为」",
      },
      {
        title: "双人复核",
        desc: "审批官乙登录复核，双签齐备后额度生效——用权受监督。",
        nodes: ["deny", "dual"],
        edges: ["deny->dual"],
        messages: [
          { role: "user", detail: "审批官乙复核：双签通过", colorClass: USER },
        ],
        ideology: "双人复核（dual approval）→ 用权受监督——双签制的技术实现",
      },
      {
        title: "留痕可追溯",
        desc: "查询与审批全量留痕：谁、何时、对什么数据、做了什么，全程可审计。",
        nodes: ["audit"],
        edges: ["dual->audit"],
        messages: [
          { role: "result", detail: "额度生效；查询留痕可追溯", colorClass: RESULT },
        ],
        ideology: "权责对等：每一行配置都是责任承诺书",
      },
    ],
  },

  s3: {
    caption: "strategy.decompose() → topo_order() → render_board()",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "strategy", label: "五篇大文章", x: 150, y: 45, w: 120, h: 40 },
      { id: "decompose", label: "任务拆解 t1/t2/t3", x: 335, y: 45, w: 150, h: 40 },
      { id: "deps", label: "依赖排序·拓扑", x: 335, y: 155, w: 140, h: 40 },
      { id: "priority", label: "优先级·牛鼻子", x: 335, y: 265, w: 140, h: 40 },
      { id: "board", label: "进度看板·全组可见", x: 150, y: 265, w: 150, h: 40, end: true },
    ],
    edges: [
      { from: "strategy", to: "decompose" },
      { from: "decompose", to: "deps" },
      { from: "deps", to: "priority" },
      { from: "priority", to: "board" },
    ],
    steps: [
      {
        title: "战略拆解总览",
        desc: "「五篇大文章」不是口号：拆解为岗位任务清单，依赖清晰、进度可追踪。",
        nodes: [],
        edges: [],
        ideology: "系统思维与战略统筹",
      },
      {
        title: "任务拆解",
        desc: "拆解为三项任务：科技金融投早投小清单、绿色金融标准对标、普惠触达率提升。",
        nodes: ["strategy", "decompose"],
        edges: ["strategy->decompose"],
        messages: [
          { role: "tool", detail: "add_task: t1 / t2 / t3，优先级已标记", colorClass: TOOL },
        ],
        ideology: "任务拆解（decompose）→ 战略拆解——宏大叙事落实为岗位动作",
      },
      {
        title: "依赖排序",
        desc: "t3 依赖 t1 的前置成果，t2 并行——拓扑排序给出唯一合法执行次序。",
        nodes: ["deps"],
        edges: ["decompose->deps"],
        messages: [
          { role: "result", detail: "拓扑序：[t1, t2 ∥, t3]", colorClass: RESULT },
        ],
        ideology: "依赖排序（拓扑排序）→ 系统观念——把握先后次序，不能「单打一」",
      },
      {
        title: "优先级：牵牛鼻子",
        desc: "t1 是当前主要矛盾——优先投入，t1 完成前 t3 保持阻塞。",
        nodes: ["priority"],
        edges: ["deps->priority"],
        messages: [
          { role: "assistant", detail: "牵住牛鼻子：t1 优先投入", colorClass: ASSISTANT },
        ],
        ideology: "优先级（priority）→ 主要矛盾——牵住「牛鼻子」",
      },
      {
        title: "看板追踪",
        desc: "看板全组可见：t1 进行中、t2 待开始、t3 阻塞——状态流转公开透明。",
        nodes: ["board"],
        edges: ["priority->board"],
        messages: [
          { role: "tool", detail: "看板：t1 进行中 / t3 阻塞（依赖 t1）", colorClass: TOOL },
        ],
        ideology: "进度看板与状态流转 → 可追踪、可检验的执行力",
      },
      {
        title: "状态流转",
        desc: "t1 完成 → t3 自动解除阻塞。战略拆解闭环：从口号到可检验的岗位动作。",
        nodes: ["deps", "board"],
        edges: ["deps->priority", "priority->board"],
        messages: [
          { role: "result", detail: "t1 完成 → t3 解除阻塞", colorClass: RESULT },
        ],
        ideology: "战略不是口号：进度可追踪、结果可检验",
      },
    ],
  },

  s4: {
    caption: "compact(50 条, budget=10) → 事实摘要",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "corpus", label: "50 条混合信息流", x: 150, y: 45, w: 140, h: 40 },
      { id: "rank", label: "权威性分层", x: 335, y: 45, w: 110, h: 40 },
      { id: "score", label: "相关性打分", x: 335, y: 155, w: 110, h: 40 },
      { id: "budget", label: "token 预算取舍", x: 335, y: 265, w: 130, h: 40 },
      { id: "digest", label: "事实摘要", x: 150, y: 265, w: 110, h: 40, end: true },
    ],
    edges: [
      { from: "corpus", to: "rank" },
      { from: "rank", to: "score" },
      { from: "score", to: "budget" },
      { from: "budget", to: "digest" },
    ],
    steps: [
      {
        title: "上下文压缩总览",
        desc: "50 条混合信息在 token 预算内压缩为事实摘要——有限认知资源下的战略清醒。",
        nodes: [],
        edges: [],
        ideology: "去伪存真、把握主要矛盾",
      },
      {
        title: "语料涌入",
        desc: "政策原文 6 / 官媒解读 12 / 市场传闻 20 / 情绪帖 12——四类信息源混合涌入。",
        nodes: ["corpus"],
        edges: [],
        messages: [
          { role: "user", detail: "50 条信息流，压缩成预算内摘要", colorClass: USER },
        ],
        ideology: "权威性分层（政策原文>官媒解读>市场传闻>情绪帖）→ 信息源也有「政治性权重」",
      },
      {
        title: "权威性分层",
        desc: "逐条标注来源层级：政策原文权重最高，情绪帖最低——政治判断力的信息科学版。",
        nodes: ["rank"],
        edges: ["corpus->rank"],
        messages: [
          { role: "tool", detail: "50 条均已附权威性层级标签", colorClass: TOOL },
        ],
        ideology: "政治判断力——信息源也有「政治性权重」",
      },
      {
        title: "相关性打分",
        desc: "围绕久期配置主线打分：政策原文 6/6、解读 9/12、传闻 4/20、情绪帖 0/12。",
        nodes: ["score"],
        edges: ["rank->score"],
        messages: [
          { role: "result", detail: "相关度因来源层级显著分化", colorClass: RESULT },
        ],
        ideology: "相关性打分 → 去粗取精——围绕主要矛盾筛选信息",
      },
      {
        title: "预算内取舍",
        desc: "预算只保留 10 条：全部政策原文 + 高相关解读，情绪渲染一律剔除。",
        nodes: ["budget"],
        edges: ["score->budget"],
        messages: [
          { role: "assistant", detail: "保留原文与关键点位，剔除情绪帖", colorClass: ASSISTANT },
        ],
        ideology: "token 预算约束下的取舍 → 有限认知资源下的战略清醒与政治定力",
      },
      {
        title: "事实摘要",
        desc: "摘要 10 条：政策要点与关键点位齐备，零情绪表述——十六字诀就是人工压缩算法。",
        nodes: ["digest"],
        edges: ["budget->digest"],
        messages: [
          { role: "result", detail: "摘要：10 条事实，零情绪表述", colorClass: RESULT },
        ],
        ideology: "去噪摘要 → 去伪存真、由此及彼、由表及里",
      },
    ],
  },

  s5: {
    caption: "subagents.parallel(排查 E1—E5); chief.arbitrate(分歧)",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "chief", label: "主 Agent·拆解", x: 125, y: 45, w: 130, h: 40 },
      { id: "corp", label: "公司金融部", x: 335, y: 45, w: 120, h: 40 },
      { id: "risk", label: "风险管理部", x: 335, y: 155, w: 120, h: 40 },
      { id: "ops", label: "运营管理部", x: 335, y: 265, w: 120, h: 40 },
      { id: "judge", label: "汇总裁决", x: 125, y: 155, w: 110, h: 40 },
      { id: "final", label: "集中裁决·风控优先", x: 125, y: 265, w: 150, h: 40, end: true },
    ],
    edges: [
      { from: "chief", to: "corp" },
      { from: "chief", to: "risk" },
      { from: "chief", to: "ops" },
      { from: "corp", to: "judge" },
      { from: "risk", to: "judge", label: "E2 相反结论" },
      { from: "ops", to: "judge" },
      { from: "judge", to: "final" },
    ],
    steps: [
      {
        title: "多智能体协作总览",
        desc: "三个子智能体并行排查 E1—E5，分歧提交主 Agent 集中裁决——民主集中制的工程实现。",
        nodes: [],
        edges: [],
        ideology: "集体主义与组织纪律性",
      },
      {
        title: "主 Agent 拆解",
        desc: "任务拆为三个并行任务包：E1/E3/E5→公司金融部，E2/E4→风险管理部，流水核对→运营管理部。",
        nodes: ["chief"],
        edges: [],
        messages: [
          { role: "assistant", detail: "拆解：三个部门并行排查", colorClass: ASSISTANT },
        ],
        ideology: "任务隔离（独立 messages 列表）→ 分工负责——各司其职、各尽其责",
      },
      {
        title: "并行排查",
        desc: "三个子智能体独立 messages 并行取证——互不干扰，各自对自己条线的结论负责。",
        nodes: ["corp", "risk", "ops"],
        edges: ["chief->corp", "chief->risk", "chief->ops"],
        messages: [
          { role: "tool", detail: "并行执行：三个任务包同时推进", colorClass: TOOL },
        ],
        ideology: "并行执行 → 协同作战——整体合力大于个体之和",
      },
      {
        title: "协议通信",
        desc: "结论以协议消息回传：sender / intent / payload——组织的协议层与共同语言。",
        nodes: ["corp", "risk", "ops"],
        edges: [],
        messages: [
          { role: "result", detail: "协议消息 ×3：结论回传主 Agent", colorClass: RESULT },
        ],
        ideology: "协议通信（sender/intent/payload/requires_consensus）→ 民主集中制——组织的协议层",
      },
      {
        title: "E2 分歧显性化",
        desc: "公司金融部对 E2 初判「通过」，风险管理部判定「不通过」——requires_consensus 触发，分歧上交。",
        nodes: ["risk", "judge"],
        edges: ["risk->judge"],
        messages: [
          { role: "result", detail: "E2 相反结论，requires_consensus=true", colorClass: RESULT },
        ],
        ideology: "民主：充分讨论——分歧不掩盖、上交裁决",
      },
      {
        title: "集中裁决",
        desc: "主 Agent 采纳风险管理部意见：E2 不予准入——风控意见优先，集中统一领导。",
        nodes: ["judge", "final"],
        edges: ["judge->final"],
        messages: [
          { role: "assistant", detail: "裁决：采纳风控意见，E2 不予准入", colorClass: ASSISTANT },
        ],
        ideology: "主 Agent 集中裁决 → 集中统一领导——「充分讨论、集中裁决」",
      },
      {
        title: "协同闭环",
        desc: "排查完成：三个条线分头取证、统一口径输出——组织合力大于个体之和。",
        nodes: ["final"],
        edges: [],
        messages: [
          { role: "result", detail: "排查闭环：整体合力 > 个体之和", colorClass: RESULT },
        ],
        ideology: "集体主义：组织共同体的合力",
      },
    ],
  },

  s6: {
    caption: "scan() → 目录常驻 → 匹配 → 注入 → 执行",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "lib", label: "组织技能库", x: 150, y: 45, w: 120, h: 40 },
      { id: "scan", label: "扫描·目录常驻", x: 335, y: 45, w: 140, h: 40 },
      { id: "match", label: "按需匹配", x: 335, y: 155, w: 110, h: 40 },
      { id: "inject", label: "注入提示词", x: 335, y: 265, w: 120, h: 40 },
      { id: "exec", label: "新人执行·尺度一致", x: 150, y: 265, w: 150, h: 40, end: true },
    ],
    edges: [
      { from: "lib", to: "scan" },
      { from: "scan", to: "match" },
      { from: "match", to: "inject" },
      { from: "inject", to: "exec" },
    ],
    steps: [
      {
        title: "知识沉淀总览",
        desc: "骨干经验固化为技能模块，新人按需加载——把个人经验转化为组织能力。",
        nodes: [],
        edges: [],
        ideology: "学习型党组织建设",
      },
      {
        title: "组织知识沉淀",
        desc: "展业经验、风险识别清单、合规审查要点固化为三个 SKILL.md——骨干的「绝活」入库。",
        nodes: ["lib"],
        edges: [],
        messages: [
          { role: "user", detail: "新人首次独立贷前审查", colorClass: USER },
        ],
        ideology: "技能模块（SKILL.md）→ 组织知识沉淀——把个人经验转化为组织能力",
      },
      {
        title: "目录常驻",
        desc: "扫描生成索引常驻上下文：描述与触发词一览——索引在手、用时调取。",
        nodes: ["scan"],
        edges: ["lib->scan"],
        messages: [
          { role: "tool", detail: "scan：3 个技能模块，索引常驻", colorClass: TOOL },
        ],
        ideology: "目录常驻、全文按需注入 → 知识管理——索引在手、用时调取",
      },
      {
        title: "按需匹配",
        desc: "任务「贷前审查」命中两项技能：风险识别清单 + 合规审查要点——急用先学。",
        nodes: ["match"],
        edges: ["scan->match"],
        messages: [
          { role: "result", detail: "命中：风险识别清单 + 合规审查要点", colorClass: RESULT },
        ],
        ideology: "按需加载（load on demand）→ 学习型组织——学以致用、急用先学",
      },
      {
        title: "注入执行",
        desc: "技能全文按需注入提示词，新人按骨干尺度执行——结论与全系统一致。",
        nodes: ["inject", "exec"],
        edges: ["match->inject", "inject->exec"],
        messages: [
          { role: "tool", detail: "注入全文 → 执行 → 尺度一致", colorClass: TOOL },
        ],
        ideology: "记忆固化与复用 → 红色基因与专业能力的代际传承",
      },
      {
        title: "学习型组织",
        desc: "把骨干的「绝活」变成组织的「标配」——这就是学习型党组织的工程实现。",
        nodes: ["exec"],
        edges: ["inject->exec"],
        messages: [
          { role: "assistant", detail: "绝活 → 标配：经验完成了代际传递", colorClass: ASSISTANT },
        ],
        ideology: "学习型党组织：传帮带的数字化",
      },
    ],
  },

  s7: {
    caption: "assert(文案, 必须包含风险提示) → 失败 → 错题本 → 前置加载",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "gen", label: "生成营销文案", x: 150, y: 45, w: 130, h: 40 },
      { id: "assert", label: "断言校验", x: 335, y: 45, w: 110, h: 40 },
      { id: "pass", label: "通过·成功静默", x: 335, y: 155, w: 140, h: 40 },
      { id: "fail", label: "失败发声", x: 150, y: 155, w: 110, h: 40, danger: true },
      { id: "book", label: "记入错题本", x: 150, y: 265, w: 120, h: 40 },
      { id: "preload", label: "前置加载", x: 335, y: 265, w: 110, h: 40, end: true },
    ],
    edges: [
      { from: "gen", to: "assert" },
      { from: "assert", to: "pass", label: "含风险提示" },
      { from: "assert", to: "fail", label: "F1/F2 违规" },
      { from: "fail", to: "book" },
      { from: "book", to: "preload" },
      { from: "pass", to: "gen", via: "right" },
    ],
    steps: [
      {
        title: "闭环审计总览",
        desc: "断言「必须包含风险提示」：批评和自我批评的工程化——反馈不是否定，而是优化的必要条件。",
        nodes: [],
        edges: [],
        ideology: "批评和自我批评的闭环机制",
      },
      {
        title: "生成 + 断言",
        desc: "生成营销文案并执行断言：必须包含风险提示——制度红线自动检验。",
        nodes: ["gen", "assert"],
        edges: ["gen->assert"],
        messages: [
          { role: "tool", detail: "生成文案 → 执行断言", colorClass: TOOL },
        ],
        ideology: "断言（assertion）→ 批评和自我批评——反馈不是否定，而是系统优化的必要条件",
      },
      {
        title: "成功静默",
        desc: "风险提示在位，断言通过——成功路径静默通过，不打扰正常流程。",
        nodes: ["pass"],
        edges: ["assert->pass"],
        messages: [
          { role: "result", detail: "断言通过：风险提示在位", colorClass: RESULT },
        ],
        ideology: "成功静默——正常流程零打扰",
      },
      {
        title: "失败发声",
        desc: "反面用例 F1「夸大收益」触雷：AssertionError——失败立即发声，问题显性化。",
        nodes: ["fail"],
        edges: ["assert->fail"],
        messages: [
          { role: "result", detail: "F1 夸大收益 → AssertionError", colorClass: RESULT },
        ],
        ideology: "异常捕获与日志回溯 → 审计监督——问题显性化、责任可追溯",
      },
      {
        title: "记入错题本",
        desc: "失败用例 F1、F2 自动写入错题本——责任可追溯，教训沉淀为组织资产。",
        nodes: ["book"],
        edges: ["fail->book"],
        messages: [
          { role: "tool", detail: "F1/F2 写入错题本", colorClass: TOOL },
        ],
        ideology: "审计监督：问题显性化、责任可追溯",
      },
      {
        title: "前置加载·闭环",
        desc: "后续运行前置加载错题本：同类错误不再重犯——批评是为了更好地前进。",
        nodes: ["preload"],
        edges: ["book->preload"],
        messages: [
          { role: "assistant", detail: "下次生成前先检索错题本", colorClass: ASSISTANT },
        ],
        ideology: "闭环：反馈回流——系统优化的必要条件",
      },
    ],
  },

  s8: {
    caption: "sandbox() && worktree() && whitelist() —— 任一层不通过即阻断",
    viewBox: "0 0 500 440",
    nodes: [
      { id: "op", label: "越权导出请求", x: 150, y: 45, w: 130, h: 40, danger: true },
      { id: "sandbox", label: "环境沙箱", x: 335, y: 45, w: 110, h: 40, danger: true },
      { id: "worktree", label: "工作树隔离", x: 335, y: 155, w: 120, h: 40, danger: true },
      { id: "whitelist", label: "协议白名单", x: 335, y: 265, w: 120, h: 40, danger: true },
      { id: "audit", label: "告警·审计日志", x: 150, y: 155, w: 140, h: 40 },
      { id: "blocked", label: "操作阻断", x: 150, y: 265, w: 110, h: 40, end: true },
    ],
    edges: [
      { from: "op", to: "sandbox" },
      { from: "sandbox", to: "worktree" },
      { from: "worktree", to: "whitelist" },
      { from: "whitelist", to: "audit" },
      { from: "audit", to: "blocked" },
    ],
    steps: [
      {
        title: "三层护栏总览",
        desc: "「导出客户数据」属高风险操作：环境沙箱、工作树隔离、协议白名单三层校验，任一层不通过即阻断。",
        nodes: [],
        edges: [],
        ideology: "底线思维与廉洁从业——把权力关进制度的笼子",
      },
      {
        title: "越权请求",
        desc: "Agent 试图将客户数据导出到个人目录——三层隔离校验启动。",
        nodes: ["op"],
        edges: [],
        messages: [
          { role: "user", detail: "导出客户数据到个人目录", colorClass: USER },
        ],
        ideology: "底线思维：任何越权操作都必须被制度看见",
      },
      {
        title: "第一层：环境沙箱",
        desc: "目标路径位于个人目录禁区——环境沙箱拦截：公与私的隔离。",
        nodes: ["sandbox"],
        edges: ["op->sandbox"],
        messages: [
          { role: "result", detail: "环境沙箱拦截：目标路径位于禁区", colorClass: RESULT },
        ],
        ideology: "环境沙箱 → 公与私的隔离",
      },
      {
        title: "第二层：工作树隔离",
        desc: "高风险操作未在隔离环境中执行——工作树隔离拦截：权与钱的隔离。",
        nodes: ["worktree"],
        edges: ["sandbox->worktree"],
        messages: [
          { role: "result", detail: "工作树隔离拦截：未在隔离环境执行", colorClass: RESULT },
        ],
        ideology: "工作树隔离 → 权与钱的隔离——高风险操作在制度轨道上运行",
      },
      {
        title: "第三层：协议白名单",
        desc: "「导出客户数据」不在 ALLOWED_APIS——协议白名单拦截：亲与清的隔离。",
        nodes: ["whitelist"],
        edges: ["worktree->whitelist"],
        messages: [
          { role: "result", detail: "协议白名单拦截：接口未获授权", colorClass: RESULT },
        ],
        ideology: "协议层白名单 → 亲与清的隔离——法无授权不可为",
      },
      {
        title: "失败发声·审计留痕",
        desc: "越权导出被三层护栏逐级阻断：即时告警、写入审计日志——操作人、时间、路径、层级全记录。",
        nodes: ["audit", "blocked"],
        edges: ["whitelist->audit", "audit->blocked"],
        messages: [
          { role: "system", detail: "告警：事件已写入审计日志", colorClass: SYSTEM },
        ],
        ideology: "「成功静默、失败发声」日志策略 → 合规无小事、风险零容忍",
      },
      {
        title: "阻断完成",
        desc: "操作阻断，风险清零——约束不是束缚，而是对从业者的保护。",
        nodes: ["blocked"],
        edges: ["audit->blocked"],
        messages: [
          { role: "assistant", detail: "三层护栏全部生效，操作阻断", colorClass: ASSISTANT },
        ],
        ideology: "把权力关进制度的笼子——约束不是束缚，而是保护",
      },
    ],
  },
};
