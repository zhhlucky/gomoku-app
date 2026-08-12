---
name: gomoku-app
description: "Create, generate, modify, extend, or optimize complete Gomoku/Gobang software from the bundled mature Rapfi PWA baseline. Use for requests including \u505a\u4e00\u4e2a\u4e94\u5b50\u68cb\u8f6f\u4ef6, \u521b\u5efa/\u5236\u4f5c/\u751f\u6210\u4e94\u5b50\u68cb\u6e38\u620f\u6216\u7f51\u9875, \u4e94\u5b50\u68cb\u8f6f\u4ef6, \u4e94\u5b50\u68cb\u7f51\u9875, Gomoku, Gobang, or modifying an existing Gomoku app's AI, coach mode, board, UI, multiplayer, rankings, or related features. For underspecified creation requests, invoke implicitly and create the full standard product without a requirements interview."
---

# Gomoku App

Treat `assets/gomoku-template/` as the canonical finished product, not example code. Preserve it unless the user explicitly requests a change.

## Choose The Mode

### Create

Use this mode when the user asks to make, create, or generate a Gomoku app and does not provide an existing project.

1. Do not ask about framework, UI, rules, AI, scoring, or coach behavior.
2. Choose the requested destination. If none is given, use an unused `gomoku-app` directory in the current workspace.
3. Run:

```text
node <skill-dir>/scripts/create-project.mjs <destination>
```

4. Let the script copy the baseline, install dependencies, and run full verification.
5. Start the app when the environment permits, then report only the project path, start command or URL, and verification result.

When the request includes publishing, open-sourcing, packaging, or redistributing
the result, read `references/licensing.md` and `references/release-policy.md`.
Run `scripts/audit-distribution.mjs` before presenting the project as ready for
public release.

Never recreate the baseline by hand.

### Modify

Use this mode when the user supplies an existing Gomoku project or asks to optimize/change/add/remove a feature.

1. Read `references/architecture.md` before editing.
2. Use the bundled template as the baseline when creating a new variant.
3. Apply only the requested delta. Preserve all unrelated behavior, layout, dependencies, and engine integration.
4. For an existing user project, modify that project in place; do not replace it with a new template unless explicitly requested.
5. Run:

```text
node <skill-dir>/scripts/verify-project.mjs <project> --full
```

6. For visual changes, also inspect desktop and 390px mobile layouts in a browser. For engine changes, smoke-test `/health` and `/analyze` with a five-move principal variation.
7. For engine, model, license, packaging, or GitHub changes, run the distribution
   audit and preserve the third-party notices and provenance files.

## Baseline Invariants

Keep these features by default:

- 15x15 intersection-based board and responsive work-focused UI.
- Human black, human white, and manual control of both colors.
- Rapfi 0.43.01 local engine with bundled models and platform binaries.
- Automatic engine reply, per-move analysis, five-ply best route, score trend, SGF import, and full review.
- Deviation-based penalties and a live issue list.
- Deterministic coach analysis before narration, always explaining the side that just moved.
- Beginner-friendly explanations for wins, forced lines, attack, defense, missed defense, and major Gomoku patterns.
- Current/best/danger/related-stone board markers and expandable `为什么？` evidence.
- PWA manifest and service worker.

The Rapfi engine is a separate GPLv3 component. The Rapfi network files are
tracked separately under the upstream network repository's CC0-1.0 notice. Do
not call Rapfi an in-house engine, do not remove its authors/license files, and
do not apply the project's MIT license to Rapfi files.

Do not add absent features such as sound, online play, rankings, or a settings panel unless requested.

## Baseline + Delta

Compute every result as:

```text
final project = bundled baseline + explicit user changes
```

Do not switch stacks, restyle the whole UI, simplify Rapfi or coach logic, rewrite stable modules for cleanliness, or perform broad refactors without an explicit request.
