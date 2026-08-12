# Gomoku App Baseline Architecture

## Product Boundary

The canonical baseline is `assets/gomoku-template/`, version `PV5.2-coach-2026-08-12`. It is the last verified product, not a scaffold.

Baseline features that do not currently exist: sound effects, a standalone settings panel, network multiplayer, accounts, rankings, and a dedicated undo button. The review slider can move to an earlier position; placing from there branches the game and discards later moves.

## Stack And Files

- `app/page.tsx`: React client, game state, three play modes, SGF import, live requests, automatic replies, review navigation, and all main UI.
- `app/gomoku-coach.ts`: deterministic board interpretation and Chinese coach narration.
- `app/globals.css`: responsive 15x15 board and analysis workspace styling.
- `work/rapfi-bridge.mjs`: local HTTP bridge, win detection, Rapfi protocol, score conversion, move grading, and full review.
- `work/rapfi-engine/`: Rapfi 0.43.01 binaries, config, and neural models.
- `work/rapfi-engine/rapfi-assets.json`: version, upstream references, and
  SHA256 inventory for bundled engine/network files.
- `RAPFI-SOURCE.md`, `RAPFI-GPLv3.txt`, `THIRD-PARTY-NOTICES.md`, and
  `LICENSES/CC0-1.0.txt`: redistribution and license boundary records.
- `public/manifest.webmanifest` and `public/sw.js`: installable PWA shell and cache refresh.
- `tests/gomoku-coach.test.ts`: deterministic coach regression suite.
- `vite.config.ts`, `worker/index.ts`, and `build/sites-vite-plugin.ts`: Vinext/Vite/Cloudflare build path.

Runtime stack: React 19, TypeScript 5.9, Vinext/Vite 8, Node 22.13+, pnpm 11.

## Rules And Turns

- Board size is fixed at 15x15; stones are placed on intersections.
- Move index parity determines color: even is black, odd is white.
- Active game rule is freestyle Gomoku: five or more contiguous stones wins.
- The coach module also implements optional Renju checks for black overline, double-three, and double-four, but the current UI does not expose a rule selector.
- Occupied or out-of-board points are rejected. Analysis stops after an existing winner.

## Play Modes

- `manual + black`: user plays black; Rapfi automatically plays white.
- `manual + white`: Rapfi opens as black; user plays white.
- `free`: user alternates and controls both colors; every move is still graded.
- `demo`: bundled example game.

Also preserve SGF/RENJU text import, new game, example reset, previous/next review buttons, slider navigation, and full-game review.

## Rapfi Pipeline

The browser calls the loopback bridge, default `http://127.0.0.1:8795`. This is a relative runtime contract, not a machine-specific path; users can change it from the Rapfi button.

Bridge routes:

- `GET /health`: engine identity and active binary.
- `POST /analyze`: current score, best move, terminal status, mate distance, and a legal five-ply principal variation; optionally grades the last move.
- `POST /evaluate`: position score only.
- `POST /best-move`: direct engine result.
- `POST /review`: sequential grading for every move.

Engine selection is relative to `work/rapfi-engine/`: Windows AVX2 with SSE fallback, Linux AVX2 with SSE fallback, and macOS Apple Silicon. `RAPFI_BINARY` may override the binary. `RAPFI_PORT`, `RAPFI_HOST`, `WEB_PORT`, and `WEB_HOST` are optional environment overrides.

The bridge converts Rapfi evaluation to black win rate with a logistic scale. A non-best move receives a 1-100 penalty from the maximum of win-chance loss, evaluation loss, and positional deviation. Exact best moves receive zero. Forced mate and terminal scores override ordinary evaluation.

The engine is distributed as a separate local process. Keep Rapfi GPLv3
notices, authors, source pointers, and hashes separate from the original app
license. Network weights/configuration are tracked as a separate CC0-1.0
component according to the upstream Rapfi network repository.

## Coach Pipeline

Always keep analysis before narration:

1. Rebuild the board before the move with an explicit `movePlayer`.
2. Analyze the actual and Rapfi-recommended moves across horizontal, vertical, and both diagonal directions.
3. Detect five, open four, rush four, open/sleep three, open/sleep two, double-three, four-three, and double-four.
4. Compare immediate winning points and opponent threats before and after the move.
5. Prioritize win, forbidden move, forced win/loss, missed win, missed defense, required defense, attack-and-defense, double threat, strong attack, tactical miss, irrelevant move, slow move, good move, then normal move.
6. Use the engine score only to validate severity; never invent tactical reasons from the score alone.
7. Narrate 2-4 plain Chinese sentences from the side that just moved.
8. Expose structured `落子前 / 本手 / 局面变化 / 推荐 / 结论` evidence through `为什么？`.

Board markers are limited to the current move, Rapfi best point, unresolved danger points, and stones directly involved in the explanation. The translucent principal-variation hint shows only the color whose turn it is.

## UI Baseline

The desktop layout uses a large board and right analysis column. Mobile stacks the same controls and cards without horizontal overflow. Preserve the restrained teal/red/wood palette, square cards, numbered stones, win-rate ring, five-step route, trend chart, coach panel, and issue list.

There is no sound system or decorative animation system. Existing feedback is state-based: busy/locked controls, live status text, score changes, markers, and responsive layout.

## Modification Map

- Board-only visual changes: edit board and stone selectors in `app/globals.css`; do not touch engine or coach logic.
- Coach wording/detail changes: edit narration and details in `app/gomoku-coach.ts`; retain deterministic evidence and side ownership.
- AI strength/timing: edit bounded timeouts and Rapfi config carefully; retain asynchronous cancellation and stale-request protection.
- Rules: update bridge winner/legal logic, coach rules, UI labels, and tests together.
- New modules such as online play or rankings: add alongside the baseline; do not remove local play, free review, or Rapfi analysis.

## Verification Contract

Run `node scripts/verify-project.mjs <project> --full` from the Skill. It checks structure, bundled engine/model assets, hardcoded user paths, coach tests, lint, production build, and a direct Rapfi smoke test. For behavior changes, add focused tests proportional to risk.

For redistribution, also run `node scripts/audit-distribution.mjs <project> --strict`.
