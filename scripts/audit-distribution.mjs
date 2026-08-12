#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultTarget = join(scriptRoot, "assets", "gomoku-template");
const rawArgs = process.argv.slice(2);
const strict = rawArgs.includes("--strict");
const targetArg = rawArgs.find((value) => !value.startsWith("--"));
const root = resolve(targetArg || defaultTarget);
const engineDirectory = join(root, "work", "rapfi-engine");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    fail(`Cannot read ${relative(root, path)}: ${error.message}`);
    return "";
  }
}

async function sha256(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex").toUpperCase();
}

function safeAssetPath(name) {
  if (!name || isAbsolute(name)) {
    fail(`Asset path is not relative: ${name || "<empty>"}`);
    return null;
  }
  const result = resolve(engineDirectory, name);
  const prefix = `${resolve(engineDirectory)}${sep}`;
  if (result !== resolve(engineDirectory) && !result.startsWith(prefix)) {
    fail(`Asset path escapes the engine directory: ${name}`);
    return null;
  }
  return result;
}

function requireText(text, needle, label) {
  if (!text.includes(needle)) fail(`${label} is missing required text: ${needle}`);
}

async function walk(path) {
  if (!(await exists(path))) return [];
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", "dist", ".next", ".vinext", ".wrangler", ".git"].includes(entry.name)) continue;
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function checkManifest() {
  const manifestPath = join(engineDirectory, "rapfi-assets.json");
  if (!(await exists(manifestPath))) {
    fail("Missing work/rapfi-engine/rapfi-assets.json");
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(`Invalid rapfi-assets.json: ${error.message}`);
    return;
  }

  if (manifest.schemaVersion !== 1) fail("Unsupported rapfi-assets.json schema version.");
  if (manifest.engine?.name !== "Rapfi") fail("Engine manifest does not identify Rapfi.");
  if (manifest.engine?.version !== "0.43.01") fail("Engine manifest version is not Rapfi 0.43.01.");
  if (manifest.engine?.license !== "GPL-3.0-only") fail("Rapfi engine must be recorded as GPL-3.0-only.");
  if (manifest.networks?.license !== "CC0-1.0") fail("Rapfi network files must be recorded as CC0-1.0.");
  for (const [key, expected] of [
    ["engine.upstreamRepository", "https://github.com/dhbloo/rapfi"],
    ["engine.sourceReference", "https://github.com/dhbloo/rapfi/tree/250615"],
    ["networks.upstreamRepository", "https://github.com/dhbloo/rapfi-networks"],
  ]) {
    const [section, field] = key.split(".");
    if (manifest[section]?.[field] !== expected) fail(`${key} does not point to the recorded upstream source.`);
  }

  const groups = [manifest.engine?.files, manifest.networks?.files];
  for (const files of groups) {
    if (!Array.isArray(files) || files.length === 0) {
      fail("An asset group in rapfi-assets.json has no files.");
      continue;
    }
    for (const entry of files) {
      const path = safeAssetPath(entry.path);
      if (!path) continue;
      if (!/^[A-F0-9]{64}$/i.test(entry.sha256 || "")) {
        fail(`Invalid SHA256 value for ${entry.path}.`);
        continue;
      }
      if (!(await exists(path))) {
        fail(`Manifest asset is missing: work/rapfi-engine/${entry.path}`);
        continue;
      }
      const actual = await sha256(path);
      if (actual !== entry.sha256.toUpperCase()) {
        fail(`SHA256 mismatch for ${entry.path}: expected ${entry.sha256}, got ${actual}.`);
      }
    }
  }

  const listedEngine = new Set((manifest.engine?.files || []).map((entry) => entry.path));
  const listedNetworks = new Set((manifest.networks?.files || []).map((entry) => entry.path));
  const actualNames = await readdir(engineDirectory);
  for (const name of actualNames.filter((value) => value.startsWith("pbrain-rapfi-"))) {
    if (!listedEngine.has(name)) fail(`Engine binary is not in the manifest: ${name}`);
  }
  for (const name of actualNames.filter((value) => value === "config.toml" || value.endsWith(".bin") || value.endsWith(".lz4"))) {
    if (!listedNetworks.has(name)) fail(`Network/config file is not in the manifest: ${name}`);
  }

  if (manifest.engine?.provenance !== "verified") {
    warn("Rapfi binary provenance is not marked verified. Compare the extracted binaries with the official release asset or rebuild from the recorded source before public release.");
  }
}

async function checkNotices() {
  const requiredFiles = [
    "LICENSE",
    "THIRD-PARTY-NOTICES.md",
    "RAPFI-SOURCE.md",
    "RAPFI-GPLv3.txt",
    "LICENSES/CC0-1.0.txt",
    "work/rapfi-engine/AUTHORS",
  ];
  for (const file of requiredFiles) {
    if (!(await exists(join(root, file)))) fail(`Missing redistribution file: ${file}`);
  }

  const ownLicense = await readText(join(root, "LICENSE"));
  const notices = await readText(join(root, "THIRD-PARTY-NOTICES.md"));
  const source = await readText(join(root, "RAPFI-SOURCE.md"));
  const gpl = await readText(join(root, "RAPFI-GPLv3.txt"));
  const cc0 = await readText(join(root, "LICENSES", "CC0-1.0.txt"));
  const authors = await readText(join(root, "work", "rapfi-engine", "AUTHORS"));

  requireText(ownLicense, "MIT License", "LICENSE");
  requireText(notices, "Rapfi Engine", "THIRD-PARTY-NOTICES.md");
  requireText(notices, "GPLv3", "THIRD-PARTY-NOTICES.md");
  requireText(notices, "CC0-1.0", "THIRD-PARTY-NOTICES.md");
  requireText(notices, "not affiliated", "THIRD-PARTY-NOTICES.md");
  requireText(source, "https://github.com/dhbloo/rapfi", "RAPFI-SOURCE.md");
  requireText(source, "GPLv3", "RAPFI-SOURCE.md");
  requireText(source, "corresponding source", "RAPFI-SOURCE.md");
  requireText(gpl, "GNU GENERAL PUBLIC LICENSE", "RAPFI-GPLv3.txt");
  requireText(cc0, "CC0-1.0", "LICENSES/CC0-1.0.txt");
  requireText(authors, "Haobin Duan", "work/rapfi-engine/AUTHORS");

  const allFiles = await walk(root);
  const textExtensions = /\.(?:md|txt|json|mjs|ts|tsx|css|toml|cmd|ya?ml)$/i;
  for (const file of allFiles.filter((value) => textExtensions.test(value))) {
    const text = await readText(file);
    if (/[A-Za-z]:\\Users\\[^\\]+\\|(?:^|[\s"'(])(?:\/Users\/|\/home\/)/.test(text)) {
      fail(`Machine-specific absolute path found in ${relative(root, file)}.`);
    }
  }
}

await checkNotices();
await checkManifest();

if (strict && warnings.length) {
  for (const warning of warnings) fail(`Strict release gate: ${warning}`);
}

console.log(`[AUDIT] Target: ${root}`);
for (const warning of warnings) console.log(`[WARN] ${warning}`);
for (const error of errors) console.error(`[FAIL] ${error}`);
if (errors.length) {
  console.error(`[AUDIT] Failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log("[OK] Distribution notices, source records, and asset integrity passed.");
