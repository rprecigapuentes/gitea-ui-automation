import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Turns the raw axe results in reports/accessibility/ into summary.html beside them. */

const DIRECTORY = path.join(process.cwd(), "reports", "accessibility");
const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"];
const SAMPLE_ELEMENTS = 8;

/* A tag is either a conformance level (wcag2aa, wcag21a) or a success criterion (wcag143). */
const LEVEL_TAG = /^wcag2\d*(a{1,3})$/;
const CRITERION_TAG = /^wcag(\d)(\d)(\d+)$/;

/** The criterion digits read as principle, guideline, then the rest, so wcag1410 is 1.4.10.
 *  A rule at more than one level is reported at the lowest, which is the one that binds. */
function wcagOf(tags) {
  const levels = tags.flatMap((tag) => LEVEL_TAG.exec(tag)?.[1] ?? []).sort();
  const criteria = tags.flatMap((tag) => {
    const parts = CRITERION_TAG.exec(tag);
    return parts ? `${parts[1]}.${parts[2]}.${parts[3]}` : [];
  });

  return { criteria, level: levels[0]?.toUpperCase() };
}

function criteriaIn(all, bucket) {
  const found = new Set();

  for (const { result } of all)
    for (const rule of result[bucket]) for (const id of wcagOf(rule.tags).criteria) found.add(id);

  return found;
}

function scans() {
  return readdirSync(DIRECTORY)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const separator = file.lastIndexOf("-");
      return {
        file,
        page: file.slice(0, separator),
        browser: file.slice(separator + 1, -".json".length),
        result: JSON.parse(readFileSync(path.join(DIRECTORY, file), "utf8")),
      };
    })
    .sort((a, b) => a.page.localeCompare(b.page) || a.browser.localeCompare(b.browser));
}

/** One entry per distinct rule, which is the unit a bug report is written against. */
function rules(all) {
  const byRule = new Map();

  for (const { page, result } of all) {
    for (const violation of result.violations) {
      const rule = byRule.get(violation.id) ?? {
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        wcag: wcagOf(violation.tags),
        pages: new Map(),
        worst: violation,
      };
      rule.pages.set(page, Math.max(rule.pages.get(page) ?? 0, violation.nodes.length));
      if (violation.nodes.length > rule.worst.nodes.length) rule.worst = violation;
      byRule.set(violation.id, rule);
    }
  }

  return [...byRule.values()].sort(
    (a, b) =>
      IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) ||
      b.worst.nodes.length - a.worst.nodes.length,
  );
}

function escape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function reasonOf(node) {
  return (node.failureSummary ?? "")
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

/** One reason across every sample means the rule says the same thing on each, so it is stated
 *  once above them instead of repeated under each element. */
function elementSamples(violation) {
  const shown = violation.nodes.slice(0, SAMPLE_ELEMENTS);
  const rest = violation.nodes.length - shown.length;
  const reasons = new Set(shown.map(reasonOf).filter(Boolean));
  const shared = reasons.size === 1 ? [...reasons][0] : "";

  const items = shown
    .map((node) => {
      const reason = shared ? "" : reasonOf(node);
      return `<li>
        <code class="target">${escape(node.target.flat().join(" "))}</code>
        <pre>${escape(truncate(node.html, 400))}</pre>
        ${reason ? `<p class="reason">${escape(truncate(reason, 300))}</p>` : ""}
      </li>`;
    })
    .join("");

  const heading = shared ? `<p class="reason shared">${escape(truncate(shared, 300))}</p>` : "";
  const more = rest > 0 ? `<p class="more">and ${rest} more, in the raw result</p>` : "";
  return `${heading}<ul class="elements">${items}</ul>${more}`;
}

function ruleCard(rule) {
  const pages = [...rule.pages.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, count]) => `<span class="pill">${escape(page)} <b>${count}</b></span>`)
    .join("");
  const elements = rule.worst.nodes.length;
  const { criteria, level } = rule.wcag;
  const wcag = criteria.length
    ? `<span class="sc">WCAG ${criteria.join(", ")}${level ? ` · Level ${level}` : ""}</span>`
    : "";

  return `<details class="rule">
    <summary>
      <span class="impact ${rule.impact}">${rule.impact}</span>
      <code class="rule-id">${escape(rule.id)}</code>
      <span class="help">${escape(rule.help)}</span>
      ${wcag}
      <span class="count">${elements} element${elements === 1 ? "" : "s"}</span>
    </summary>
    <div class="rule-body">
      <p class="description">${escape(rule.description)}</p>
      <p class="pages">${pages}</p>
      ${elementSamples(rule.worst)}
      <p><a href="${escape(rule.helpUrl)}">How to fix this, on Deque University</a></p>
    </div>
  </details>`;
}

