# 第三方声明 / Third-Party Notices

本文件记录 `gomoku-app` Skill 及其标准模板中随附的第三方组件。它不会更改、替代或重新许可原作者提供的许可证；中英文说明仅用于识别组件和维护许可证边界。

This file records third-party components bundled with the `gomoku-app` Skill and its canonical template. It does not change, replace, or sublicense the licenses supplied by the original authors; the bilingual text identifies components and preserves their license boundaries.

## Rapfi 引擎 / Rapfi Engine

- 项目 / Project: Rapfi Gomoku/Renju engine
- 模板版本 / Template version: 0.43.01
- 许可证 / License: GNU General Public License version 3 (GPLv3)
- 上游仓库 / Upstream repository: https://github.com/dhbloo/rapfi
- 对应源码记录 / Corresponding-source record: `RAPFI-SOURCE.md`
- 许可证原文 / License text: `assets/gomoku-template/RAPFI-GPLv3.txt`
- 作者与致谢 / Authors and acknowledgements: `assets/gomoku-template/work/rapfi-engine/AUTHORS`

本项目的桥接程序将 Rapfi 作为独立本地进程启动，并通过引擎协议通信。本项目不主张拥有 Rapfi 源码。若替换二进制或修改 Rapfi 源码，必须继续遵守适用的 GPLv3 条款，并在分发前更新源码与来源记录。

The bridge starts Rapfi as a separate local process and communicates through its engine protocol. This project does not claim ownership of Rapfi source code. Replacement binaries or modified Rapfi source must remain under the applicable GPLv3 terms, with updated source and provenance records before distribution.

## Rapfi 网络文件 / Rapfi Network Files

模板包含 `config.toml`、`model210901.bin`、`mix9svqfreestyle_bsmix.bin.lz4`、`mix9svqrenju_bs15_black.bin.lz4`、`mix9svqrenju_bs15_white.bin.lz4` 和 `mix9svqstandard_bs15.bin.lz4`。Rapfi 网络仓库声明其权重文件按 CC0-1.0 自由发布。

The template includes `config.toml`, `model210901.bin`, `mix9svqfreestyle_bsmix.bin.lz4`, `mix9svqrenju_bs15_black.bin.lz4`, `mix9svqrenju_bs15_white.bin.lz4`, and `mix9svqstandard_bs15.bin.lz4`. The upstream Rapfi network repository states that its weight files are released under CC0-1.0.

- 上游仓库 / Repository: https://github.com/dhbloo/rapfi-networks
- 许可证原文 / License text: `assets/gomoku-template/LICENSES/CC0-1.0.txt`
- 完整性清单 / Integrity manifest: `assets/gomoku-template/work/rapfi-engine/rapfi-assets.json`

保留项目名称和许可声明是为了清楚标识来源。CC0 不授予商标权，也不表示上游作者认可本项目。

The project name and license notice are retained for source clarity. CC0 grants no trademark rights and does not imply upstream endorsement.

## 其他依赖 / Other Dependencies

应用所用开源软件包列在 `package.json` 并由 `pnpm-lock.yaml` 锁定。它们继续适用各自的上游许可证，本项目不会因打包而对其作统一重新许可。

Open-source packages used by the application are listed in `package.json` and pinned by `pnpm-lock.yaml`. They retain their upstream licenses and are not relicensed merely because they are bundled here.

## 无隶属关系 / No Affiliation

本项目是独立的五子棋界面与教练适配器，不是 Rapfi 官方发行版，不代表 Rapfi 作者，也不以 Rapfi 名称暗示赞助或认可。

This project is an independent Gomoku interface and coaching adapter. It is not an official Rapfi distribution, does not represent the Rapfi authors, and does not use the Rapfi name to imply sponsorship or approval.
