import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Turns the measurements and recordings in reports/performance/ into summary.html beside them. */

const DIRECTORY = path.join(process.cwd(), "reports", "performance");
const BANDS = path.join(process.cwd(), "tests", "non-functional", "performance", "baselines");
const SAMPLE_RESPONSES = 6;

/** A spread is worth showing once it is this wide relative to its median. */
const WIDE_SPREAD = 0.1;

/** Every other metric the collector records stays in the JSON rather than this table. */
const COLUMNS = [
  ["load", "cold", "Load", "ms"],
  ["load", "warm", "Load warm", "ms"],
  ["firstContentfulPaint", "cold", "First paint", "ms"],
  ["scriptDuration", "cold", "Script", "ms"],
  ["ttfb", "cold", "Server", "ms"],
  ["transferredBytes", "cold", "Transferred", "bytes"],
  ["transferredBytes", "warm", "Transferred warm", "bytes"],
  ["requests", "cold", "Requests", "count"],
];

function escape(text) {
  return String(text).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
}

function format(value, unit) {
  if (value === undefined || value === null) return "&ndash;";
  if (unit === "bytes") return value >= 1024 ? `${Math.round(value / 1024)} KB` : `${value} B`;
  if (unit === "count") return String(value);
  return `${Math.round(value)} ms`;
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function statTile(value, label, className = "") {
  return `<div class="tile ${className}"><b>${value}</b><span>${escape(label)}</span></div>`;
}

function path_(url) {
  return url.replace(/^https?:\/\/[^/]+/, "") || "/";
}

/** One entry per URL. A recording holds every load of a page, so the same request repeats. */
function distinctRequests(har) {
  const seen = new Map();
  for (const entry of har.log.entries)
    if (!seen.has(entry.request.url)) seen.set(entry.request.url, entry);
  return [...seen.values()];
}

function headerOf(entry, name) {
  return entry.response.headers.find((header) => header.name.toLowerCase() === name)?.value;
}

function measurements() {
  return readdirSync(DIRECTORY)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const separator = file.lastIndexOf("-");
      const page = file.slice(0, separator);
      const recording = path.join(DIRECTORY, file.replace(/\.json$/, ".har"));
      const band = path.join(BANDS, `${page}.json`);

      return {
        page,
        browser: file.slice(separator + 1, -".json".length),
        measurement: JSON.parse(readFileSync(path.join(DIRECTORY, file), "utf8")),
        requests: existsSync(recording)
          ? distinctRequests(JSON.parse(readFileSync(recording, "utf8")))
          : [],
        band: existsSync(band) ? JSON.parse(readFileSync(band, "utf8")) : null,
      };
    })
    .sort((first, second) => first.page.localeCompare(second.page));
}

/** A finding is one kind of defect across every page that shows it; one page's instance of it is
 *  an example, not a finding. */
function findings(all) {
  const uncompressed = [];
  const incomplete = [];
  const uncached = [];
  const failed = [];
  const redirected = [];

  for (const { page, requests } of all) {
    for (const entry of requests) {
      const { status } = entry.response;
      const example = {
        page,
        url: path_(entry.request.url),
        size: entry.response.content.size,
        status,
      };

      if (status < 100) incomplete.push(example);
      else if (!headerOf(entry, "content-encoding")) uncompressed.push(example);
      if (status >= 100 && !headerOf(entry, "cache-control")) uncached.push(example);
      if (status >= 300 && status < 400) redirected.push(example);
      else if (status >= 400) failed.push(example);
    }
  }

  const statusOf = (example) => example.status;

  return [
    {
      id: "failed",
      title: "Requests that returned an error",
      why: "The page asked for something the server did not return.",
      examples: failed,
      detail: statusOf,
    },
    {
      id: "incomplete",
      title: "Requests that never completed",
      why: "The recording carries no response for them, so the page waited on nothing.",
      examples: incomplete,
    },
    {
      id: "redirected",
      title: "Requests answered with a redirect",
      why: "Each one costs a round trip before the resource is reached.",
      examples: redirected,
      detail: statusOf,
    },
    {
      id: "uncompressed",
      title: "Responses served without compression",
      why: "Every byte of them crosses the network as written.",
      examples: uncompressed,
      weigh: true,
      detail: (example) => format(example.size, "bytes"),
    },
    {
      id: "uncached",
      title: "Responses with no cache-control",
      why: "The browser is left to guess whether it may keep them.",
      examples: uncached,
    },
  ].filter((finding) => finding.examples.length);
}

