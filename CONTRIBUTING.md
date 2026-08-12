# 贡献指南 / Contributing

欢迎在保持成熟模板与许可证边界的前提下贡献代码。修改应遵循“标准模板 + 明确变化”，不要用新的示例应用替换现有成品。

Contributions are welcome when they preserve the mature baseline and its license boundaries. Changes should follow the baseline-plus-explicit-delta rule; do not replace the finished template with a new example application.

## 修改前 / Before Editing

请先阅读 `SKILL.md`、`references/architecture.md` 和 `references/licensing.md`，确认改动所属模块以及是否影响 Rapfi、权重文件或分发方式。

Read `SKILL.md`, `references/architecture.md`, and `references/licensing.md` first. Identify the affected module and whether the change touches Rapfi, network files, or redistribution.

## 第三方边界 / Third-Party Boundary

- 不要把 Rapfi 源码放在本项目 MIT 许可证下。 / Do not place Rapfi source under the project's MIT license.
- 不要删除 `RAPFI-GPLv3.txt`、`AUTHORS`、`RAPFI-SOURCE.md` 或网络许可证声明。 / Do not remove `RAPFI-GPLv3.txt`, `AUTHORS`, `RAPFI-SOURCE.md`, or the network license notice.
- 修改 Rapfi 时继续使用 GPLv3，并记录对应上游源码。 / Keep modified Rapfi code under GPLv3 and record its corresponding source.
- 不要把 Rapfi 描述为本项目原创或官方产品。 / Do not present Rapfi as authored by this project or as an official product.
- 添加依赖前检查其许可证。 / Check every new dependency's license before adding it.

## 验证 / Validation

先运行与改动直接相关的测试，再执行严格分发审计和完整项目验证。拉取请求应说明受影响行为和实际验证结果。

Run focused tests first, followed by the strict distribution audit and full project verification. Pull requests should state the affected behavior and actual verification results.

```powershell
node scripts/audit-distribution.mjs assets/gomoku-template --strict
node <skill-dir>/scripts/verify-project.mjs <project> --full
```
