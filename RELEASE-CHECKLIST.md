# GitHub 发布检查表 / GitHub Release Checklist

公开 Skill、模板或发布包前，请逐项完成本检查表。以下中文说明用于帮助维护，随附许可证官方原文具有约束力。

Complete this checklist before publishing the Skill, template, or a release archive. The Chinese text assists maintenance; the included official license texts control.

## 许可证与来源 / License and Provenance

- [ ] 原创项目文件保留根目录 `LICENSE`。 / The root `LICENSE` remains present for original project files.
- [ ] `THIRD-PARTY-NOTICES.md` 将 Rapfi 单独列为第三方组件。 / `THIRD-PARTY-NOTICES.md` identifies Rapfi separately.
- [ ] `RAPFI-GPLv3.txt` 和 Rapfi `AUTHORS` 保持存在且未被擅自改写。 / `RAPFI-GPLv3.txt` and Rapfi `AUTHORS` remain present and unaltered.
- [ ] `RAPFI-SOURCE.md` 指向准确的上游源码、版本和许可证。 / `RAPFI-SOURCE.md` points to the correct upstream source, version, and license.
- [ ] `rapfi-assets.json` 记录实际版本、来源和待发布文件的 SHA256。 / `rapfi-assets.json` records the actual version, provenance, and SHA256 values.
- [ ] 只有来自官方 Rapfi 网络仓库的权重才按其 CC0-1.0 声明描述。 / Only weights from the official Rapfi network repository are described under its CC0-1.0 notice.
- [ ] README、名称和发布说明均不暗示 Rapfi 官方认可。 / No README, name, or release note implies Rapfi endorsement.
- [ ] 修改 Rapfi 时标明修改和日期，并提供对应修改源码。 / Modified Rapfi code is marked with changes and dates, and corresponding source is available.

## 自动检查 / Automated Checks

从 Skill 根目录运行严格审计，并在可用时运行 Skill Creator 的 `quick_validate.py`。

Run the strict audit from the Skill root and run Skill Creator's `quick_validate.py` when available.

```powershell
node scripts/audit-distribution.mjs assets/gomoku-template --strict
```

对生成项目运行完整验证与严格审计。任何命令报错，或出现未解决的二进制来源警告时，都不要发布。

Run full verification and the strict audit against a generated project. Do not publish if either command fails or an unresolved binary provenance warning remains.

```powershell
node <skill-dir>/scripts/verify-project.mjs <project> --full
node <skill-dir>/scripts/audit-distribution.mjs <project> --strict
```

## 仓库卫生 / Repository Hygiene

- [ ] 不包含密钥、令牌、本地用户名或绝对机器路径。 / No secrets, tokens, local usernames, or absolute machine paths.
- [ ] 不包含 `node_modules`、构建输出、日志或临时文件。 / No `node_modules`, build output, logs, or temporary files.
- [ ] 所有可执行文件和模型文件均列入完整性清单。 / All executables and model files are listed in the integrity manifest.
- [ ] `git diff --check` 通过。 / `git diff --check` passes.
- [ ] 所有文件符合 GitHub 普通文件大小限制，或已有明确的 LFS/Release 方案。 / Files fit GitHub's normal size limits or have an intentional LFS/Release plan.
- [ ] 教练测试、lint、构建和 Rapfi 冒烟测试通过。 / Coach tests, lint, build, and the Rapfi smoke test pass.

## 发布说明模板 / Release Notes Template

```text
本版本包含独立的 gomoku-app Skill 与落子复盘 PWA。
This release contains the independent gomoku-app Skill and Luozi Review PWA.

第三方组件 / Third-party components:
- Rapfi 0.43.01: GPLv3, https://github.com/dhbloo/rapfi
- Rapfi network files: CC0-1.0, https://github.com/dhbloo/rapfi-networks

本项目与 Rapfi 作者不存在隶属或认可关系。
This project is not affiliated with or endorsed by the Rapfi authors.

完整记录见 THIRD-PARTY-NOTICES.md 与 RAPFI-SOURCE.md。
See THIRD-PARTY-NOTICES.md and RAPFI-SOURCE.md for the complete record.
```