function findingCard(finding) {
  const pages = [...new Set(finding.examples.map((example) => example.page))];
  const weight = finding.examples.reduce((sum, example) => sum + example.size, 0);
  const shown = [...finding.examples]
    .sort((first, second) => second.size - first.size)
    .slice(0, SAMPLE_RESPONSES);

  return `
  <details class="finding">
    <summary>
      <b>${finding.examples.length}</b>
      <span class="title">${escape(finding.title)}</span>
      <span class="muted">${plural(pages.length, "page")}${finding.weigh ? `, ${format(weight, "bytes")}` : ""}</span>
    </summary>
    <p class="muted">${escape(finding.why)}</p>
    <ul>
      ${shown
        .map(
          (example) =>
            `<li><code>${escape(example.url)}</code> <span class="muted">${escape(example.page)}${finding.detail ? `, ${finding.detail(example)}` : ""}</span></li>`,
        )
        .join("")}
      ${finding.examples.length > shown.length ? `<li class="muted">and ${finding.examples.length - shown.length} more</li>` : ""}
    </ul>
  </details>`;
}

function cell(entry, [metric, phase, , unit]) {
  const summary = entry.measurement[phase][metric];
  if (!summary) return `<td>&ndash;</td>`;

  /* A band sits just above the median that recorded it, so only a figure past its bound is
     marked; anything short of that would colour these columns on every run. */
  const bound = entry.band?.[phase]?.[metric];
  const over = bound !== undefined && summary.median > bound;
  const half = (summary.max - summary.min) / 2;
  const wide = half > Math.abs(summary.median) * WIDE_SPREAD;

  return `<td class="figure${over ? " over" : ""}"${bound === undefined ? "" : ` title="band ${format(bound, unit)}"`}>
    ${format(summary.median, unit)}${wide ? `<span class="spread">&plusmn;${format(half, unit).replace(/ (ms|KB|B)$/, "")}</span>` : ""}
  </td>`;
}

function comparison(all) {
  return `
  <table>
    <thead><tr><th></th>${COLUMNS.map(([, , label]) => `<th>${escape(label)}</th>`).join("")}</tr></thead>
    <tbody>
      ${all
        .map(
          (entry) => `<tr>
        <th scope="row">${escape(entry.page)}<span class="muted"> ${escape(path_(entry.measurement.url))}</span></th>
        ${COLUMNS.map((column) => cell(entry, column)).join("")}
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}

const STYLE = `
:root {
  --bg: #ffffff; --panel: #f6f7f9; --line: #d8dce2; --ink: #16191d; --muted: #5b626b;
  --code: #eceff3; --link: #1f5fbf; --warn: #8a4a12;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14171a; --panel: #1c2024; --line: #2e343a; --ink: #e8eaed; --muted: #a2aab3;
    --code: #22272c; --link: #8ab4f8; --warn: #e0a35f;
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
.muted { color: var(--muted); font-weight: 400; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .85em;
       background: var(--code); border-radius: .25rem; padding: .05rem .3rem; }

.tiles { display: flex; flex-wrap: wrap; gap: .75rem; }
.tile { flex: 1 1 8rem; background: var(--panel); border: 1px solid var(--line);
        border-radius: .5rem; padding: .85rem 1rem; }
.tile b { display: block; font-size: 1.85rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile span { color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; }
.tile.warn b { color: var(--warn); }

.finding { border: 1px solid var(--line); border-radius: .5rem; margin-bottom: .6rem;
           background: var(--panel); }
.finding summary { cursor: pointer; padding: .8rem 1rem; display: flex; flex-wrap: wrap;
                   gap: .6rem; align-items: baseline; }
.finding summary::marker { color: var(--muted); }
.finding summary b { font-variant-numeric: tabular-nums; color: var(--warn); min-width: 1.5rem; }
.finding summary .title { font-weight: 600; }
.finding[open] summary { border-bottom: 1px solid var(--line); }
.finding p, .finding ul { margin: .7rem 1rem; }
.finding ul { padding-left: 1.1rem; }
.finding li { margin-bottom: .15rem; }

table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th, td { text-align: right; padding: .45rem .55rem; border-bottom: 1px solid var(--line); }
thead th { font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted);
           vertical-align: bottom; }
tbody th { text-align: left; font-weight: 600; white-space: nowrap; }
tbody th .muted { font-size: .8em; }
.figure { white-space: nowrap; }
.figure.over { color: var(--warn); font-weight: 600; }
.spread { color: var(--muted); font-size: .78em; margin-left: .2rem; }
footer { margin-top: 2.5rem; color: var(--muted); font-size: .85rem; }
`;

