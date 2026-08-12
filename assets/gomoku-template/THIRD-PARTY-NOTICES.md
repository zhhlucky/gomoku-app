# 第三方声明 / Third-Party Notices

本项目是独立的五子棋复盘应用。本文件标识随附的第三方组件并保留各自的上游许可证边界，不会对这些组件重新许可。

This project is an independent Gomoku review application. This file identifies bundled third-party components and preserves their upstream license boundaries; it does not relicense them.

## Rapfi 引擎 / Rapfi Engine

- 项目 / Project: Rapfi Gomoku/Renju engine
- 版本 / Version: 0.43.01
- 许可证 / License: GNU GPLv3
- 源码 / Source: https://github.com/dhbloo/rapfi
- 发布版本 / Release: https://github.com/dhbloo/rapfi/releases/tag/250615
- 许可证原文 / License text: `RAPFI-GPLv3.txt`
- 作者与致谢 / Authors: `work/rapfi-engine/AUTHORS`
- 二进制与源码记录 / Binary and source record: `RAPFI-SOURCE.md`

本地桥接程序将 Rapfi 作为独立进程启动，并通过引擎协议通信。本应用不是 Rapfi 官方发行版，与 Rapfi 作者不存在隶属、赞助或认可关系。

The local bridge starts Rapfi as a separate process and communicates through its engine protocol. This application is not an official Rapfi distribution and is not affiliated with, sponsored by, or endorsed by the Rapfi authors.

## Rapfi 网络文件 / Rapfi Network Files

`work/rapfi-engine/` 中随附 `config.toml`、`model210901.bin` 与五个 `.lz4` 权重文件。上游 Rapfi 网络仓库声明其权重文件按 CC0-1.0 发布；详情见 `LICENSES/CC0-1.0.txt` 与 `work/rapfi-engine/rapfi-assets.json`。

`work/rapfi-engine/` includes `config.toml`, `model210901.bin`, and five `.lz4` weight files. The upstream Rapfi network repository states that its weight files are released under CC0-1.0; see `LICENSES/CC0-1.0.txt` and `work/rapfi-engine/rapfi-assets.json`.

- 来源 / Source: https://github.com/dhbloo/rapfi-networks

## 依赖许可证 / Dependency Licenses

JavaScript 与构建依赖列在 `package.json` 并由 `pnpm-lock.yaml` 锁定。它们保留各自上游许可证，本项目不作统一重新许可声明。

JavaScript and build dependencies are listed in `package.json` and pinned by `pnpm-lock.yaml`. They retain their upstream licenses; this project makes no blanket relicensing claim.

## 名称使用 / Branding

Rapfi 名称仅用于标识第三方引擎。本项目不主张获得赞助、认可、商标许可或官方关系。

The Rapfi name is used only to identify the third-party engine. No sponsorship, endorsement, trademark license, or official relationship is claimed.
