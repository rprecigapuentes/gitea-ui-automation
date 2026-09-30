import { readFileSync } from "node:fs";
import path from "node:path";
import { reachedUrls } from "./page-objects.mjs";

const INVENTORY = path.resolve(
  import.meta.dirname,
  "../../../coverage-data/inventory/ui-inventory.json",
);

const inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));
const reached = reachedUrls();
const covered = inventory.urls.filter((url) => reached.has(url));
const missed = inventory.urls.filter((url) => !reached.has(url));
const unseen = [...reached].filter((url) => !inventory.urls.includes(url));

const percent = ((covered.length / inventory.urls.length) * 100).toFixed(1);

console.log(`UI coverage (Gitea ${inventory.gitea})`);
console.log(`URLs  ${covered.length} / ${inventory.urls.length}  ${percent}%`);
console.log(`\nCovered:\n${covered.map((url) => `  ${url}`).join("\n")}`);
console.log(`\nReached by a step but not crawled:\n${unseen.map((url) => `  ${url}`).join("\n")}`);
console.log(`\nNot covered: ${missed.length}`);