const all = measurements();

if (!all.length) {
  console.error(`No measurement found in ${DIRECTORY}. Run test:perf first.`);
  process.exit(1);
}

const found = findings(all);
const browsers = [...new Set(all.map((entry) => entry.browser))];
const loads = all[0].measurement.loads;
const slowest = all.reduce((worst, entry) =>
  (entry.measurement.cold.load?.median ?? 0) > (worst.measurement.cold.load?.median ?? 0)
    ? entry
    : worst,
);
const heaviest = all.reduce((worst, entry) =>
  (entry.measurement.cold.transferredBytes?.median ?? 0) >
  (worst.measurement.cold.transferredBytes?.median ?? 0)
    ? entry
    : worst,
);
const countOf = (id) => found.find((finding) => finding.id === id)?.examples.length ?? 0;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Performance metrics</title>
<style>${STYLE}</style>
</head>
<body>
<main>
  <h1>Performance metrics</h1>
  <p class="lede">
    ${plural(all.length, "page")} on ${escape(browsers.join(", "))}, ${loads} loads each, cold and
    warm, against <code>${escape(all[0].measurement.url.match(/^https?:\/\/[^/]+/)?.[0] ?? "")}</code>.
  </p>

  <div class="tiles">
    ${statTile(format(slowest.measurement.cold.load?.median, "ms"), `slowest, ${slowest.page}`)}
    ${statTile(format(heaviest.measurement.cold.transferredBytes?.median, "bytes"), `heaviest, ${heaviest.page}`)}
    ${statTile(countOf("failed"), "errors", countOf("failed") ? "warn" : "")}
    ${statTile(countOf("incomplete"), "never completed", countOf("incomplete") ? "warn" : "")}
    ${statTile(countOf("uncompressed"), "uncompressed", countOf("uncompressed") ? "warn" : "")}
  </div>

  ${found.length ? `<h2>Findings</h2>${found.map(findingCard).join("")}` : ""}

  <h2>Per page</h2>
  ${comparison(all)}

  <footer>
    <p>
      <b>Cold</b> is the first arrival with the browser cache cleared, <b>warm</b> the same page
      straight after; they answer different questions and are never combined. A figure is the
      median of ${loads} loads, with &plusmn; half the spread where that spread is wide enough to
      matter. One in amber is past the band recorded for it; hover any figure for its bound.
    </p>
    <p>
      For the waterfall itself, open the <code>.har</code> beside this page in a browser's network
      panel.
    </p>
  </footer>
</main>
</body>
</html>
`;

writeFileSync(path.join(DIRECTORY, "summary.html"), html, "utf8");

for (const entry of all) {
  const cold = entry.measurement.cold;
  console.log(
    `${entry.page}/${entry.browser}: ${format(cold.load?.median, "ms")} cold, ` +
      `${format(cold.transferredBytes?.median, "bytes")} over ${format(cold.requests?.median, "count")} requests`,
  );
}
for (const finding of found) {
  console.log(`  ${finding.examples.length} ${finding.title.toLowerCase()}`);
}
console.log(`\nWritten to ${path.join(DIRECTORY, "summary.html")}`);
