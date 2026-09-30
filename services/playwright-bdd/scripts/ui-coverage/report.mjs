import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { delta } from "./delta.mjs";
import { measure } from "./figures.mjs";
import { html } from "./html.mjs";
import { INVENTORY, REPORTS } from "./paths.mjs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const flag = process.argv.indexOf("--baseline");
const inventory = read(INVENTORY);
const change = flag === -1 ? undefined : delta(read(process.argv[flag + 1]), inventory);

const figures = await measure(inventory);

mkdirSync(REPORTS, { recursive: true });
writeFileSync(
  path.join(REPORTS, "coverage.json"),
  `${JSON.stringify({ figures, change }, null, 2)}\n`,
);
writeFileSync(path.join(REPORTS, "coverage.html"), html(figures));

for (const level of ["urls", "elements", "states", "actions"]) {
  const { covered, total } = figures[level];
  console.log(`${level.padEnd(9)} ${covered} / ${total}  ${((covered / total) * 100).toFixed(1)}%`);
}
console.log(`report    ${path.join(REPORTS, "coverage.html")}`);
