#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(here, "..");
const templateRoot = join(skillRoot, "assets", "gomoku-template");
const verifyScript = join(here, "verify-project.mjs");
const ignoredNames = new Set([
  ".git",
  ".next",
  ".vinext",
  ".wrangler",
  "dist",
  "node_modules",
  "Thumbs.db",
  ".DS_Store",
]);

function usage() {
  console.log("Usage: node create-project.mjs [destination] [--skip-install] [--skip-verify] [--auto-suffix]");
}

function fail(message) {
  console.error(`gomoku-app: ${message}`);
  process.exit(1);
}

function assertNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    fail(`Node.js 22.13 or newer is required; found ${process.versions.node}.`);
  }
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

async function isEmptyDirectory(path) {
  if (!(await exists(path))) return true;
  return (await readdir(path)).length === 0;
}

async function unusedDestination(initial) {
  if (!(await exists(initial))) return initial;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${initial}-${index}`;
    if (!(await exists(candidate))) return candidate;
  }
  fail("Could not find an unused destination name.");
}

function commandResult(command, args, cwd, stdio = "inherit") {
  if (process.platform === "win32" && /\.(?:cmd|bat)$/i.test(command)) {
    return spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/c", command, ...args], { cwd, stdio, windowsHide: true });
  }
  return spawnSync(command, args, { cwd, stdio, windowsHide: true });
}

function packageManager() {
  const direct = process.env.PNPM_BIN || (process.platform === "win32" ? "pnpm.cmd" : "pnpm");
  const directProbe = commandResult(direct, ["--version"], process.cwd(), "ignore");
  if (!directProbe.error && directProbe.status === 0) {
    return { command: direct, prefix: [] };
  }

  const corepack = process.platform === "win32" ? "corepack.cmd" : "corepack";
  const corepackProbe = commandResult(corepack, ["pnpm", "--version"], process.cwd(), "ignore");
  if (!corepackProbe.error && corepackProbe.status === 0) {
    return { command: corepack, prefix: ["pnpm"] };
  }

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const npxProbe = commandResult(npx, ["--version"], process.cwd(), "ignore");
  if (!npxProbe.error && npxProbe.status === 0) {
    return { command: npx, prefix: ["--yes", "pnpm@11.21.0"] };
  }

  fail("pnpm, corepack, or npx is required to install dependencies.");
}

function runChecked(command, args, cwd, label) {
  console.log(`\n[gomoku-app] ${label}`);
  const result = commandResult(command, args, cwd);
  if (result.error) fail(`${label} failed: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} exited with code ${result.status}.`);
}

const rawArgs = process.argv.slice(2);
if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  usage();
  process.exit(0);
}

assertNodeVersion();
const flags = new Set(rawArgs.filter((value) => value.startsWith("--")));
const positional = rawArgs.filter((value) => !value.startsWith("--"));
if (positional.length > 1) fail("Only one destination may be provided.");

const usedDefault = positional.length === 0;
let destination = resolve(positional[0] || "gomoku-app");
if (usedDefault || flags.has("--auto-suffix")) destination = await unusedDestination(destination);

const relativeToTemplate = relative(templateRoot, destination);
if (!relativeToTemplate || (!relativeToTemplate.startsWith(`..${sep}`) && !isAbsolute(relativeToTemplate))) {
  fail("Destination cannot be inside the bundled template.");
}
if (!isAbsolute(destination)) fail("Destination resolution failed.");
if (!(await isEmptyDirectory(destination))) fail(`Destination is not empty: ${destination}`);
if (!(await exists(join(templateRoot, ".gomoku-template.json")))) fail("Bundled template is incomplete.");

await mkdir(destination, { recursive: true });
await cp(templateRoot, destination, {
  recursive: true,
  filter(source) {
    const pathParts = relative(templateRoot, source).split(/[\\/]/).filter(Boolean);
    return !pathParts.some((part) => ignoredNames.has(part) || part.endsWith(".log") || part.endsWith(".tsbuildinfo"));
  },
});

if (process.platform !== "win32") {
  const engineDirectory = join(destination, "work", "rapfi-engine");
  for (const name of await readdir(engineDirectory)) {
    if (name.startsWith("pbrain-rapfi-") && !name.endsWith(".exe")) {
      const { chmod } = await import("node:fs/promises");
      await chmod(join(engineDirectory, name), 0o755);
    }
  }
}

if (!flags.has("--skip-install")) {
  const manager = packageManager();
  runChecked(
    manager.command,
    [...manager.prefix, "install", "--frozen-lockfile", "--config.strict-dep-builds=false"],
    destination,
    "Installing locked dependencies",
  );
  runChecked(manager.command, [...manager.prefix, "rebuild", "--pending"], destination, "Approving required native builds");
}

if (!flags.has("--skip-verify")) {
  const verifyArgs = [verifyScript, destination];
  if (!flags.has("--skip-install")) verifyArgs.push("--full");
  runChecked(process.execPath, verifyArgs, skillRoot, "Verifying generated project");
}

console.log(`\n[gomoku-app] Project created: ${destination}`);
console.log("Start on Windows: double-click Start-Luozi-Review.cmd");
console.log("Manual start: run `pnpm bridge` and `pnpm dev:pv5` in separate terminals.");
