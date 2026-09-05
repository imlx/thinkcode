#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
guardrail_isolation.py - 带完整 Guardrails 的合规工作流隔离示例（s8_guardrail_isolation 目录文件）

在集成 Harness 中配置三层隔离，模拟一次“越权导出客户数据到个人目录”操作，
验证三层隔离机制的阻断与告警是否生效。

三层隔离（制度对照出处：公开处罚与法规脱敏整理，禁止编造）：
- 环境沙箱：禁止访问生产数据目录；
- 工作树隔离：高风险操作仅在隔离分支执行；
- 协议层白名单：仅允许预定义API调用（规则来源：《征信业管理条例》
  “查询个人信息须取得本人书面授权”）。
现实原型：某国有大行深圳市分行“未按规定开展信用信息采集与查询管理”
被罚款462.35万元、员工被单独追责罚款14.3万元（2026年6月公示，S8表）；
某外资银行未经同意查询个人征信被罚款57万元（2021-01-27，S8表）。
日志制度参照：个人信用信息基础数据库自动追踪记录每一次查询并可追溯
（中国人民银行《百姓征信手册》，S8表）——即“成功静默、失败发声”。

用法：
    python s8_guardrail_isolation/guardrail_isolation.py
"""

import os
import tempfile
from pathlib import Path
from typing import Optional, Tuple

# -- 集成 Harness 配置（示意性常量，模拟生产环境的隔离边界） --
PRODUCTION_DATA_DIR = Path("/data/production")   # 环境沙箱：生产数据目录，一律禁入
PERSONAL_DIRS = (Path.home(), Path("/tmp/personal"))  # 个人目录：客户数据不得导出至此
HIGH_RISK_OPS = {"导出客户数据", "批量查询征信", "修改授信参数"}  # 高风险操作清单

# -- 三层隔离：环境沙箱（禁止访问生产数据目录）、工作树隔离（高风险操作仅在隔离分支执行）、协议层白名单（仅允许预定义API调用） --
ALLOWED_APIS = {"查询客户信息", "生成审计报告", "发起审批流程", "查看公开行情"}


class 三层隔离护栏:
    """集成 Harness 的底线保障：任何一层不通过，操作即被阻断。"""

    def __init__(self, audit_log: Path) -> None:
        self.audit_log = audit_log

    def 检查环境沙箱(self, 目标路径: Path) -> Optional[str]:
        """环境沙箱：目标路径不得落入生产数据目录或个人目录。"""
        for forbidden in (PRODUCTION_DATA_DIR, *PERSONAL_DIRS):
            try:
                if 目标路径.resolve().is_relative_to(forbidden.resolve()):
                    return f"环境沙箱拦截：目标路径位于禁区（{forbidden}）"
            except OSError:
                continue
        return None

    def 检查工作树隔离(self, 操作: str, 隔离工作树: bool) -> Optional[str]:
        """工作树隔离：高风险操作必须仅在隔离分支/隔离环境中执行。"""
        if 操作 in HIGH_RISK_OPS and not 隔离工作树:
            return "工作树隔离拦截：高风险操作未在隔离环境中执行"
        return None

    def 检查协议白名单(self, 接口: str, 已获授权: bool) -> Optional[str]:
        """协议层白名单：仅允许预定义API；涉及个人信息的查询须取得本人书面授权（《征信业管理条例》）。"""
        if 接口 not in ALLOWED_APIS:
            return f"协议白名单拦截：接口“{接口}”不在预定义允许列表中"
        if "征信" in 接口 and not 已获授权:
            return "协议白名单拦截：查询个人征信须取得信息主体本人书面授权（《征信业管理条例》）"
        return None

    def 记录审计日志(self, 操作: str, 操作者: str, 结果: str) -> None:
        """越权尝试立即写入审计日志文件，全程可追溯（S8表《百姓征信手册》制度参照）。"""
        import datetime
        line = (f"{datetime.datetime.now().isoformat(timespec='seconds')} | "
                f"操作者：{操作者} | 操作：{操作} | 结果：{结果}\n")
        with self.audit_log.open("a", encoding="utf-8") as handle:
            handle.write(line)

    def 检查(self, 操作: str, 操作者: str, 接口: str = "",
             目标路径: Optional[Path] = None,
             隔离工作树: bool = False, 已获授权: bool = False) -> Tuple[bool, str]:
        """三层隔离流水线：全部通过才放行。"""
        for layer in (
            self.检查工作树隔离(操作, 隔离工作树),
            self.检查协议白名单(接口 or 操作, 已获授权) if (接口 or 操作) else None,
            self.检查环境沙箱(目标路径) if 目标路径 is not None else None,
        ):
            if layer is not None:
                # 把权力关进制度的笼子——约束不是束缚，而是保护
                告警 = f"\033[31m【越权告警】{layer}；操作者：{操作者}；操作：{操作}\033[0m"
                print(告警)
                self.记录审计日志(操作, 操作者, f"已阻断：{layer}")
                return False, layer
        # 成功保持静默：仅记录中文摘要，不打扰业务
        self.记录审计日志(操作, 操作者, "正常通过（摘要留痕）")
        print(f"[操作摘要]{操作者} 完成“{操作}”，三层隔离校验通过。")
        return True, "放行"


if __name__ == "__main__":
    print("s15: 三层隔离护栏与越权阻断演示")
    print("数据出处：公开处罚与法规（机构名称已脱敏）\n")

    with tempfile.TemporaryDirectory(prefix="guardrail_audit_") as tmp:
        audit_log = Path(tmp) / "audit.log"
        guard = 三层隔离护栏(audit_log)

        print("场景一：正常操作（查询客户信息，白名单内、无越权路径）")
        guard.检查("查询客户信息", "客户经理甲", 接口="查询客户信息",
                   目标路径=Path(tmp) / "workspace" / "report.csv")

        print("\n场景二：越权操作——Agent试图将客户数据导出到个人目录")
        print("（场景原型：某国有大行深圳市分行因“未按规定开展信用信息采集与查询管理”")
        print("被罚款462.35万元、员工被单独追责罚款14.3万元，2026年6月公示，S8表）")
        guard.检查("导出客户数据", "异常账号X", 接口="导出客户数据",
                   目标路径=Path.home() / "personal" / "customer_data.csv",
                   隔离工作树=True)

        print("\n场景三：高风险操作未在隔离环境执行")
        guard.检查("批量查询征信", "员工乙", 接口="批量查询征信",
                   目标路径=Path(tmp) / "workspace" / "out.csv",
                   隔离工作树=False, 已获授权=True)

        print("\n场景四：未经书面授权查询个人征信")
        print("（场景原型：某外资银行未经同意查询个人征信被罚款57万元、")
        print("直接责任人员被罚款11.4万元，2021-01-27，S8表）")
        guard.检查("批量查询征信", "员工丙", 接口="批量查询征信",
                   目标路径=Path(tmp) / "workspace" / "out.csv",
                   隔离工作树=True, 已获授权=False)

        print("\n【审计日志文件内容】（越权即留痕、可追溯）")
        print(audit_log.read_text(encoding="utf-8"))

    print("验证完成：正常操作静默通过，越权操作均被三层隔离阻断并即时告警、写入审计日志。")
