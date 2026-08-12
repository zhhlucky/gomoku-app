# Reusable Release Workflow

## Create from the Baseline

Use the copy script. Do not regenerate the product by hand:

```powershell
node <skill-dir>/scripts/create-project.mjs <destination>
```

The script copies the clean template, excludes caches/build output, installs
the locked dependencies, and runs project verification.

## Modify the Baseline

For an existing project, read `references/architecture.md`, apply only the
requested delta, and run both project verification and the distribution audit.

## Before GitHub Publication

1. Run `scripts/audit-distribution.mjs <project> --strict`.
2. Confirm `RAPFI-SOURCE.md` matches the actual binaries.
3. Confirm every listed SHA256 value was generated from the release files.
4. Confirm the Rapfi source pointer is public and stable.
5. Confirm GPLv3 and CC0 notices were not removed or replaced by the project
   license.
6. Remove caches, build output, logs, secrets, and local paths.
7. Run the full application verification.
8. Review the release notes for an explicit no-affiliation statement.

If any of these checks cannot be completed, publish the source and a download
instruction that obtains the third-party engine from its official source rather
than silently distributing an unverified replacement binary.
