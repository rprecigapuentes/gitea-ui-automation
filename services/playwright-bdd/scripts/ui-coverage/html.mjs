import { ACTIONS_BY_ROLE } from "./actions.mjs";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escape = (text) => String(text).replace(/[&<>"]/g, (character) => ESCAPES[character]);
const percent = ({ covered, total }) => (total === 0 ? 0 : (covered / total) * 100).toFixed(1);

const STYLE = `
:root { --bg: #f7f7f5; --card: #fff; --text: #1d1d1b; --muted: #6b6b66; --line: #e2e2dc;
  --accent: #1f6feb; --ok: #1a7f4b; --ok-bg: #e3f4ea; --no: #a4362c; --no-bg: #fbe9e7; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #161615; --card: #1f1f1d; --text: #ececea; --muted: #9a9a94; --line: #34342f;
    --accent: #58a6ff; --ok: #56d18a; --ok-bg: #16301f; --no: #ff8c7f; --no-bg: #3a1e1a; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, sans-serif; }
main { max-width: 1280px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { margin: 0 0 4px; font-size: 26px; }
h2 { margin: 40px 0 12px; font-size: 20px; }
.muted { color: var(--muted); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 20px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
.card .value { font-size: 32px; font-weight: 700; }
.bar { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; margin: 8px 0; }
.bar span { display: block; height: 100%; }
.meter { min-width: 150px; font-size: 13px; }
.meter .bar { margin: 2px 0; }
tr.reached td:first-child { box-shadow: inset 5px 0 0 var(--ok); }
tr.reached td { background: var(--ok-bg); }
.legend { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13px; color: var(--muted); }
.legend i { width: 160px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, hsl(0 70% 42%), hsl(60 70% 42%), hsl(120 70% 42%)); }
table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 13px; color: var(--muted); font-weight: 600; }
code { font-size: 13px; word-break: break-all; }
.chip { display: inline-block; padding: 1px 8px; margin: 1px 3px 1px 0; border-radius: 10px; font-size: 12px;
  background: var(--no-bg); color: var(--no); }
.chip.on { background: var(--ok-bg); color: var(--ok); border: 1px solid var(--ok); }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
.controls input[type=search] { flex: 1 1 260px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px;
  background: var(--card); color: var(--text); font: inherit; }
details.url { margin-bottom: 8px; }
details.url > summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer;
  padding: 10px 12px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; font-weight: 600; }
details.url > summary .meter { flex: none; width: 240px; font-weight: 400; }
details.scope { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; margin: 20px 0 0; }
details.scope > summary { cursor: pointer; font-weight: 600; }
details.scope table { margin-top: 10px; }
details ul { margin: 6px 0 2px; padding-left: 18px; }
[hidden] { display: none !important; }
`;

const SCRIPT = `
const search = document.getElementById("search");
const rows = document.querySelectorAll("#inventory tbody tr");
const pages = document.querySelectorAll("#inventory details.url");
function apply() {
  const mode = document.querySelector("input[name=mode]:checked").value;
  const term = search.value.toLowerCase();
  const narrowed = term !== "" || mode !== "all";
  rows.forEach((row) => {
    const fits = mode === "all" || row.dataset.covered === (mode === "covered" ? "1" : "0");
    row.hidden = !(fits && row.textContent.toLowerCase().includes(term));
  });
  pages.forEach((page) => {
    const any = page.querySelector("tbody tr:not([hidden])") !== null;
    page.hidden = !any;
    page.open = narrowed && any;
  });
}
search.addEventListener("input", apply);
document.querySelectorAll("input[name=mode]").forEach((input) => input.addEventListener("change", apply));
`;

const ELEMENTS = {
  link: "Link",
  button: "Button",
  menuitem: "Menu item",
  tab: "Tab",
  dropdown: "Drop-down menu",
  textbox: "Text field",
  checkbox: "Checkbox",
  radio: "Radio option",
  combobox: "Selection list",
  other: "Other",
};
const STATE_SCOPE = [
  ["visible", "Every element"],
  ["enabled / disabled", "Every element"],
  ["checked / unchecked", "Checkboxes and radio options"],
  ["expanded / collapsed", "Elements that declare aria-expanded"],
];

const fill = (level) => `width:${percent(level)}%;background:hsl(${percent(level) * 1.2} 70% 42%)`;

function card(title, level) {
  return `<div class="card"><div class="muted">${title}</div>
    <div class="value">${percent(level)}%</div>
    <div class="bar"><span style="${fill(level)}"></span></div>
    <div class="muted">${level.covered} of ${level.total}</div></div>`;
}

function meter(level) {
  return `<div class="meter"><div class="bar"><span style="${fill(level)}"></span></div>
    <span>${level.covered} / ${level.total} · ${percent(level)}%</span></div>`;
}

function chips(all, done, labels = {}) {
  return all
    .map(
      (item) =>
        `<span class="chip${done.includes(item) ? " on" : ""}">${labels[item] ?? item}</span>`,
    )
    .join("");
}

function list(items, label) {
  const lines = items.map((item) => `<li>${item}</li>`).join("");
  return `<details><summary>${items.length} ${label}${items.length === 1 ? "" : "s"}</summary><ul>${lines}</ul></details>`;
}

const testsCell = (tests) => (tests.length > 0 ? list(tests.map(escape), "test") : "—");

function pageRow({ url, reached, tests, elements, states, actions }) {
  return `<tr class="${reached ? "reached" : ""}"><td><code>${escape(url)}</code></td>
    <td>${testsCell(tests)}</td>
    <td>${meter(elements)}</td><td>${meter(states)}</td><td>${meter(actions)}</td></tr>`;
}

function elementRow(element) {
  const { type, name, target, states, actions, coveredStates, coveredActions, touched, tests } =
    element;

  return `<tr class="${touched ? "reached" : ""}" data-covered="${touched ? 1 : 0}">
    <td>${ELEMENTS[type] ?? escape(type)}</td>
    <td>${name === "" ? '<span class="muted">(no name)</span>' : escape(name)}${target ? `<div class="muted"><code>${escape(target)}</code></div>` : ""}</td>
    <td>${chips(actions, coveredActions)}</td>
    <td>${chips(states, coveredStates)}</td>
    <td>${testsCell(tests)}</td></tr>`;
}

function inventoryBlock({ url, elements, detail }) {
  return `<details class="url"><summary><code>${escape(url)}</code>${meter(elements)}</summary>
    <table><thead><tr><th>Type</th><th>Name</th><th>Possible actions</th><th>Observed states</th>
    <th>Tests</th></tr></thead>
    <tbody>${detail.map(elementRow).join("")}</tbody></table></details>`;
}

function scope() {
  const actions = Object.entries(ACTIONS_BY_ROLE).map(
    ([type, list]) => `<tr><td>${ELEMENTS[type]}</td><td>${list.join(", ")}</td></tr>`,
  );
  const states = STATE_SCOPE.map(([state, who]) => `<tr><td>${state}</td><td>${who}</td></tr>`);

  return `<details class="scope" open><summary>What is measured and what is not</summary>
<p>This inventory is not everything that can be done in Gitea: that universe is too large to list.
It holds what can be <b>inferred from the pages</b> the crawler reached: the elements it found, the
states it saw them in and the actions their type allows. Whatever does not appear on those pages, or
that an element allows but is not in these lists (dragging, hovering, keyboard shortcuts), is outside
the total.</p>
<table><thead><tr><th>Element type</th><th>Actions considered</th></tr></thead><tbody>${actions.join("")}</tbody></table>
<table><thead><tr><th>State</th><th>Observed on</th></tr></thead><tbody>${states.join("")}</tbody></table>
</details>`;
}

export function html(figures) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UI coverage</title><style>${STYLE}</style></head>
<body><main>
<h1>UI coverage</h1>
<div class="muted">playwright-bdd suite · Gitea ${escape(figures.gitea)}</div>
<div class="cards">${card("Pages", figures.urls)}${card("Elements", figures.elements)}${card("States", figures.states)}${card("Actions", figures.actions)}</div>

${scope()}

<h2>Coverage per page</h2>
<div class="legend">Low coverage <i></i> high · a green border and background mark the pages a test reaches</div>
<table><thead><tr><th>Page</th><th>Tests</th><th>Elements</th><th>States</th><th>Actions</th></tr></thead>
<tbody>${figures.perUrl.map(pageRow).join("")}</tbody></table>
<p class="muted">Reached by a test but not crawled: ${figures.unseen.map(escape).join(", ") || "none"}.</p>

<h2>Inventory of elements</h2>
<div class="legend">Each page shows its coverage. Green rows are reached by a test; in green too, the actions and states a test exercises.</div>
<div class="controls">
<input id="search" type="search" placeholder="Search an element, a page or a test">
<label><input type="radio" name="mode" value="all" checked> All</label>
<label><input type="radio" name="mode" value="covered"> With a test</label>
<label><input type="radio" name="mode" value="uncovered"> Without a test</label>
</div>
<div id="inventory">${figures.perUrl.map(inventoryBlock).join("")}</div>
</main><script>${SCRIPT}</script></body></html>
`;
}
