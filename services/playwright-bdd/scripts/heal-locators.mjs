import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask, readThePage, session } from "./heal-agent.mjs";
import { confined, diff, passes, restore } from "./heal-gates.mjs";

/** Takes what `explain-failures.mjs` classified as a locator failure and traces the selector it
 *  names to the page object that declares it. `--dry-run` stops there. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY = path.resolve(HERE, "..", "..", "..");
const PAGES = path.join(REPOSITORY, "business-logic", "pages");
const REPORTS = path.join(process.cwd(), "reports");
const SCHEMA = path.join(HERE, "repair.schema.json");

/* A low-confidence answer is one the classifier itself says more than one category would fit, and
   opening a browser on it costs a suite run to learn nothing. */
const REPAIRABLE = ["high", "medium"];

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function read(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function files(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) return files(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

/* Playwright writes the selector into the call log of the step that waited on it, which is why the
   reduction keeps each step's own message. The result's message says only that the test timed out. */
const CALL_LOG = /(?:locator\((['"`])(.+?)\1\)|waiting for selector (['"`])(.+?)\3)/g;

function selectorsOf(failure) {
  const text = [
    failure.message ?? "",
    failure.trace ?? "",
    ...(failure.steps ?? []).map((step) => step.message ?? ""),
  ].join("\n");

  const found = new Set();
  for (const match of text.matchAll(CALL_LOG)) found.add(match[2] ?? match[4]);
  return [...found];
}

const CONSTANT = /^const\s+(\w+)\s*=\s*(['"])(.*?)\2\s*;/gm;
const BLOCK = /locators\s*=\s*\{/;
const ENTRY = /^\s*(\w+)\s*:\s*(.+?),?\s*$/;
const LITERAL = /^(['"`])(.*)\1$/;

/** Every selector a page object declares, with the line it is on. Page objects hold them as string
 *  literals in one `locators` object, so this is a read rather than a parse: a value built at call
 *  time is left unresolved and reported as such rather than guessed at. */
function declared() {
  const all = [];

  for (const file of files(PAGES)) {
    const source = readFileSync(file, "utf8");
    const lines = source.split("\n");
    const constants = new Map(
      [...source.matchAll(CONSTANT)].map(([, name, , value]) => [name, value]),
    );

    const start = lines.findIndex((line) => BLOCK.test(line));
    if (start === -1) continue;

    for (let at = start + 1; at < lines.length; at += 1) {
      if (/^\s*\};?\s*$/.test(lines[at])) break;
      const entry = ENTRY.exec(lines[at]);
      if (!entry) continue;

      const [, key, raw] = entry;
      const literal = LITERAL.exec(raw);
      if (!literal) continue;

      /* `${modal} .label-name-input` and the like: the prefix is a constant of the same file. */
      const selector = literal[2].replace(/\$\{(\w+)\}/g, (whole, name) =>
        constants.has(name) ? constants.get(name) : whole,
      );
      if (selector.includes("${")) continue;

      all.push({
        file: path.relative(REPOSITORY, file),
        line: at + 1,
        key,
        selector,
        pageObject: /export class (\w+)/.exec(source)?.[1],
      });
    }
  }

  return all;
}

function locate(selector, catalogue) {
  const found = catalogue.filter((entry) => entry.selector === selector);
  if (found.length === 1) return { ...found[0], selector };
  return {
    selector,
    unresolved:
      found.length === 0
        ? "no page object declares this selector"
        : `${found.length} page objects declare this selector`,
  };
}

function summarise(results) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;

  const proposed = results.filter((result) => result.proposed);
  const lines = ["## The locator to change", ""];

  if (proposed.length === 0) {
    lines.push(
      results.length === 0
        ? "No failure was attributed to a locator, so no repair was attempted."
        : "No repair passed its checks, so none is proposed. The explanation above stands.",
      "",
    );
  } else {
    lines.push(
      "| Page object | Key | From | To | Why | Verified by |",
      "| --- | --- | --- | --- | --- | --- |",
      ...proposed.map(
        (r) =>
          `| \`${r.file}:${r.line}\` | \`${r.key}\` | \`${r.from}\` | \`${r.to}\` | ${r.why} | ${r.verified} |`,
      ),
      "",
      "Nothing was committed or applied. The run still reports the failure the suite reported.",
      "",
    );
  }

  const rejected = results.filter((result) => !result.proposed);
  if (rejected.length > 0) {
    lines.push(
      "Not proposed:",
      "",
      ...rejected.map((r) => `- \`${r.key ?? r.test}\` — ${r.rejected}`),
      "",
    );
  }

  appendFileSync(summary, lines.join("\n"));
}

/* --summary-only renders an earlier run's results, which is how the three states it can report are
   checked without spending a suite on each. */
const render = option("--summary-only");
if (render) {
  summarise(read(render));
  process.exit(0);
}

const SEEDS = path.join("services", "playwright-bdd", "tests", "seeds");

/* A feature whose starting state is not named after it says so here. Falling through to the default
   opens a bare repository, which is not the world the scenario failed in. */
const SEED_OF = { "demo-e2e": "demo", "project-board": "board", login: "anonymous" };

/** The starting state whose world this scenario runs in, which the agent hands to
 *  `generator_setup_page` to get a page at all. */
function seedFor(fullName = "") {
  const feature = /features\/scenarios\/(.+?)\.feature/.exec(fullName)?.[1];
  const named = feature && path.join(SEEDS, `${SEED_OF[feature] ?? feature}.spec.ts`);
  return named && existsSync(path.join(REPOSITORY, named))
    ? named
    : path.join(SEEDS, "seed.spec.ts");
}

const explanations = read(option("--explanations", path.join(REPORTS, "explanation.json")));
const failures = read(option("--failures", path.join(REPORTS, "failures.json")));

/* The classifier drops everything but its answer, so the payload that carries the call log is
   joined back on the pair that identified it there. */
const payloads = new Map(failures.map((f) => [`${f.test}|${f.failingStep ?? ""}`, f]));

const repairable = explanations.filter(
  (e) => e.category === "locator" && REPAIRABLE.includes(e.confidence),
);

/* Counted over every explanation, not only the repairable ones: a scenario whose other failure was
   read as timing still cannot pass on a locator alone. */
const failuresOf = new Map();
for (const explanation of explanations) {
  failuresOf.set(explanation.test, (failuresOf.get(explanation.test) ?? 0) + 1);
}

console.log(
  `${repairable.length} of ${explanations.length} failure(s) attributed to a locator worth opening a page for`,
);

const catalogue = declared();

/** One broken locator fails every scenario that reaches it, and each arrives as its own failure
 *  naming the same key. Repairing it once repairs all of them, so they are collapsed. */
function distinct(targets) {
  const byKey = new Map();
  /* A scenario carrying a second failure cannot go green from a locator, so every attempt on it
     buys a re-run that could not have passed. */
  const failures = failuresOf;

  const better = (a, b) =>
    a.alone !== b.alone ? a.alone : a.seeded !== b.seeded ? a.seeded : false;

  for (const target of targets) {
    for (const candidate of target.candidates) {
      const key = `${candidate.file}|${candidate.key}`;
      const rank = {
        alone: (failures.get(target.test) ?? 1) === 1,
        seeded: !target.seed.endsWith("seed.spec.ts"),
      };
      const kept = byKey.get(key);
      if (!kept || better(rank, kept.rank)) {
        byKey.set(key, { ...target, candidates: [candidate], rank });
      }
    }
  }

  const unresolved = targets.filter((target) => target.candidates.length === 0);
  return [...byKey.values(), ...unresolved];
}

const targets = repairable.map((explanation) => {
  const payload = payloads.get(`${explanation.test}|${explanation.failingStep ?? ""}`);
  const found = selectorsOf(payload ?? {}).map((selector) => locate(selector, catalogue));

  return {
    test: explanation.test,
    seed: seedFor(payload?.fullName),
    failingStep: explanation.failingStep,
    browsers: explanation.browsers ?? [],
    reasoning: explanation.reasoning,
    candidates: found.filter((entry) => !entry.unresolved),
    unresolved: found.filter((entry) => entry.unresolved),
  };
});

for (const target of distinct(targets)) {
  for (const candidate of target.candidates) {
    console.log(
      `  ${target.test}: "${candidate.selector}" is ${candidate.pageObject}.locators.${candidate.key} (${candidate.file}:${candidate.line})`,
    );
  }
  for (const entry of target.unresolved) {
    console.log(`  ${target.test}: "${entry.selector}" — ${entry.unresolved}`);
  }
  if (target.candidates.length === 0 && target.unresolved.length === 0) {
    console.log(`  ${target.test}: the payload names no selector`);
  }
}

mkdirSync(REPORTS, { recursive: true });
writeFileSync(path.join(REPORTS, "repairs.json"), `${JSON.stringify(targets, null, 2)}\n`);

function prompt(target, candidate, rejection) {
  return `A Playwright BDD scenario failed on a locator that no longer matches anything, and the
page is still being served. Find what replaced the element and change the one selector.

Scenario: ${target.test}
Failing step: ${target.failingStep}
Why it was read as a locator failure: ${target.reasoning}

The selector is \`${candidate.selector}\`, declared as \`${candidate.key}\` in
${candidate.file}:${candidate.line}, which ${candidate.pageObject} owns.

Open the page with \`generator_setup_page\`, handing it the seed \`${target.seed}\`, which puts a
browser in the world this scenario runs in. The other browser tools act on the page that opens, so
nothing works before it.

Then reach what the failing step was looking at with \`browser_navigate\`, and find the element in
two steps, because one tool alone will not show you it.

\`browser_snapshot\` gives you the page by role and accessible name, and that is how you identify
which element the scenario means. It is the accessibility tree, so it carries no attributes and no
class names - do not try to write a selector from it. Once you know which element it is, read the
DOM around it with \`browser_evaluate\`, returning the \`outerHTML\` of that element and of the one
that contains it. The classes you need are there, and a selector built from them is what the page
object can hold; one built from the shape of the tree breaks on the next release.

Answer from what those two tools showed you and from nothing else. Not from the repository's own documents, not from
what you know about this application, not by fetching the HTML with a shell command. This run is
checked against your transcript: an answer given without a snapshot in it is discarded even when the
selector turns out to be right, because what is being established is that the page was read. Prefer a selector of the same kind as the one it replaces: these page
objects address the browser with CSS strings, and a locator written any other way cannot be stored
in that object.

Change that one value and nothing else. Not the step definitions, not the feature, not the
assertion, not another method of the page object - a change anywhere else is rejected whole.

Do not run the tests. The repository re-runs the scenario and then the suite once you are done, and
a change that does not survive both is discarded, so running them yourself buys nothing and a test
process you start or stop is one this run was already using.

Say at the end which selector you put there and what you saw on the page that told you so.
${
  rejection
    ? `
An earlier attempt at this already went back: ${rejection}. That is the repository's verdict on it,
not a hint - whatever you put there last time did not survive, so look again rather than reasoning
your way to the same answer. The file has been restored to the broken selector it started from.`
    : ""
}`;
}

if (process.argv.includes("--dry-run")) process.exit(0);

const ATTEMPTS = Number(process.env.HEAL_ATTEMPTS ?? 2);

/* The job this runs in is bounded, and an attempt costs an agent plus a scenario plus a suite. Past
   the deadline no further attempt is started, so a repair that is taking too long ends the step
   rather than the job: a run killed by its own timeout publishes nothing at all. */
const DEADLINE = Date.now() + Number(process.env.HEAL_BUDGET_MINUTES ?? 12) * 60_000;

function attempt(target, candidate, rejection) {
  const browser = target.browsers[0] ?? "chrome";
  const before = readFileSync(path.join(REPOSITORY, candidate.file), "utf8");

  const answerFile = path.join(REPORTS, `repair-${candidate.key}.answer.json`);
  const transcript = ask(prompt(target, candidate, rejection), {
    schema: SCHEMA,
    answer: answerFile,
  });

  const confinement = confined();
  if (!confinement.ok) return { rejected: confinement.why };

  const answer = existsSync(answerFile) ? read(answerFile) : {};
  /* Checked from the transcript first and taken from the answer second: an agent that could not
     open the page will still say it read one, and the repository holds the change documents that
     describe this very repair. */
  if (!readThePage(transcript)) return { rejected: "it never read the page" };
  if (answer.observedInThePage === false) {
    return { rejected: "it says it did not read this in the page" };
  }

  if (!passes([`run:${browser}`, "--", "-g", target.test])) {
    return { rejected: "the scenario still fails with it" };
  }

  /* Last because it is the expensive one, and because a repair to a fragment several pages share
     can mend this scenario and break another. */
  if (!passes([`run:${browser}`])) {
    return { rejected: `the suite no longer passes on ${browser} with it` };
  }

  /* Read back from the file rather than taken from the answer, which can carry the whole
     declaration rather than the value. */
  const after = readFileSync(path.join(REPOSITORY, candidate.file), "utf8");
  const wrote = new RegExp(`${candidate.key}\\s*:\\s*["'\`](.+?)["'\`]`).exec(after)?.[1];

  return {
    proposed: true,
    file: candidate.file,
    line: candidate.line,
    key: candidate.key,
    from: candidate.selector,
    to: wrote ?? answer.selector ?? "see the patch",
    why: answer.why ?? "—",
    verified: `${target.test} on ${browser}, then the suite`,
    changed: readFileSync(path.join(REPOSITORY, candidate.file), "utf8") !== before,
  };
}

session();

const results = [];
for (const target of distinct(targets)) {
  for (const candidate of target.candidates) {
    let outcome;
    /* A rejected attempt is asked again carrying the gate that rejected it: the tree is back to the
       broken selector either way, so without it the second attempt is the first one again. */
    for (let round = 0; round < ATTEMPTS && !outcome?.proposed; round += 1) {
      if (Date.now() > DEADLINE) {
        outcome = { rejected: "the run ran out of the time it is allowed in the job" };
        break;
      }
      outcome = attempt(target, candidate, outcome?.rejected);
      if (!outcome.proposed) restore();
    }
    results.push({ test: target.test, key: candidate.key, ...outcome });
    /* The patch is the evidence, so it is taken before the tree is put back. */
    if (outcome.proposed) {
      writeFileSync(path.join(REPORTS, `repair-${candidate.key}.patch`), diff());
      restore();
    }
  }
  for (const entry of target.unresolved) {
    results.push({ test: target.test, rejected: entry.unresolved });
  }
}

writeFileSync(path.join(REPORTS, "repairs.json"), `${JSON.stringify(results, null, 2)}\n`);
summarise(results);

console.log(`${results.filter((r) => r.proposed).length} repair(s) proposed, none applied`);
