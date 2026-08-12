# Rapfi 源码与来源记录 / Rapfi Source and Provenance Record

本文件是 `assets/gomoku-template/work/rapfi-engine/` 中 Rapfi 二进制的再分发记录。Rapfi 是独立的 GPLv3 第三方组件，不属于根目录 MIT 许可证的授权范围。

This file is the redistribution record for Rapfi binaries in `assets/gomoku-template/work/rapfi-engine/`. Rapfi is a separate GPLv3 third-party component and is not covered by the root MIT license.

## 上游身份 / Upstream Identity

- 项目 / Project: Rapfi Gomoku/Renju engine
- 上游仓库 / Repository: https://github.com/dhbloo/rapfi
- 上游许可证 / License: GNU GPLv3
- 模板引擎版本 / Template engine version: 0.43.01
- 上游发布版本 / Release reference: https://github.com/dhbloo/rapfi/releases/tag/250615
- 上游源码 / Source reference: https://github.com/dhbloo/rapfi/tree/250615
- GitHub 发布页所示提交 / Commit shown on release page: `1be1551`
- 官方发布包 / Official release asset: `Rapfi-engine.7z`
- 官方发布包 SHA256 / Official release asset SHA256: `1a3e24024062a153ac079060ee9589a37c6bdd1ecc54fed3908793c519594e05`
- 作者与致谢 / Authors: `assets/gomoku-template/work/rapfi-engine/AUTHORS`
- 许可证原文 / Full license text: `assets/gomoku-template/RAPFI-GPLv3.txt`

随附可执行文件报告 Rapfi `0.43.01` 版本。各提取文件的 SHA256 记录在 `assets/gomoku-template/work/rapfi-engine/rapfi-assets.json` 中；这些哈希用于完整性检查，不能代替与官方发布包比对。

The bundled executables report Rapfi version `0.43.01`. SHA256 values for extracted files are recorded in `assets/gomoku-template/work/rapfi-engine/rapfi-assets.json`; these hashes support integrity checks but do not replace comparison with the official release archive.

2026-08-12 已完成来源验证：本地 `Rapfi-engine.7z` 的 SHA256 与官方发布页一致，从该包提取的 18 个文件与模板文件逐字节一致。因此当前模板使用官方 Rapfi 0.43.01 发布包，不是本地重命名或修改的引擎二进制。

Provenance was verified on 2026-08-12: the local `Rapfi-engine.7z` SHA256 matches the official release page, and all 18 extracted files match the template byte-for-byte. The current template therefore uses the official Rapfi 0.43.01 release package, not a locally renamed or modified binary.

## 对应源码 / Corresponding Source

上游 Rapfi 仓库包含构建引擎所需的源码和构建文件。分发可执行文件时，应将本记录与二进制一同保留，并保持上游源码链接可访问。若重新构建或替换二进制，发布前必须更新版本、标签或提交、构建选项和哈希。

The upstream Rapfi repository contains the source and build files needed to build the engine. Keep this record with distributed binaries and keep the upstream source pointer available. If a binary is rebuilt or replaced, update the version, tag or commit, build options, and hashes before publication.

仅凭可执行文件中的版本字符串不能证明其来自特定官方发布包。本地构建版本不得描述为“官方 Rapfi 发布二进制”。

An embedded version string alone does not prove that a binary came from a specific official release asset. A locally built binary must not be described as an official Rapfi release binary.

## 随附平台版本 / Included Variants

- Windows: SSE, AVX2, AVXVNNI, AVX512, AVX512VNNI
- Linux: SSE, AVX2, AVXVNNI, AVX512, AVX512VNNI
- macOS: Apple Silicon

桥接程序会选择兼容的二进制，并在可用时回退到 SSE。原生引擎不嵌入浏览器包，而是由本地 Node 桥接程序启动。

The bridge selects a compatible binary and falls back to SSE where available. The native engine is not embedded in the browser bundle; it is launched by the local Node bridge.

## 再分发要求 / Redistribution Requirements

1. 保留 GPLv3 原文与 Rapfi `AUTHORS` 文件。 / Keep the GPLv3 text and Rapfi `AUTHORS` file.
2. 将本源码与来源记录同二进制一起分发。 / Keep this source and provenance record with the binaries.
3. 提供对应 Rapfi 源码或清晰、有效的上游源码链接。 / Provide the corresponding Rapfi source or a clear, durable upstream source pointer.
4. 修改 Rapfi 时标明修改内容和日期，并提供修改后的源码。 / Mark Rapfi changes and dates and provide the modified source.
5. 不增加与 GPLv3 冲突的限制。 / Do not add restrictions that conflict with GPLv3.
6. 不声称 Rapfi 作者身份、官方地位、赞助或认可。 / Do not claim Rapfi authorship, official status, sponsorship, or endorsement.
7. 替换任何引擎或权重文件后，更新 `rapfi-assets.json` 并重新运行分发审计。 / Update `rapfi-assets.json` and rerun the distribution audit after replacing any engine or network file.

本记录是维护说明，不构成法律意见；若与 GPLv3 冲突，以官方许可证原文为准。

This record is maintenance guidance, not legal advice; the official GPLv3 text controls if this summary conflicts with it.
