import "dotenv/config";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Turns the raw Allure results of a failed run into reports/failures.json, then asks a model to
 *  explain each of them into reports/explanation.json. `--dry-run` stops after the first. */

const RESULTS = path.join(process.cwd(), "allure-results");
const REPORTS = path.join(process.cwd(), "reports");
const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), "explanation.schema.json");
/* The reader is pointed at the repository, three levels up from services/<suite>/scripts. */
const REPOSITORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/* Fetched on demand rather than installed as a dependency: the Playwright image does not carry it,
   and a green run never needs it. */
const CODEX = "@openai/codex@0.157.1";
const MESSAGE_LIMIT = 2000;
const TRACE_LIMIT = 4000;

/* Everything else counts as a failure, so a status nobody anticipated is explained rather than
   dropped. A skipped test never ran and has nothing to explain. */
const NOT_A_FAILURE = ["passed", "skipped"];

function labelled(result, name) {
  return (result.labels ?? []).filter((label) => label.name === name).map((label) => label.value);
}

/** A passing test can hold nested steps that failed and were retried, so only the scenario's own
 *  steps are read: the reader is looking for the behaviour that broke, not the mechanics under it.
 *  An attachment is recorded as a step without a status, and a test killed by a timeout has no
 *  failing step at all. */
function failingStep(result) {
  return (result.steps ?? []).find((step) => step.status && !NOT_A_FAILURE.includes(step.status))
    ?.name;
}

/* A path and a line, as a stack frame writes them, absolute or relative to the repository. */
const FRAME = /([\w./-]+\.(?:ts|mjs|js)):(\d+)(?::\d+)?/g;
const SOURCE_WINDOW = 12;
const SOURCE_LIMIT = 3;

/** The lines around each frame the failure names, read here rather than left for the reader to go
 *  and fetch. A payload records what an assertion returned and never what it means, and asking a
 *  model to open the file makes the answer depend on a sandbox that behaves differently in a
 *  container than it does on a laptop. Reading it in Node is the same everywhere, costs one round
 *  trip instead of several, and puts in the payload exactly what was shown. */
function sources(text) {
  const found = new Map();

  for (const [, file, line] of text.matchAll(FRAME)) {
    const absolute = path.resolve(REPOSITORY, file.replace(`${REPOSITORY}/`, ""));
    /* Only inside the repository, and never the generated spec, which is a compilation of the
       feature rather than anything a person wrote. */
    if (!absolute.startsWith(REPOSITORY) || absolute.includes(".features-gen")) continue;
    if (found.has(absolute) || found.size >= SOURCE_LIMIT) continue;

    let lines;
    try {
      lines = readFileSync(absolute, "utf8").split("\n");
    } catch {
      continue;
    }

    const at = Number(line);
    const from = Math.max(1, at - SOURCE_WINDOW);
    found.set(absolute, {
      file: path.relative(REPOSITORY, absolute),
      line: at,
      excerpt: lines
        .slice(from - 1, at + SOURCE_WINDOW)
        .map((content, index) => `${from + index}${from + index === at ? " >" : "  "} ${content}`)
        .join("\n"),
    });
  }

  return [...found.values()];
}

function reduce(result) {
  const details = result.statusDetails ?? {};

  return {
    test: result.name,
    fullName: result.fullName,
    browser: labelled(result, "parentSuite")[0],
    tags: labelled(result, "tag"),
    status: result.status,
    failingStep: failingStep(result),
    message: (details.message ?? "").slice(0, MESSAGE_LIMIT),
    trace: (details.trace ?? "").slice(0, TRACE_LIMIT),
    sources: sources(`${details.trace ?? ""}\n${details.message ?? ""}`),
    steps: (result.steps ?? []).map((step) => ({
      name: step.name,
      status: step.status,
      /* The result's own message says only that the test timed out. The step's carries the call
         log, and with it the locator that was being waited on. */
      message: (step.statusDetails?.message ?? "").slice(0, MESSAGE_LIMIT) || undefined,
    })),
  };
}

