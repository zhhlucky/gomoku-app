# 落子复盘 PV5.2 / Luozi Review PV5.2

这是带 Rapfi 0.43.01 本地引擎与实时教练的五子棋 PWA。它是独立应用，不是 Rapfi 官方产品，也不代表 Rapfi 作者；Rapfi 只作为单独的第三方本地引擎使用。

This is a Gomoku PWA with a local Rapfi 0.43.01 engine and live coaching. It is an independent application, not an official Rapfi product, and does not represent the Rapfi authors; Rapfi is used only as a separate third-party local engine.

## 打开方法 / Getting Started

1. 解压整个文件夹。 / Extract the complete folder.
2. 双击 `Start-Luozi-Review.cmd`。 / Double-click `Start-Luozi-Review.cmd`.
3. 首次运行请等待依赖安装完成，浏览器会自动打开 `http://localhost:3015/`。 / On first run, wait for dependency installation; the browser opens `http://localhost:3015/` automatically.
4. 使用时保持 `Rapfi Engine PV5` 和 `Luozi Review PV5` 两个命令窗口开启。 / Keep both `Rapfi Engine PV5` and `Luozi Review PV5` command windows open while using the app.

## 实时对弈与复盘 / Live Play and Review

- 选择“先手（黑）”时你执黑，Rapfi 自动执白；选择“后手（白）”时 Rapfi 先下黑棋，你执白。 / Choose first player to play black with automatic white replies, or second player to let Rapfi open as black while you play white.
- “自由复盘”允许你控制黑白双方，适合摆棋、导入棋谱和学习变化。 / Free review lets you control both colors for position setup, record import, and variation study.
- 每一步都会重新分析，并在棋盘和侧栏同步显示未来五手最佳路线。 / Every move triggers fresh analysis and shows the five-ply best line on the board and in the side panel.
- 非首选落子按偏差扣分并立即加入“需要复盘的手”。 / Non-best moves receive deviation-based penalties and are added to the review list immediately.
- 实时教练从刚落子的黑方或白方角度解释，点击“为什么？”可查看棋形和攻防证据。 / The live coach explains the side that just moved; open “Why?” to inspect pattern and tactical evidence.
- 支持活三、眠三、冲四、活四、双三、双四、四三、成五、漏防和强制胜负等判断。 / Analysis covers open threes, closed threes, fours, open fours, double threes, double fours, four-three threats, five, missed defense, and forced results.
- 支持 SGF/RENJU 导入、逐手浏览、胜率趋势和完整复盘。 / SGF/RENJU import, move navigation, trend display, and full-game review are included.

## 开发检查 / Development Checks

```powershell
pnpm test
pnpm lint
pnpm build
```

## 许可证说明 / License Notice

本项目原创代码使用 MIT 许可证，见 `LICENSE`。Rapfi 引擎及二进制继续使用 GPLv3，见 `RAPFI-GPLv3.txt`、`RAPFI-SOURCE.md` 和 `work/rapfi-engine/AUTHORS`。Rapfi 网络权重与配置按上游网络仓库的 CC0-1.0 声明分发，见 `THIRD-PARTY-NOTICES.md`、`LICENSES/CC0-1.0.txt` 和 `work/rapfi-engine/rapfi-assets.json`。

Original project code is MIT licensed; see `LICENSE`. The Rapfi engine and binaries remain under GPLv3; see `RAPFI-GPLv3.txt`, `RAPFI-SOURCE.md`, and `work/rapfi-engine/AUTHORS`. Rapfi network weights and configuration are distributed under the upstream network repository's CC0-1.0 notice; see `THIRD-PARTY-NOTICES.md`, `LICENSES/CC0-1.0.txt`, and `work/rapfi-engine/rapfi-assets.json`.

Rapfi 官方源码位于 https://github.com/dhbloo/rapfi 。若替换或重新编译 Rapfi，请同步更新版本、来源、构建说明和 SHA256 记录；来源未核对前，不要将二进制称为官方发布版本。

Official Rapfi source is available at https://github.com/dhbloo/rapfi . If Rapfi is replaced or rebuilt, update its version, provenance, build notes, and SHA256 records. Do not call a binary an official release until its provenance has been verified.