function scanTable(all) {
  const rows = all
    .map(({ page, browser, result, file }) => {
      const counts = Object.fromEntries(IMPACT_ORDER.map((impact) => [impact, 0]));
      for (const violation of result.violations) counts[violation.impact] += 1;
      const cells = IMPACT_ORDER.map(
        (impact) => `<td class="${counts[impact] ? impact : "zero"}">${counts[impact] || "—"}</td>`,
      ).join("");
      return `<tr>
        <td>${escape(page)}</td>
        <td>${escape(browser)}</td>
        <td><b>${result.violations.length}</b></td>
        ${cells}
        <td class="incomplete">${result.incomplete.length}</td>
        <td><a class="raw" href="${escape(file)}">${escape(file)}</a></td>
      </tr>`;
    })
    .join("");

  return `<table>
    <thead><tr>
      <th>Page</th><th>Browser</th><th>Violations</th>
      ${IMPACT_ORDER.map((impact) => `<th>${impact}</th>`).join("")}
      <th>Needs review</th><th>Full result</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function statTile(value, label, className = "") {
  return `<div class="tile ${className}"><b>${value}</b><span>${label}</span></div>`;
}

const STYLE = `
:root {
  --bg: #ffffff; --panel: #f6f7f9; --line: #d8dce2; --ink: #16191d; --muted: #5b626b;
  --code: #eceff3; --link: #1f5fbf;
  --critical: #b3261e; --serious: #8a4a12; --moderate: #6b5510; --minor: #4a5560;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14171a; --panel: #1c2024; --line: #2e343a; --ink: #e8eaed; --muted: #a2aab3;
    --code: #22272c; --link: #8ab4f8;
    --critical: #f2837a; --serious: #e0a35f; --moderate: #d3c06a; --minor: #9aa5b1;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 2rem 1rem 4rem; background: var(--bg); color: var(--ink);
  font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
main { max-width: 68rem; margin: 0 auto; }
h1 { font-size: 1.5rem; margin: 0 0 .35rem; }
h2 { font-size: .95rem; margin: 2.5rem 0 .75rem; text-transform: uppercase;
     letter-spacing: .07em; color: var(--muted); }
.lede { color: var(--muted); margin: 0 0 1.75rem; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
a { color: var(--link); }

.tiles { display: flex; flex-wrap: wrap; gap: .75rem; }
.tile { flex: 1 1 8rem; background: var(--panel); border: 1px solid var(--line);
        border-radius: .5rem; padding: .85rem 1rem; }
.tile b { display: block; font-size: 1.85rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile span { color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; }
.tile.critical b { color: var(--critical); }
.tile.serious b { color: var(--serious); }

.rule { border: 1px solid var(--line); border-radius: .5rem; margin-bottom: .6rem;
        background: var(--panel); }
.rule summary { cursor: pointer; padding: .8rem 1rem; display: flex; flex-wrap: wrap;
                gap: .6rem; align-items: baseline; }
.rule summary::marker { color: var(--muted); }
.rule[open] summary { border-bottom: 1px solid var(--line); }
.impact { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700;
          border: 1px solid currentColor; border-radius: 1rem; padding: .1rem .5rem; }
.impact.critical { color: var(--critical); }
.impact.serious { color: var(--serious); }
.impact.moderate { color: var(--moderate); }
.impact.minor { color: var(--minor); }
.rule-id { font-weight: 600; }
.help { color: var(--muted); flex: 1 1 14rem; }
.sc { font-size: .78rem; background: var(--code); border-radius: .3rem; padding: .1rem .45rem;
      color: var(--muted); white-space: nowrap; }
.count { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.rule-body { padding: 1rem; }
.description { margin-top: 0; }
.pill { display: inline-block; background: var(--code); border-radius: 1rem;
        padding: .1rem .6rem; margin-right: .4rem; font-size: .85rem; }
.elements { list-style: none; margin: 1rem 0 0; padding: 0; }
.elements li { border-left: 2px solid var(--line); padding: 0 0 0 .85rem; margin-bottom: 1rem; }
.target { color: var(--muted); font-size: .84rem; word-break: break-all; }
.elements pre { background: var(--code); border-radius: .35rem; padding: .6rem .7rem;
                margin: .35rem 0; overflow-x: auto; font-size: .82rem; }
.reason { margin: .25rem 0 0; font-size: .87rem; }
.reason.shared { margin: .9rem 0 0; color: var(--ink); }
.more { color: var(--muted); font-size: .87rem; }

table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid var(--line); }
th { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
td.critical { color: var(--critical); font-weight: 600; }
td.serious { color: var(--serious); font-weight: 600; }
td.moderate { color: var(--moderate); font-weight: 600; }
td.zero, td.incomplete { color: var(--muted); }

.raw { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; }
.note { color: var(--muted); font-size: .87rem; }

footer { margin-top: 3rem; color: var(--muted); font-size: .87rem; }
footer p { margin: .6rem 0; }

@media (max-width: 40rem) {
  body { padding: 1.25rem 1rem 3rem; }
  .help { flex-basis: 100%; }
}
`;

const all = scans();

if (all.length === 0) {
  console.error(`No scan results in ${DIRECTORY}. Run the accessibility suite first.`);
  process.exit(1);
}

const distinct = rules(all);
const critical = distinct.filter((rule) => rule.impact === "critical").length;
const serious = distinct.filter((rule) => rule.impact === "serious").length;
const failedCriteria = criteriaIn(all, "violations");
const tags = all[0].result.toolOptions?.runOnly?.values ?? [];
const recorded = new Date().toISOString().slice(0, 10);
const pages = new Set(all.map((scan) => scan.page)).size;
const browsers = [...new Set(all.map((scan) => scan.browser))];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility scans</title>
<style>${STYLE}</style>
</head>
<body>
<main>
  <h1>Accessibility scans</h1>
  <p class="lede">
    ${pages} pages on ${escape(browsers.join(", "))}, ${recorded}, against
    <code>${escape(all[0].result.url)}</code>. Rule tags
    ${tags.map((tag) => `<code>${escape(tag)}</code>`).join(" ")}.
  </p>

  <div class="tiles">
    ${statTile(critical, "critical", "critical")}
    ${statTile(serious, "serious", "serious")}
    ${statTile(failedCriteria.size, "WCAG criteria failed")}
  </div>

  <h2>Findings</h2>
  ${distinct.map(ruleCard).join("")}

  <h2>Per scan</h2>
  ${scanTable(all)}

  <footer>
    <p>
      <b>Needs review</b> is axe's own bucket for the checks it could not decide by itself. They
      are not violations: they are what a person has to look at.
    </p>
  </footer>
</main>
</body>
</html>
`;

writeFileSync(path.join(DIRECTORY, "summary.html"), html, "utf8");

console.log(
  `${all.length} scans, ${distinct.length} distinct rules: ${critical} critical, ${serious} serious`,
);
for (const scan of all) {
  console.log(
    `  ${scan.page}/${scan.browser}: ${scan.result.violations.length} violations, ${scan.result.incomplete.length} needs review`,
  );
}
for (const rule of distinct) {
  const { criteria, level } = rule.wcag;
  const wcag = criteria.length ? `, WCAG ${criteria.join(", ")}${level ? ` (${level})` : ""}` : "";
  console.log(`  [${rule.impact}] ${rule.id}, up to ${rule.worst.nodes.length} elements${wcag}`);
}
console.log(
  `\n${failedCriteria.size} WCAG criteria failed, ${criteriaIn(all, "incomplete").size} undecided`,
);
console.log(`\nWritten to ${path.join(DIRECTORY, "summary.html")}`);