function results() {
  let files;
  try {
    files = readdirSync(RESULTS).filter((file) => file.endsWith("-result.json"));
  } catch {
    return [];
  }

  return files.map((file) => JSON.parse(readFileSync(path.join(RESULTS, file), "utf8")));
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

/* --input takes payloads already reduced, so an explanation can be asked again for a run that is
   long gone. That is how the corpus is scored. */
const input = option("--input");
const output = option("--output") ?? path.join(REPORTS, "explanation.json");

/* Three browsers retrying the same broken assertion produce nine results and one defect. They are
   collapsed by the step that failed, keeping the attempt with the most to read, because a table
   with the same row nine times is what a reader skips. */
function distinct(reduced) {
  const groups = new Map();

  for (const failure of reduced) {
    const key = `${failure.test}|${failure.failingStep ?? ""}`;
    const seen = groups.get(key);
    const weight = failure.message.length + failure.trace.length;

    if (!seen || weight > seen.weight) {
      groups.set(key, {
        weight,
        failure,
        browsers: seen?.browsers ?? new Set(),
        attempts: seen?.attempts ?? 0,
      });
    }
    const group = groups.get(key);
    if (failure.browser) group.browsers.add(failure.browser);
    group.attempts += 1;
  }

  return [...groups.values()].map(({ failure, browsers, attempts }) => ({
    ...failure,
    browsers: [...browsers].sort(),
    attempts,
  }));
}

const failures = input
  ? JSON.parse(readFileSync(input, "utf8"))
  : distinct(
      results()
        .filter((result) => !NOT_A_FAILURE.includes(result.status))
        .map(reduce),
    );

mkdirSync(REPORTS, { recursive: true });
if (!input) {
  writeFileSync(path.join(REPORTS, "failures.json"), `${JSON.stringify(failures, null, 2)}\n`);
}

console.log(`${failures.length} failing test(s) to explain`);

if (process.argv.includes("--dry-run") || failures.length === 0) process.exit(0);

/* A replayed payload was captured from a state of the repository that no longer exists: the seed it
   broke has since been fixed, the assertion it inverted restored. Reading today's code would hand
   the reader evidence that contradicts the payload, so a replay is answered blind, which is what
   the corpus was labelled under. A live run reads, because there the two always agree. */
function prompt(failure) {
  return `A Playwright BDD test failed in continuous testing. Explain why.

${JSON.stringify(failure, null, 2)}

${
  failure.sources?.length
    ? `\`sources\` carries the lines around each frame the failure named, with the failing one marked
\`>\`, read before you were asked. A payload records what an assertion returned and never what it
means, so \`Expected: false Received: true\` is answered by the line that asserted it. Open what the
repository holds when the excerpts do not settle it - the page object a step calls, the fixture that
seeded it - and stop once they do. This is one question, not an investigation.`
    : `No source excerpts accompany this payload, which is how a replayed failure arrives: the state
that produced it is gone, so answer from what the payload holds rather than from the repository as
it stands today.`
}
The payload holds the scenario's own steps in the words of its feature file, the status of each,
and the error the runner recorded. \`browsers\` and \`attempts\` say how widely it reproduced: the
same failure on all three browsers is rarely a flake, and one browser retried into a pass often is.

Answer with the category that fits:
- locator: the element was looked for in a way the page no longer matches.
- timing: the page was asked for something before it was there, or a wait returned too early.
- data: the test's own data or seeded state did not hold.
- environment: a credential, a service or a variable the run needed was missing or wrong.
- application: the application under test, or the browser, behaved wrongly.
- unknown: the payload does not support any of the above.

"Before Hooks" and "After Hooks" are the framework seeding and tearing down the scenario's own
state. What fails there happened to this run, so read it as evidence about the same failure rather
than as an unrelated one.

Name the one that fits best and say how sure you are: low when more than one of them would fit what
the payload shows, high when it points at a single cause. Reserve unknown for a payload that
supports none of them at all, such as a test with no failing step and nothing but a bare timeout. A
call log naming what was waited on is evidence, not the absence of it.`;
}

/* codex reads its credential from its own home rather than from the environment, so the key has to
   be handed over once before any call. The home is a temporary one: it holds the key, and nothing
   that holds the key may sit in the directory the run uploads. */
function login() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  process.env.CODEX_HOME = mkdtempSync(path.join(tmpdir(), "codex-"));

  const { status, stderr } = spawnSync("npx", ["--yes", CODEX, "login", "--with-api-key"], {
    input: process.env.OPENAI_API_KEY,
    encoding: "utf8",
  });

  if (status !== 0) throw new Error(`codex login failed: ${stderr.trim()}`);
}

function explain(failure, index) {
  const answer = path.join(tmpdir(), `explanation-${process.pid}-${index}.json`);
  const { status } = spawnSync(
    "npx",
    [
      "--yes",
      CODEX,
      "exec",
      "--ephemeral",
      /* Not read-only, which is what this wants and cannot have. codex sandboxes with Landlock and
         seccomp and falls back to bubblewrap, and the job's container offers none of the three: it
         gives up without saying so, disables every tool and answers anyway, which is
         openai/codex#46246 and is why the same failure was answered correctly on a laptop and twice
         wrongly on CI. The container is the isolation boundary instead - built per job, its Gitea
         disposable, destroyed after - which is the condition that documentation puts on this flag.
         Revisit when codex reports the failure rather than swallowing it. */
      "-s",
      "danger-full-access",
      /* Pinned rather than left to codex's default, which is the frontier model and is not what a
         classifier this size should cost. codex 0.157.1 carries metadata for that one alone and
         warns that it is falling back for every other id, which is accepted here: the fallback
         answered the live failure correctly, and the alternative is paying frontier prices on every
         red run. */
      "-m",
      process.env.CODEX_MODEL ?? "gpt-5-mini",
      /* codex defaults this to none, which is what a classifier asked to read a file before
         answering most needs. Raised here rather than left to the default. */
      "-c",
      `model_reasoning_effort="${process.env.CODEX_REASONING ?? "medium"}"`,
      "-C",
      REPOSITORY,
      "--output-schema",
      SCHEMA,
      "-o",
      answer,
      "-",
    ],
    /* codex names every file it opens as it opens them, and that transcript is the only evidence
       that an answer was read rather than guessed. It goes to the step log rather than into a
       variable, so a run can be audited from the page that reports it. */
    { input: prompt(failure), encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
  );

  if (status !== 0) throw new Error(`codex exec failed for "${failure.test}": status ${status}`);

  return JSON.parse(readFileSync(answer, "utf8"));
}

login();

/* How widely it reproduced is measured, not judged, so it stays out of the schema and is carried
   beside the answer instead. */
const explanations = failures.map((failure, index) => ({
  ...explain(failure, index),
  browsers: failure.browsers ?? [],
  attempts: failure.attempts ?? 1,
}));

writeFileSync(output, `${JSON.stringify(explanations, null, 2)}\n`);

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  const rows = explanations.map(
    (e) =>
      `| ${e.test} | ${e.failingStep || "—"} | ${e.category} | ${e.confidence} | ${e.firstThingToCheck} |`,
  );
  appendFileSync(
    summary,
    [
      "## Why the tests failed",
      "",
      "| Test | Step | Category | Confidence | Check first |",
      "| --- | --- | --- | --- | --- |",
      ...rows,
      "",
    ].join("\n"),
  );
}

console.log(`${explanations.length} explanation(s) written to ${output}`);
