import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The agent the healer drives the browser with: a codex session holding the Playwright MCP server
 *  and nothing it does not need. `--check` reports which of its tools are reachable. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY = path.resolve(HERE, "..", "..", "..");
const CODEX = "@openai/codex@0.157.1";
const CONFIG = path.join("services", "playwright-bdd", "playwright.config.ts");

/* What the healer has to be able to do: reach the page, read it by role and accessible name, and
   ask for a locator. Running the tests is not among them - the repository does that afterwards, and
   an agent that runs them spends its budget on the runner and can stop a process this job is using.
   Everything else on the server stays unreachable, because
   `default_tools_approval_mode` is per server and pre-approves whatever the server exposes —
   `browser_run_code_unsafe` and `browser_evaluate` among them, which run arbitrary JavaScript in a
   job that holds an administrative token. Measured in #129 on codex-cli 0.157.1. */
const TOOLS = [
  "browser_navigate",
  "browser_snapshot",
  "browser_generate_locator",
  "browser_click",
  "browser_type",
  "browser_press_key",
  "browser_wait_for",
  "browser_console_messages",
  /* The snapshot is the accessibility tree and carries no attributes, while a page object holds a
     CSS string, so reading the DOM is what turns the one into the other. */
  "browser_evaluate",
  /* The browser_* tools act on a page somebody opened: generator_setup_page is what opens one, from
     a starting state under tests/seeds/. Without it browser_navigate fails and the agent answers
     from whatever else it can reach. */
  "generator_setup_page",
  "generator_read_log",
];

/* browser_evaluate runs in the page under test, which is the disposable Gitea this job created.
   browser_run_code_unsafe runs outside it, and generator_write_test writes a file the diff gate
   would reject anyway. */
const FORBIDDEN = ["browser_run_code_unsafe", "generator_write_test"];

function toml(values) {
  return values.map((value) => JSON.stringify(value)).join(", ");
}

/* The suite reads these by name: the base URL, and one account, password and token per browser. */
function environment() {
  return Object.entries(process.env)
    .filter(([name]) => name.startsWith("GITEA_") && !name.startsWith("GITEA_TOKEN_ISSUES"))
    .map(([name, value]) => `${name} = ${JSON.stringify(value)}`)
    .join(", ");
}

/** codex reads its credential and its servers from its own home, so both are written to a
 *  temporary one. Nothing holding the key may sit in the directory the run uploads. */
export function session() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  const home = mkdtempSync(path.join(tmpdir(), "codex-heal-"));
  process.env.CODEX_HOME = home;

  writeFileSync(
    path.join(home, "config.toml"),
    [
      `[mcp_servers.playwright-test]`,
      `command = "npx"`,
      `args = [${toml(["playwright", "run-test-mcp-server", "--headless", "-c", CONFIG])}]`,
      /* The only value that lets a tool call through with stdin closed: auto, prompt, writes and
         unset all answer "MCP tool call requires approval, but approval policy is never". */
      /* codex hands an MCP server no environment of its own, and the server launches the suite's
         fixtures, which read the accounts and tokens the job provisioned. */
      `env = { ${environment()} }`,
      `default_tools_approval_mode = "approve"`,
      `enabled_tools = [${toml(TOOLS)}]`,
      `startup_timeout_sec = 120`,
      "",
    ].join("\n"),
  );

  const { status, stderr } = spawnSync("npx", ["--yes", CODEX, "login", "--with-api-key"], {
    input: process.env.OPENAI_API_KEY,
    encoding: "utf8",
  });
  if (status !== 0) throw new Error(`codex login failed: ${stderr.trim()}`);

  return home;
}

/** One question, with the transcript going to the step log: codex names every tool it calls as it
 *  calls it, and that is the only evidence the answer was driven rather than written. */
const maxBuffer = 64 * 1024 * 1024;

export function ask(prompt, { schema, answer, timeout = 900_000 } = {}) {
  const { status, stdout, stderr } = spawnSync(
    "npx",
    [
      "--yes",
      CODEX,
      "exec",
      "--ephemeral",
      /* The container offers neither Landlock, seccomp nor bubblewrap, and codex disables every
         tool and answers anyway rather than saying so (openai/codex#46246). The job's container is
         the isolation boundary instead: built per job, its Gitea disposable, destroyed after. */
      "-s",
      "danger-full-access",
      /* The same model the explainer pins, and for the same reason: this fires on every red run
         classified as a locator, and a step that size should not cost frontier prices. CODEX_MODEL
         raises it when a repair turns out to need more. */
      "-m",
      process.env.CODEX_MODEL ?? "gpt-5-mini",
      "-c",
      `model_reasoning_effort="${process.env.CODEX_REASONING ?? "medium"}"`,
      "-C",
      REPOSITORY,
      ...(schema ? ["--output-schema", schema] : []),
      ...(answer ? ["-o", answer] : []),
      "-",
    ],
    { input: prompt, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout, maxBuffer },
  );

  /* Printed rather than swallowed, and returned as well: codex names every tool call as it makes
     one, and that transcript is the only record of whether the page was opened at all. Both streams,
     because the tool calls are on stderr and only the closing message is on stdout. */
  const transcript = `${stdout ?? ""}${stderr ?? ""}`;
  process.stdout.write(transcript);
  if (status !== 0) throw new Error(`codex exec failed: status ${status}`);

  return transcript;
}

/** Whether the transcript shows the page being read. An agent that could not open it will answer
 *  from the repository, which holds the change documents describing the very repair it is making. */
export function readThePage(transcript) {
  return /playwright-test\/browser_snapshot \(completed\)/.test(transcript);
}

if (process.argv.includes("--check")) {
  session();
  ask(
    `List the tools the playwright-test MCP server has given you, by name, one per line.
Then say, for each of ${FORBIDDEN.join(", ")}, whether it is among your tools.
Call no other tool, and change no file.`,
  );
}
