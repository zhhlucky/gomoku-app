#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const requiredFiles = [
  ".gomoku-template.json",
  "package.json",
  "pnpm-lock.yaml",
  "app/page.tsx",
  "app/gomoku-coach.ts",
  "app/globals.css",
  "public/manifest.webmanifest",
  "public/sw.js",
  "tests/gomoku-coach.test.ts",
  "work/rapfi-bridge.mjs",
  "work/rapfi-engine/config.toml",
  "work/rapfi-engine/rapfi-assets.json",
  "RAPFI-GPLv3.txt",
  "RAPFI-SOURCE.md",
  "THIRD-PARTY-NOTICES.md",
  "LICENSE",
  "LICENSES/CC0-1.0.txt",
];

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
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

function run(command, args, cwd, label) {
  console.log(`[CHECK] ${label}`);
  const result = spawnCommand(command, args, cwd, "inherit");
  if (result.error) fail(`${label}: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} exited with code ${result.status}.`);
}

function spawnCommand(command, args, cwd, stdio) {
  if (process.platform === "win32" && /\.(?:cmd|bat)$/i.test(command)) {
    return spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/c", command, ...args], { cwd, stdio, windowsHide: true });
  }
  return spawnSync(command, args, { cwd, stdio, windowsHide: true });
}

function packageManager(cwd) {
  const candidates = [
    { command: process.env.PNPM_BIN || (process.platform === "win32" ? "pnpm.cmd" : "pnpm"), prefix: [] },
    { command: process.platform === "win32" ? "corepack.cmd" : "corepack", prefix: ["pnpm"] },
  ];
  for (const candidate of candidates) {
    const probe = spawnCommand(candidate.command, [...candidate.prefix, "--version"], cwd, "ignore");
    if (!probe.error && probe.status === 0) return candidate;
  }
  fail("pnpm or corepack is required for full verification.");
}

async function walk(path) {
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

async function sha256(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex").toUpperCase();
}

function platformEngineNames() {
  if (process.platform === "win32") return ["pbrain-rapfi-windows-avx2.exe", "pbrain-rapfi-windows-sse.exe"];
  if (process.platform === "linux") return ["pbrain-rapfi-linux-clang-avx2", "pbrain-rapfi-linux-clang-sse"];
  if (process.platform === "darwin" && process.arch === "arm64") return ["pbrain-rapfi-macos-apple-silicon"];
  return [];
}

function smokeEngine(engine, cwd) {
  return new Promise((resolveSmoke, rejectSmoke) => {
    const child = spawn(engine, [], { cwd, windowsHide: true });
    let output = "";
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (error) rejectSmoke(error);
      else resolveSmoke();
    };
    const timer = setTimeout(() => finish(new Error("engine smoke test timed out")), 10000);
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("error", finish);
    child.on("close", () => {
      const move = output.split(/\r?\n/).find((line) => /^\d+,\d+$/.test(line.trim()));
      finish(move ? null : new Error("engine did not return a move"));
    });
    child.stdin.end("START 15\nINFO timeout_turn 500\nINFO show_detail 2\nBOARD\nDONE\nEND\n");
  });
}

const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node verify-project.mjs <project> [--full]");
  process.exit(args.length ? 0 : 1);
}

const root = resolve(args.find((value) => !value.startsWith("--")) || "");
const full = args.includes("--full");
for (const file of requiredFiles) {
  if (!(await exists(join(root, file)))) fail(`Missing required file: ${file}`);
}

const manifest = JSON.parse(await readFile(join(root, ".gomoku-template.json"), "utf8"));
if (manifest.template !== "gomoku-app" || manifest.boardSize !== 15 || manifest.principalVariationLength !== 5) {
  fail("Template manifest does not match the Gomoku baseline.");
}

