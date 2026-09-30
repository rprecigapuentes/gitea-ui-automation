import { readFileSync } from "node:fs";
import { INVENTORY } from "./paths.mjs";
import { reachedUrls } from "./page-objects.mjs";

const inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));
const reached = reachedUrls();
const crawled = Object.keys(inventory.urls);
const covered = crawled.filter((url) => reached.has(url));
const missed = crawled.filter((url) => !reached.has(url));
const unseen = [...reached].filter((url) => !crawled.includes(url));

const percent = ((covered.length / crawled.length) * 100).toFixed(1);

console.log(`UI coverage (Gitea ${inventory.gitea})`);
console.log(`URLs  ${covered.length} / ${crawled.length}  ${percent}%`);
console.log(`\nCovered:\n${covered.map((url) => `  ${url}`).join("\n")}`);
console.log(`\nReached by a step but not crawled:\n${unseen.map((url) => `  ${url}`).join("\n")}`);
console.log(`\nNot covered: ${missed.length}`);
