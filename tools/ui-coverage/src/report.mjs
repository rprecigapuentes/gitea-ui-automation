import { readFileSync } from "node:fs";
import { coveredElements } from "./match.mjs";
import { INVENTORY } from "./paths.mjs";
import { reachedUrls } from "./page-objects.mjs";
import { usedSelectors } from "./usage.mjs";

const inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));
const reached = reachedUrls();
const crawled = Object.keys(inventory.urls);
const coveredUrls = crawled.filter((url) => reached.has(url));
const unseen = [...reached].filter((url) => !crawled.includes(url));

const covered = await coveredElements(usedSelectors(), crawled, reached);
const elementsOf = (url) => inventory.urls[url].elements.length;
const totalElements = crawled.reduce((sum, url) => sum + elementsOf(url), 0);
const coveredElementCount = crawled.reduce((sum, url) => sum + covered.get(url).size, 0);

const percent = (part, whole) => ((part / whole) * 100).toFixed(1);

console.log(`UI coverage (Gitea ${inventory.gitea})`);
console.log(
  `URLs      ${coveredUrls.length} / ${crawled.length}  ${percent(coveredUrls.length, crawled.length)}%`,
);
console.log(
  `Elements  ${coveredElementCount} / ${totalElements}  ${percent(coveredElementCount, totalElements)}%`,
);

console.log("\nElements per URL with coverage:");
for (const url of crawled.filter((url) => covered.get(url).size > 0)) {
  console.log(`  ${url}  ${covered.get(url).size} / ${elementsOf(url)}`);
}
console.log(`\nReached by a step but not crawled:\n${unseen.map((url) => `  ${url}`).join("\n")}`);
