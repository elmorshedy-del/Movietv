import fs from "node:fs";
import { execFileSync } from "node:child_process";

const GATE_PATH = ".codex/watch-gate.json";

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function refExists(ref) {
  try {
    git(["rev-parse", "--verify", ref]);
    return true;
  } catch {
    return false;
  }
}

const requestedBase = process.env.WATCH_GATE_BASE_REF;
const baseCandidates = [requestedBase, "origin/main", "main"].filter(Boolean);
const baseRef = baseCandidates.find(refExists);

if (!baseRef) {
  console.error(
    "Watch gate: could not resolve a base ref. Fetch origin/main or set WATCH_GATE_BASE_REF.",
  );
  process.exit(1);
}

let gateText;
try {
  gateText = git(["show", `${baseRef}:${GATE_PATH}`]);
} catch (error) {
  console.error(
    `Watch gate: ${GATE_PATH} must exist on the base branch (${baseRef}).`,
  );
  process.exit(1);
}

const gate = JSON.parse(gateText);
const mergeBase = git(["merge-base", "HEAD", baseRef]);
const changedOutput = git([
  "diff",
  "--name-only",
  "--diff-filter=ACMRTD",
  `${mergeBase}..HEAD`,
]);
const changedPaths = changedOutput ? changedOutput.split("\n").filter(Boolean) : [];
const changedSet = new Set(changedPaths);
const allowedSet = new Set(gate.allowedChangedPaths ?? []);

const forbidden = changedPaths.filter((path) => !allowedSet.has(path));
const missingChanged = (gate.requiredChangedPaths ?? []).filter(
  (path) => !changedSet.has(path),
);
const missingPresent = (gate.requiredPresentPaths ?? []).filter(
  (path) => !fs.existsSync(path),
);

const missingContent = [];
for (const rule of gate.requiredContent ?? []) {
  if (!fs.existsSync(rule.path)) {
    missingContent.push(`${rule.path}: file missing`);
    continue;
  }
  const content = fs.readFileSync(rule.path, "utf8");
  for (const needle of rule.contains ?? []) {
    if (!content.includes(needle)) {
      missingContent.push(`${rule.path}: missing required text ${JSON.stringify(needle)}`);
    }
  }
}

console.log(`Watch Together gate ${gate.gate}: ${gate.title}`);
console.log(`Base ref: ${baseRef}`);
console.log(`Changed paths (${changedPaths.length}):`);
for (const path of changedPaths) console.log(`  - ${path}`);

let failed = false;

if (forbidden.length) {
  failed = true;
  console.error("\nFAILED: changed files outside this gate's allowlist:");
  for (const path of forbidden) console.error(`  - ${path}`);
}

if (missingChanged.length) {
  failed = true;
  console.error("\nFAILED: required gate files were not changed:");
  for (const path of missingChanged) console.error(`  - ${path}`);
}

if (missingPresent.length) {
  failed = true;
  console.error("\nFAILED: required files are not present:");
  for (const path of missingPresent) console.error(`  - ${path}`);
}

if (missingContent.length) {
  failed = true;
  console.error("\nFAILED: required gate content is missing:");
  for (const item of missingContent) console.error(`  - ${item}`);
}

if (failed) {
  console.error(
    `\nGate ${gate.gate} is NOT complete. Fix the failures and rerun pnpm watch:gate. Do not advance to Gate ${gate.nextGate}.`,
  );
  process.exit(1);
}

console.log(
  `\nScope/content check passed for Gate ${gate.gate}. Continue with the required deterministic checks; after all pass, STOP before Gate ${gate.nextGate}.`,
);
