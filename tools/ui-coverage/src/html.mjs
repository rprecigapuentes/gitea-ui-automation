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
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 64px; }
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
.tag { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.tag.on { background: var(--ok); color: #fff; }
.tag.off { color: var(--muted); border: 1px dashed var(--line); }
.legend { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13px; color: var(--muted); }
.legend i { width: 160px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, hsl(0 70% 42%), hsl(60 70% 42%), hsl(120 70% 42%)); }
table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 13px; color: var(--muted); font-weight: 600; }
code { font-size: 13px; word-break: break-all; }
.chip { display: inline-block; padding: 1px 8px; margin: 1px 3px 1px 0; border-radius: 10px; font-size: 12px;
  background: var(--no-bg); color: var(--no); }
.chip.on { background: var(--ok-bg); color: var(--ok); }
.badge { font-weight: 600; white-space: nowrap; }
.badge.on { color: var(--ok); }
.badge.off { color: var(--no); }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
.controls input[type=search] { flex: 1 1 260px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px;
  background: var(--card); color: var(--text); font: inherit; }
details.url { margin-bottom: 8px; }
details.url > summary { cursor: pointer; padding: 10px 12px; background: var(--card); border: 1px solid var(--line);
  border-radius: 8px; font-weight: 600; }
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

const fill = (level) => `width:${percent(level)}%;background:hsl(${percent(level) * 1.2} 70% 42%)`;

function card(title, level) {
  return `<div class="card"><div class="muted">${title}</div>
    <div class="value">${percent(level)}%</div>
    <div class="bar"><span style="${fill(level)}"></span></div>
    <div class="muted">${level.covered} de ${level.total}</div></div>`;
}

function meter(level) {
  return `<div class="meter"><div class="bar"><span style="${fill(level)}"></span></div>
    <span>${level.covered} / ${level.total} · ${percent(level)}%</span></div>`;
}

function pageRow({ url, reached, elements, states }) {
  const mark = reached
    ? '<span class="tag on">✔ Alcanzada por un test</span>'
    : '<span class="tag off">Sin test</span>';

  return `<tr class="${reached ? "reached" : ""}"><td><code>${escape(url)}</code></td><td>${mark}</td>
    <td>${meter(elements)}</td><td>${meter(states)}</td></tr>`;
}

function testsCell(tests) {
  if (tests.length === 0) return "—";
  const items = tests.map((test) => `<li>${escape(test)}</li>`).join("");
  return `<details><summary>${tests.length} test${tests.length === 1 ? "" : "s"}</summary><ul>${items}</ul></details>`;
}

function elementRow({ key, states, covered, touched, tests }) {
  const chips = states
    .map((state) => `<span class="chip${covered.includes(state) ? " on" : ""}">${state}</span>`)
    .join("");
  const badge = touched
    ? '<span class="badge on">Cubierto</span>'
    : '<span class="badge off">Sin cubrir</span>';

  return `<tr data-covered="${touched ? 1 : 0}"><td><code>${escape(key)}</code></td>
    <td>${chips}</td><td>${badge}</td><td>${testsCell(tests)}</td></tr>`;
}

function inventoryBlock({ url, elements, detail }) {
  return `<details class="url"><summary>${escape(url)}
    <span class="muted">· ${elements.covered} de ${elements.total} elementos cubiertos</span></summary>
    <table><thead><tr><th>Elemento</th><th>Estados observados (en verde, los cubiertos)</th>
    <th>Cobertura</th><th>Tests</th></tr></thead>
    <tbody>${detail.map(elementRow).join("")}</tbody></table></details>`;
}

export function html(figures) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cobertura de UI</title><style>${STYLE}</style></head>
<body><main>
<h1>Cobertura de UI</h1>
<div class="muted">Suite playwright-bdd · Gitea ${escape(figures.gitea)}</div>
<div class="cards">${card("Páginas", figures.urls)}${card("Elementos", figures.elements)}${card("Estados", figures.states)}</div>

<h2>Cobertura por página</h2>
<div class="legend">Cobertura baja <i></i> alta · el borde y el fondo verdes marcan las páginas que un test alcanza</div>
<table><thead><tr><th>Página</th><th>Test</th><th>Elementos</th><th>Estados</th></tr></thead>
<tbody>${figures.perUrl.map(pageRow).join("")}</tbody></table>
<p class="muted">Alcanzados por un test pero no rastreados: ${figures.unseen.map(escape).join(", ") || "ninguno"}.</p>

<h2>Inventario de elementos</h2>
<div class="controls">
<input id="search" type="search" placeholder="Buscar un elemento, una página o un test">
<label><input type="radio" name="mode" value="all" checked> Todos</label>
<label><input type="radio" name="mode" value="covered"> Cubiertos</label>
<label><input type="radio" name="mode" value="uncovered"> Sin cubrir</label>
</div>
<div id="inventory">${figures.perUrl.map(inventoryBlock).join("")}</div>
</main><script>${SCRIPT}</script></body></html>
`;
}
