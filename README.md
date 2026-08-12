# gomoku-app

`gomoku-app` 是一个可长期复用的 Codex Skill，内置已经过多轮修改与验证的“落子复盘 PV5.2”五子棋 PWA。它会直接复制成熟模板、安装锁定依赖并执行验证，而不是每次从零重新生成产品。

`gomoku-app` is a reusable Codex Skill containing the verified Luozi Review PV5.2 Gomoku PWA. It copies the mature template, installs locked dependencies, and verifies the result instead of regenerating the product from scratch.

## 使用 Skill / Use the Skill

将 Skill 安装到 Codex Skills 目录后，“做一个五子棋软件”“创建一个五子棋网页”“帮我做个五子棋游戏”“修改五子棋的教练模式”或 `Gomoku app` 等请求都可以自动匹配。默认创建时不进行冗长需求访谈，用户明确提出的改动则按照“标准模板 + 指定变化”执行。

After installation in the Codex Skills directory, requests such as “create a Gomoku app,” “make a Gobang web app,” or “improve the coach mode” can invoke the Skill implicitly. Default creation skips a lengthy requirements interview, while explicit changes follow the baseline-plus-delta rule.

```powershell
node <skill-dir>/scripts/create-project.mjs <destination>
```

## 模板能力 / Template Features

- 15x15 交点棋盘与响应式 PWA 界面。
- 可执黑、执白，或自由控制黑白双方进行摆棋复盘。
- 本地 Rapfi 引擎、自动应手与逐手实时分析。
- 按走法偏差扣分、未来五手最佳路线、胜率趋势与问题手列表。
- 先判断棋形再用大白话解释的初学者教练模式。
- SGF/RENJU 导入、逐手导航与完整复盘。
- Windows、Linux 和 macOS Apple Silicon 引擎文件。

- A responsive PWA with a 15x15 intersection-based board.
- Human black, human white, and free two-color review modes.
- Local Rapfi integration, automatic replies, and live per-move analysis.
- Deviation-based penalties, five-ply principal variation, trend display, and an issue list.
- Beginner-oriented coaching that derives tactical evidence before explaining it in plain language.
- SGF/RENJU import, move navigation, and full-game review.
- Engine files for Windows, Linux, and macOS Apple Silicon.

## 一键创建 / One-Command Creation

创建脚本会复制干净模板，排除缓存和旧构建产物，安装依赖，并运行完整项目验证。若只想检查分发内容，可以运行严格审计。

The creation script copies a clean template, excludes caches and old build output, installs dependencies, and runs full verification. Use the strict audit to validate redistribution contents independently.

```powershell
node scripts/audit-distribution.mjs assets/gomoku-template --strict
```

## 许可证边界 / License Boundary

这是一个多许可证分发项目。根目录 MIT 许可证只适用于本项目原创的 Skill、脚本、文档和应用代码，不适用于 Rapfi 或其权重文件。

This is a multi-license distribution. The root MIT license applies only to the original Skill, scripts, documentation, and application code; it does not cover Rapfi or its network files.

| 组件 / Component | 许可证 / License | 来源与说明 / Source and notice |
| --- | --- | --- |
| 原创 Skill、脚本、文档和应用文件 / Original Skill, scripts, docs, and app files | MIT | `LICENSE` |
| Rapfi 引擎源码与二进制 / Rapfi source and binaries | GPL-3.0-only | `RAPFI-SOURCE.md`, `RAPFI-GPLv3.txt`, `work/rapfi-engine/AUTHORS` |
| Rapfi 网络权重与配置 / Rapfi network weights and configuration | CC0-1.0（按上游声明 / as published upstream） | `THIRD-PARTY-NOTICES.md`, `LICENSES/CC0-1.0.txt` |
| 软件包依赖 / Package dependencies | 各自上游许可证 / Their upstream licenses | `package.json`, `pnpm-lock.yaml` |

Rapfi 是独立的上游项目。本仓库与 Rapfi 作者没有隶属、赞助或官方认可关系；Rapfi 名称仅用于准确标识随附的第三方引擎。

Rapfi is an independent upstream project. This repository is not affiliated with, sponsored by, or endorsed by the Rapfi authors; the name Rapfi is used only to identify the bundled third-party engine.

## 发布检查 / Release Checks

发布前请阅读 `THIRD-PARTY-NOTICES.md`、`RAPFI-SOURCE.md` 和 `RELEASE-CHECKLIST.md`，再运行严格分发审计。审计会检查许可证边界、上游来源、作者声明、文件清单、SHA256 记录、绝对路径和缓存文件。出现错误或来源未验证警告时不要发布。

Before publication, read `THIRD-PARTY-NOTICES.md`, `RAPFI-SOURCE.md`, and `RELEASE-CHECKLIST.md`, then run the strict distribution audit. It checks license boundaries, upstream provenance, author notices, file inventory, SHA256 records, absolute paths, and cache files. Do not publish while it reports errors or unresolved provenance warnings.

## 免责声明 / Disclaimer

本仓库提供软件和许可证维护信息，不构成法律意见。若涉及商业分发、重新许可或第三方资产权利不确定，请向相应权利人或合格法律专业人士确认。为避免歧义，随附 MIT、GPLv3 与 CC0 许可证的官方原文具有约束力，本文中文说明仅用于帮助理解。

This repository provides software and licensing information for maintenance and is not legal advice. For commercial distribution, relicensing, or uncertainty about third-party rights, consult the relevant rights holder or qualified counsel. To avoid ambiguity, the included official MIT, GPLv3, and CC0 license texts control; the Chinese explanations are informational only.
