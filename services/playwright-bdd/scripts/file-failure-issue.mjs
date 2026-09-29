import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/** Files what `explain-failures.mjs` classified as an issue on the repository that holds the code,
 *  or comments on the one already open for the same failure. */

/* The only script here that addresses the instance hosting this repository rather than the one
   under test, which is why it reads none of the GITEA_BASE_URL family: those point at the
   disposable Gitea the suites create and delete users on. On CI the server and the repository come
   from the runner; locally they are given. */
const SERVER = process.env.GITEA_ISSUE_SERVER ?? process.env.GITHUB_SERVER_URL;
const REPOSITORY = process.env.GITEA_ISSUE_REPOSITORY ?? process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITEA_TOKEN_ISSUES;

/* An environment failure is a container that did not start or a variable that was not set. Nothing
   in the repository changes because of it, so it is reported in the run and never filed. */
const NOT_WORTH_FILING = ["environment"];

const explanations = JSON.parse(
  readFileSync(path.join(process.cwd(), "reports", "explanation.json"), "utf8"),
).filter((explanation) => !NOT_WORTH_FILING.includes(explanation.category));

if (explanations.length === 0) {
  console.log("nothing to file");
  process.exit(0);
}

for (const required of [SERVER, REPOSITORY, TOKEN]) {
  if (!required)
    throw new Error("the server, the repository and GITEA_TOKEN_ISSUES are all needed");
}

const API = `${SERVER.replace(/\/$/, "")}/api/v1/repos/${REPOSITORY}`;
const RUN = process.env.GITHUB_RUN_ID
  ? `${SERVER}/${REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined;

async function gitea(endpoint, body) {
  const response = await fetch(`${API}${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw new Error(`${endpoint} answered ${response.status}`);
  return response.json();
}

/* The failing step rather than the message: the message carries a generated organization name, so
   the same defect would fingerprint differently on every run and never find its own issue. */
function fingerprint({ test, failingStep }) {
  return createHash("sha1")
    .update(`${test}|${failingStep ?? ""}`)
    .digest("hex")
    .slice(0, 12);
}

function body(explanation, marker) {
  const { category, confidence, failingStep, reasoning, firstThingToCheck, browsers, attempts } =
    explanation;

  return [
    `**${category}**, confidence ${confidence}. Classified from the run's own Allure results by \`explain-failures.mjs\`.`,
    "",
    `- **Failing step:** ${failingStep || "none recorded"}`,
    `- **Browsers:** ${(browsers ?? []).join(", ") || "not recorded"} (${attempts ?? 1} attempt(s))`,
    `- **Check first:** ${firstThingToCheck}`,
    "",
    "### Why",
    "",
    reasoning,
    "",
    RUN ? `[The run](${RUN})` : "",
    "",
    marker,
  ].join("\n");
}

const open = await gitea("/issues?state=open&type=issues&limit=50");

for (const explanation of explanations) {
  const marker = `<!-- ct-failure: ${fingerprint(explanation)} -->`;
  const existing = open.find((issue) => (issue.body ?? "").includes(marker));

  if (existing) {
    await gitea(`/issues/${existing.number}/comments`, {
      body: `Failed again${RUN ? ` in [this run](${RUN})` : ""}: **${explanation.category}**, confidence ${explanation.confidence}. ${explanation.firstThingToCheck}`,
    });
    console.log(`commented on #${existing.number} (${explanation.test})`);
    continue;
  }

  const browsers = (explanation.browsers ?? []).join(", ");
  const created = await gitea("/issues", {
    title: `[CT] ${explanation.category} — ${explanation.test}${browsers ? ` (${browsers})` : ""}`,
    body: body(explanation, marker),
  });
  console.log(`opened #${created.number} (${explanation.test})`);
}
