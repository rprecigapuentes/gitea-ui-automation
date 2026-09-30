import { readFileSync } from "node:fs";
import { coveredStates } from "./match.mjs";
import { INVENTORY } from "./paths.mjs";
import { reachedUrls } from "./page-objects.mjs";
import { usedSelectors } from "./usage.mjs";

const inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));
const reached = reachedUrls();
const crawled = Object.keys(inventory.urls);
const coveredUrls = crawled.filter((url) => reached.has(url));
const unseen = [...reached].filter((url) => !crawled.includes(url));

const covered = await coveredStates(usedSelectors(), crawled, reached);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const elementsOf = (url) => inventory.urls[url].elements;
const observed = (url) => sum(elementsOf(url).map((element) => element.states.length));
const coveredStatesOf = (url) =>
  sum(
    [...covered.get(url)].map(
      ([id, states]) => elementsOf(url)[id].states.filter((state) => states.has(state)).length,
    ),
  );

const totals = {
  elements: sum(crawled.map((url) => elementsOf(url).length)),
  coveredElements: sum(crawled.map((url) => covered.get(url).size)),
  states: sum(crawled.map(observed)),
  coveredStates: sum(crawled.map(coveredStatesOf)),
};

const percent = (part, whole) => ((part / whole) * 100).toFixed(1);
const line = (name, part, whole) => `${name} ${part} / ${whole}  ${percent(part, whole)}%`;

console.log(`UI coverage (Gitea ${inventory.gitea})`);
console.log(line("URLs     ", coveredUrls.length, crawled.length));
console.log(line("Elements ", totals.coveredElements, totals.elements));
console.log(line("States   ", totals.coveredStates, totals.states));

console.log("\nPer URL with coverage (elements, states):");
for (const url of crawled.filter((url) => covered.get(url).size > 0)) {
  const elements = `${covered.get(url).size} / ${elementsOf(url).length}`;
  console.log(`  ${url}  ${elements}  ${coveredStatesOf(url)} / ${observed(url)}`);
}
console.log(`\nReached by a step but not crawled:\n${unseen.map((url) => `  ${url}`).join("\n")}`);
