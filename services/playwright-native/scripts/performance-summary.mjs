import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Turns the measurements and recordings in reports/performance/ into summary.html beside them. */

const DIRECTORY = path.join(process.cwd(), "reports", "performance");
const BANDS = path.join(process.cwd(), "tests", "non-functional", "performance", "baselines");
const HEAVIEST = 5;

/** How each metric reads. A duration is milliseconds, a weight is bytes, a count is itself. */
const METRICS = [
  ["ttfb", "Time to first byte", "ms"],
  ["response", "Response download", "ms"],
  ["domContentLoaded", "DOM content loaded", "ms"],
  ["load", "Load", "ms"],
  ["firstContentfulPaint", "First contentful paint", "ms"],
  ["largestContentfulPaint", "Largest contentful paint", "ms"],
  ["scriptDuration", "Script", "ms"],
  ["layoutDuration", "Layout", "ms"],
  ["recalcStyleDuration", "Style recalculation", "ms"],
  ["requests", "Requests", "count"],
  ["transferredBytes", "Transferred", "bytes"],
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
  if (unit === "bytes") return `${(value / 1024).toFixed(1)} KB`;
  if (unit === "count") return String(value);
  return `${value.toFixed(1)} ms`;
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function statTile(value, label, className = "") {
  return `<div class="tile ${className}"><b>${value}</b><span>${label}</span></div>`;
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
    .filter((file) => file.endsWith(".json") && file !== "summary.json")
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

/** What the recording answers and the timings cannot: what failed, what is not compressed, and
 *  what the application asks the browser to keep. */
function network(requests) {
  const incomplete = requests.filter((entry) => entry.response.status < 100);
  const uncompressed = requests.filter(
    (entry) => entry.response.status >= 100 && !headerOf(entry, "content-encoding"),
  );

  return {
    total: requests.length,
    incomplete,
    uncompressed,
    uncompressedBytes: uncompressed.reduce((sum, entry) => sum + entry.response.content.size, 0),
    decompressed: requests.reduce((sum, entry) => sum + entry.response.content.size, 0),
    caching: [...new Set(requests.map((entry) => headerOf(entry, "cache-control") ?? "none"))],
    heaviest: [...requests]
      .sort((first, second) => second.response.content.size - first.response.content.size)
      .slice(0, HEAVIEST),
  };
}

function metricRows({ measurement, band }) {
  return METRICS.flatMap(([metric, label, unit]) => {
    const cold = measurement.cold[metric];
    const warm = measurement.warm[metric];
    if (!cold && !warm) return [];

    const spread = (summary) =>
      summary ? `${format(summary.min, unit)} &ndash; ${format(summary.max, unit)}` : "&ndash;";
    const bound = band?.cold?.[metric];

    return [
      `<tr>
        <th scope="row">${escape(label)}</th>
        <td class="figure">${format(cold?.median, unit)}</td>
        <td class="range">${spread(cold)}</td>
        <td class="figure">${format(warm?.median, unit)}</td>
        <td class="range">${spread(warm)}</td>
        <td class="range">${bound === undefined ? "&ndash;" : `&le; ${format(bound, unit)}`}</td>
      </tr>`,
    ];
  }).join("");
}

function pageSection(entry) {
  const { page, measurement } = entry;
  const exchange = network(entry.requests);
  const url = measurement.url.replace(/^https?:\/\/[^/]+/, "") || "/";

  const list = (entries) =>
    entries
      .map(
        (item) =>
          `<li><code>${escape(item.request.url.replace(/^https?:\/\/[^/]+/, ""))}</code>
           <span class="muted">${format(item.response.content.size, "bytes")}
           ${escape(headerOf(item, "content-encoding") ?? "uncompressed")}</span></li>`,
      )
      .join("");

  return `
  <section class="page">
    <h3>${escape(page)} <code>${escape(url)}</code></h3>

    <table>
      <thead>
        <tr><th></th><th colspan="2">Cold</th><th colspan="2">Warm</th><th rowspan="2">Band</th></tr>
        <tr><th></th><th>Median</th><th>Spread</th><th>Median</th><th>Spread</th></tr>
      </thead>
      <tbody>${metricRows(entry)}</tbody>
    </table>

    <div class="tiles">
      ${statTile(exchange.total, "distinct requests")}
      ${statTile(format(exchange.decompressed, "bytes"), "decompressed")}
      ${statTile(exchange.uncompressed.length, "uncompressed", exchange.uncompressed.length ? "warn" : "")}
      ${statTile(exchange.incomplete.length, "never completed", exchange.incomplete.length ? "warn" : "")}
    </div>

    <p class="muted">Cache-control: ${exchange.caching.map((value) => `<code>${escape(value)}</code>`).join(" ")}</p>

    ${exchange.uncompressed.length ? `<details><summary>${plural(exchange.uncompressed.length, "response")} without compression, ${format(exchange.uncompressedBytes, "bytes")}</summary><ul>${list(exchange.uncompressed)}</ul></details>` : ""}
    <details><summary>Heaviest ${Math.min(HEAVIEST, exchange.total)} responses</summary><ul>${list(exchange.heaviest)}</ul></details>
  </section>`;
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
h3 { font-size: 1.05rem; margin: 0 0 .9rem; display: flex; flex-wrap: wrap; gap: .5rem;
     align-items: baseline; }
.lede { color: var(--muted); margin: 0 0 1.75rem; }
.muted { color: var(--muted); font-size: .85rem; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .85em;
       background: var(--code); border-radius: .25rem; padding: .05rem .3rem; }
.tiles { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1rem 0 .75rem; }
.tile { flex: 1 1 8rem; background: var(--bg); border: 1px solid var(--line);
        border-radius: .5rem; padding: .7rem .9rem; }
.tile b { display: block; font-size: 1.4rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile span { color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
.tile.warn b { color: var(--warn); }
.page { border: 1px solid var(--line); border-radius: .5rem; background: var(--panel);
        padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th, td { text-align: right; padding: .3rem .5rem; border-bottom: 1px solid var(--line); }
thead th { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
tbody th { text-align: left; font-weight: 400; }
.range { color: var(--muted); font-size: .85em; }
.figure { font-weight: 600; }
details { margin-top: .6rem; }
summary { cursor: pointer; color: var(--muted); font-size: .85rem; }
ul { margin: .5rem 0 0; padding-left: 1.1rem; }
li { margin-bottom: .2rem; }
footer { margin-top: 2.5rem; color: var(--muted); font-size: .85rem; }
`;

const all = measurements();

if (!all.length) {
  console.error(`No measurement found in ${DIRECTORY}. Run test:perf first.`);
  process.exit(1);
}

const browsers = [...new Set(all.map((entry) => entry.browser))];
const loads = all[0].measurement.loads;
const origin = all[0].measurement.url.match(/^https?:\/\/[^/]+/)?.[0] ?? "";

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
    ${all.length} pages on ${escape(browsers.join(", "))}, ${loads} loads each, cold and warm,
    against <code>${escape(origin)}</code>.
  </p>

  <h2>Per page</h2>
  ${all.map(pageSection).join("")}

  <footer>
    <p>
      A <b>cold</b> figure is the first arrival with the browser cache cleared; a <b>warm</b> one is
      the same page loaded straight after. They answer different questions and are never combined.
      The <b>median</b> of ${loads} loads decides, and the <b>spread</b> is what says whether it
      means anything: a spread wider than the gap between two runs makes the median noise.
    </p>
    <p>
      The <b>band</b> is the upper bound recorded for the cold figure on the machine that recorded
      it. Script, layout, style and the largest paint carry none: they explain a figure rather than
      decide it. <b>Decompressed</b> is what the browser parses, which is larger than what it
      transferred. For the waterfall itself, open the <code>.har</code> beside this page in a
      browser's network panel.
    </p>
  </footer>
</main>
</body>
</html>
`;

writeFileSync(path.join(DIRECTORY, "summary.html"), html, "utf8");

for (const entry of all) {
  const exchange = network(entry.requests);
  const cold = entry.measurement.cold;
  console.log(
    `${entry.page}/${entry.browser}: cold ${format(cold.load?.median, "ms").replace("&ndash;", "-")} ` +
      `${format(cold.transferredBytes?.median, "bytes")} over ${exchange.total} requests, ` +
      `${exchange.uncompressed.length} uncompressed, ${exchange.incomplete.length} never completed`,
  );
}

console.log(`\nWritten to ${path.join(DIRECTORY, "summary.html")}`);
