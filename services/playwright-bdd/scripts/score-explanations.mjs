import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Scores the explainer against failures this repository has already diagnosed. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, "..", "tests", "failure-corpus");

const entries = readdirSync(CORPUS).map((name) => ({
  name,
  payload: JSON.parse(readFileSync(path.join(CORPUS, name, "payload.json"), "utf8"))[0],
  expected: JSON.parse(readFileSync(path.join(CORPUS, name, "expected.json"), "utf8")),
}));

/* One call of the explainer over every payload at once: it logs in once, and each answer comes back
   in the order it was asked. */
const work = mkdtempSync(path.join(tmpdir(), "corpus-"));
const input = path.join(work, "payloads.json");
const output = path.join(work, "explanations.json");

writeFileSync(input, JSON.stringify(entries.map((entry) => entry.payload)));

const { status } = spawnSync(
  "node",
  [path.join(HERE, "explain-failures.mjs"), "--input", input, "--output", output],
  { stdio: "inherit" },
);

if (status !== 0) process.exit(status ?? 1);

const explanations = JSON.parse(readFileSync(output, "utf8"));
const scored = entries.map((entry, index) => ({
  ...entry,
  answer: explanations[index],
  right: explanations[index].category === entry.expected.category,
}));

for (const { name, expected, answer, right } of scored) {
  console.log(
    `${right ? "✓" : "✗"} ${name}: expected ${expected.category}, answered ${answer.category} (${answer.confidence})`,
  );
  if (!right) console.log(`    ${answer.reasoning}`);
}

const right = scored.filter((entry) => entry.right).length;
console.log(`\n${right} of ${scored.length}`);
