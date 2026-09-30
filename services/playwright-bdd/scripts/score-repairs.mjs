import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Scores the healer against locators drifted on purpose. Two numbers, not one: how often it names
 *  a repair that survives the gates, and how often it stayed inside the locators object doing it.
 *  An entry costs an agent, a scenario and a suite, so most are skipped once measured and
 *  `HEAL_CORPUS=all` runs every one again. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICE = path.resolve(HERE, "..");
const REPOSITORY = path.resolve(SERVICE, "..", "..");
const CORPUS = JSON.parse(
  readFileSync(path.join(SERVICE, "tests", "heal-corpus", "corpus.json"), "utf8"),
);

function git(...args) {
  const { stdout } = spawnSync("git", args, { cwd: REPOSITORY, encoding: "utf8" });
  return stdout ?? "";
}

function edit(file, from, to) {
  const full = path.join(REPOSITORY, file);
  const source = readFileSync(full, "utf8");
  if (!source.includes(from)) throw new Error(`${file} does not hold ${from}`);
  if (from === to) throw new Error(`${file} already holds ${to}: there is nothing to drift`);
  writeFileSync(full, source.replace(from, to));
}

/** The reports the healer reads, as `explain-failures.mjs` would have written them for this drift.
 *  The classification is given rather than asked for: what is being scored is the repair. */
function reports(entry) {
  const reportsDir = path.join(SERVICE, "reports");
  mkdirSync(reportsDir, { recursive: true });

  const call = `Error: locator.click: Test timeout of 120000ms exceeded.\nCall log:\n  - waiting for locator('${entry.drifted}')\n`;
  writeFileSync(
    path.join(reportsDir, "failures.json"),
    JSON.stringify([
      {
        test: entry.scenario,
        fullName: `.features-gen/chrome/features/scenarios/${entry.feature}.feature.spec.js`,
        failingStep: entry.failingStep,
        browsers: ["chrome"],
        message: "Test timeout of 120000ms exceeded.",
        trace: "",
        steps: [{ name: entry.failingStep, status: "failed", message: call }],
      },
    ]),
  );
  writeFileSync(
    path.join(reportsDir, "explanation.json"),
    JSON.stringify([
      {
        test: entry.scenario,
        failingStep: entry.failingStep,
        category: "locator",
        confidence: "high",
        reasoning: "the element was waited on and never appeared",
        browsers: ["chrome"],
      },
    ]),
  );
}

/* A drift left in the working tree is repaired back to what HEAD holds, and the diff comes out
   empty: the gate reads that as nothing changed and rejects a correct answer. A real red run carries
   its broken selector committed, so the scorer commits each drift and drops the commit afterwards -
   which is also why it refuses to start on a tree that is not clean. */
if (git("status", "--short").trim() !== "") {
  throw new Error("the working tree is not clean, and scoring resets it between entries");
}

const scored = [];

const entries = CORPUS.filter((entry) => !entry.skip || process.env.HEAL_CORPUS === "all");
console.log(`${entries.length} of ${CORPUS.length} entries`);

for (const entry of entries) {
  console.log(`\n=== ${entry.name} ===`);
  edit(entry.file, `${entry.key}: "${current(entry)}"`, `${entry.key}: "${entry.drifted}"`);
  if (entry.alsoBreak) edit(entry.alsoBreak.file, entry.alsoBreak.from, entry.alsoBreak.to);

  /* Reset to by name afterwards: `HEAD~1` is one commit back from wherever HEAD ends up, which on
     a drift that committed nothing is somebody else's work. */
  const before = git("rev-parse", "HEAD").trim();
  spawnSync("git", ["add", "-A"], { cwd: REPOSITORY });
  spawnSync("git", ["commit", "--no-verify", "-m", `drift ${entry.name}`], {
    cwd: REPOSITORY,
    encoding: "utf8",
  });
  if (git("rev-parse", "HEAD").trim() === before) {
    throw new Error(`the drift of ${entry.name} committed nothing`);
  }

  reports(entry);
  const { status } = spawnSync("node", [path.join(HERE, "heal-locators.mjs")], {
    cwd: SERVICE,
    env: { ...process.env, HEAL_ATTEMPTS: process.env.HEAL_ATTEMPTS ?? "2" },
    stdio: "inherit",
  });

  const repairs = JSON.parse(
    readFileSync(path.join(SERVICE, "reports", "repairs.json"), "utf8"),
  ).filter((repair) => repair.key === entry.key);
  const proposed = repairs.some((repair) => repair.proposed);

  git("reset", "--hard", before);

  scored.push({
    name: entry.name,
    repairable: entry.repairable,
    proposed,
    /* Proposing nothing on a scenario no locator can fix is the right answer, and a healer that
       never declines is one that fabricates. */
    right: proposed === entry.repairable,
    confined: git("status", "--short").trim() === "",
    to: repairs.find((repair) => repair.proposed)?.to,
    rejected: repairs.find((repair) => !repair.proposed)?.rejected,
    status,
  });
}

console.log("\n");
for (const entry of scored) {
  console.log(
    `${entry.right ? "✓" : "✗"} ${entry.name}: ${
      entry.proposed ? `proposed ${entry.to}` : `proposed nothing (${entry.rejected ?? "—"})`
    }${entry.repairable ? "" : ", and nothing was the answer"}`,
  );
}

const right = scored.filter((entry) => entry.right).length;
const clean = scored.filter((entry) => entry.confined).length;
console.log(
  `\n${right} of ${scored.length} answered, ${clean} of ${scored.length} left a clean tree`,
);

function current(entry) {
  const source = readFileSync(path.join(REPOSITORY, entry.file), "utf8");
  return new RegExp(`${entry.key}: "(.+?)"`).exec(source)?.[1] ?? "";
}