const assetManifest = JSON.parse(await readFile(join(root, "work", "rapfi-engine", "rapfi-assets.json"), "utf8"));
if (assetManifest.engine?.name !== "Rapfi" || assetManifest.engine?.version !== "0.43.01") {
  fail("Rapfi asset manifest does not identify version 0.43.01.");
}
if (assetManifest.engine?.license !== "GPL-3.0-only" || assetManifest.networks?.license !== "CC0-1.0") {
  fail("Rapfi engine/network license boundary is missing or incorrect.");
}
for (const group of [assetManifest.engine?.files, assetManifest.networks?.files]) {
  for (const entry of group || []) {
    const assetPath = join(root, "work", "rapfi-engine", entry.path);
    if (!(await exists(assetPath))) fail(`Missing manifest asset: ${entry.path}`);
    else if ((await sha256(assetPath)) !== entry.sha256.toUpperCase()) fail(`Manifest hash mismatch: ${entry.path}`);
  }
}
const notices = await readFile(join(root, "THIRD-PARTY-NOTICES.md"), "utf8");
if (!notices.includes("GPLv3") || !notices.includes("CC0-1.0") || !notices.includes("not affiliated")) {
  fail("Third-party license boundary notice is incomplete.");
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (!packageJson.scripts?.dev || !packageJson.scripts?.bridge || !packageJson.scripts?.test) {
  fail("Required package scripts are missing.");
}

const engineDirectory = join(root, "work", "rapfi-engine");
const modelFiles = (await readdir(engineDirectory)).filter((name) => name.endsWith(".lz4"));
if (modelFiles.length < 4) fail("Expected four bundled Rapfi neural models.");

const sourceFiles = (await walk(root)).filter((file) => /\.(?:js|mjs|ts|tsx|json|md|txt|css|toml|cmd)$/i.test(file));
for (const file of sourceFiles) {
  const content = await readFile(file, "utf8");
  if (/[A-Za-z]:\\Users\\[^\\]+\\/.test(content)) fail(`Machine-specific absolute path found in ${basename(file)}.`);
}

const page = await readFile(join(root, "app", "page.tsx"), "utf8");
const coach = await readFile(join(root, "app", "gomoku-coach.ts"), "utf8");
const decodedPage = page.replace(/\\u([0-9a-f]{4})/gi, (_, value) => String.fromCharCode(Number.parseInt(value, 16)));
for (const token of ["自由复盘", "完整复盘", "未来 5 手最佳路线", "为什么？"]) {
  if (!decodedPage.includes(token)) {
    fail(`Missing baseline UI feature: ${token}`);
  }
}
for (const token of ["OPEN_THREE", "RUSH_FOUR", "OPEN_FOUR", "DOUBLE_THREE", "DOUBLE_FOUR", "MISSED_DEFENSE"]) {
  if (!coach.includes(token)) fail(`Missing coach feature: ${token}`);
}

console.log(`[OK] Structure, baseline features, and ${modelFiles.length} Rapfi models verified.`);

if (full) {
  if (!(await exists(join(root, "node_modules")))) fail("node_modules is missing; install dependencies before --full verification.");
  run(process.execPath, ["--experimental-strip-types", "--test", "tests/gomoku-coach.test.ts"], root, "Coach regression tests");
  const manager = packageManager(root);
  run(manager.command, [...manager.prefix, "lint"], root, "ESLint");
  run(manager.command, [...manager.prefix, "build"], root, "Production build");

  const engines = platformEngineNames();
  if (!engines.length) {
    console.log(`[WARN] No bundled Rapfi smoke target for ${process.platform}/${process.arch}.`);
  } else {
    let smokeError = null;
    for (const name of engines) {
      try {
        await smokeEngine(join(engineDirectory, name), engineDirectory);
        smokeError = null;
        console.log(`[OK] Rapfi smoke test passed with ${name}.`);
        break;
      } catch (error) {
        smokeError = error;
      }
    }
    if (smokeError) fail(`Rapfi smoke test failed: ${smokeError.message}`);
  }
}

console.log(`[OK] Gomoku project verified: ${root}`);
