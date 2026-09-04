# 案例 s7：Feedback Layer——批评和自我批评的闭环机制

合规审计复盘：营销文案断言「必须包含风险提示」，反面用例 F1 夸大收益、F2 风险揭示不足；失败自动记入错题本（lessons_memory.py，写入本目录 memory/lessons.md）并在后续运行前置加载。反面用例为公开消保通报脱敏编号。

## 思政映射

- 断言（assertion）→ 批评和自我批评：反馈不是否定，而是优化的必要条件
- 异常捕获与日志回溯 → 审计监督：问题显性化、责任可追溯

## 运行

```bash
python s7_audit_repair/audit_repair.py
```
