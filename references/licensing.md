# Licensing and Redistribution Policy

Load this reference when the user asks to publish, fork, package, sell,
redistribute, relicense, replace, or modify the engine or model files.

## Component Boundary

Treat the repository as a multi-license distribution:

| Component | Required treatment |
| --- | --- |
| Original Skill scripts, documentation, and original app files | Covered by the root MIT license unless a file says otherwise. |
| Rapfi engine source/binaries | Keep under the upstream GPLv3 terms. Never relicense them as MIT. |
| Rapfi network weights/configuration | Keep the upstream CC0-1.0 notice and source reference. |
| Package dependencies | Keep their own licenses; do not copy a blanket license over them. |

The current template communicates with Rapfi through a separate local process.
Do not describe this adapter as Rapfi source or as an official Rapfi product.

## Required Rapfi Notices

Keep all of these together with a distributed template:

- `RAPFI-GPLv3.txt`
- `work/rapfi-engine/AUTHORS`
- `RAPFI-SOURCE.md`
- `THIRD-PARTY-NOTICES.md`
- `work/rapfi-engine/rapfi-assets.json`

For object-code redistribution, provide the corresponding Rapfi source or a
clear, durable pointer to the exact upstream source needed for the binary. If
the engine was modified, say so and provide the modified source. The official
upstream references are:

- https://github.com/dhbloo/rapfi
- https://github.com/dhbloo/rapfi/releases/tag/250615
- https://www.gnu.org/licenses/gpl-3.0.html

## Network File Notices

The official network repository states that its weight files are released under
CC0-1.0:

- https://github.com/dhbloo/rapfi-networks
- https://github.com/dhbloo/rapfi-networks/blob/main/LICENSE

Keep the CC0 notice. Do not claim that CC0 applies to Rapfi engine source or to
unrelated application code.

## Naming and Attribution

Use wording such as:

> This project bundles the Rapfi 0.43.01 engine as a separate GPLv3 component.
> Rapfi is an independent upstream project; this project is not affiliated
> with or endorsed by its authors.

Avoid wording such as:

- “our Rapfi engine”
- “official Rapfi version”
- “Rapfi by this project”
- “all files are MIT”

The name Rapfi may be used to identify the third-party engine and its source,
but this project must not imply sponsorship or trademark permission.

## Release Gate

Run:

```powershell
node <skill-dir>/scripts/audit-distribution.mjs <project> --strict
```

The audit checks notices, source pointers, file hashes, machine-specific paths,
and the engine/network file inventory. If the engine provenance has not been
verified against the stated release or source commit, resolve that before
publishing.

This policy is engineering guidance, not legal advice. The upstream license
texts control.
