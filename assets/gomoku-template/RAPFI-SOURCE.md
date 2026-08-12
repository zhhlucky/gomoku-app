# Rapfi 源码与来源 / Rapfi Source and Provenance

`work/rapfi-engine/` 中的引擎二进制是独立的 GPLv3 第三方组件，不适用本应用原创代码的 MIT 许可证。

The engine binaries in `work/rapfi-engine/` are a separate GPLv3 third-party component and are not covered by the MIT license for the original application code.

## 上游记录 / Upstream Record

- 项目 / Project: Rapfi Gomoku/Renju engine
- 许可证 / License: GNU GPLv3
- 仓库 / Repository: https://github.com/dhbloo/rapfi
- 二进制报告版本 / Version reported by bundled binaries: 0.43.01
- 发布版本 / Release reference: https://github.com/dhbloo/rapfi/releases/tag/250615
- 源码版本 / Source reference: https://github.com/dhbloo/rapfi/tree/250615
- GitHub 发布页所示提交 / Commit shown on release page: `1be1551`
- 官方发布包 / Official release asset: `Rapfi-engine.7z`
- 官方发布包 SHA256 / Official archive SHA256: `1a3e24024062a153ac079060ee9589a37c6bdd1ecc54fed3908793c519594e05`
- 作者 / Authors: `work/rapfi-engine/AUTHORS`
- 许可证原文 / License text: `RAPFI-GPLv3.txt`

上游仓库提供 Rapfi 源码和构建文件。分发二进制时保留本文件，便于接收者取得对应源码；重新构建或替换二进制后，发布前更新本文件和 `work/rapfi-engine/rapfi-assets.json`。

The upstream repository provides Rapfi source and build files. Keep this file with binary distributions so recipients can obtain the corresponding source; after rebuilding or replacing a binary, update this file and `work/rapfi-engine/rapfi-assets.json` before publication.

2026-08-12 已完成验证：本地官方发布包 SHA256 与发布页一致，18 个提取文件与模板逐字节一致。当前随附引擎是官方 Rapfi 0.43.01 发布包，不是本地重命名或修改的二进制。

Verification completed on 2026-08-12: the local official archive SHA256 matches the release page, and all 18 extracted files match the template byte-for-byte. The bundled engine is the official Rapfi 0.43.01 release package, not a locally renamed or modified binary.

仅凭版本字符串不能证明二进制来源。本地重新构建的版本必须明确标记为本地构建。

The version string alone does not prove binary provenance. Locally rebuilt binaries must be identified as local builds.

## 随附平台版本 / Included Variants

- Windows: SSE, AVX2, AVXVNNI, AVX512, AVX512VNNI
- Linux: SSE, AVX2, AVXVNNI, AVX512, AVX512VNNI
- macOS: Apple Silicon

桥接程序选择兼容版本，并在可用时回退到 SSE；浏览器包不包含原生引擎代码，本地 Node 桥接程序会单独启动引擎。

The bridge selects a compatible variant and falls back to SSE where available. The native engine is not part of the browser bundle; the local Node bridge starts it separately.

## 再分发要求 / Redistribution Requirements

1. 保留 GPLv3 原文和 `AUTHORS` 文件。 / Keep the GPLv3 text and `AUTHORS` file.
2. 将本来源记录同二进制一起分发。 / Keep this provenance record with the binary distribution.
3. 提供对应源码或上方明确的上游源码链接。 / Provide corresponding source or the clear upstream source pointer above.
4. 修改 Rapfi 时标明修改和日期。 / Mark changes and dates if Rapfi is modified.
5. 不增加与 GPLv3 冲突的限制。 / Do not add restrictions that conflict with GPLv3.
6. 不暗示 Rapfi 作者身份、官方地位、赞助或认可。 / Do not imply Rapfi authorship, official status, sponsorship, or endorsement.

若本摘要与上游许可证冲突，以官方许可证原文为准。

The official upstream license text controls if it conflicts with this summary.
