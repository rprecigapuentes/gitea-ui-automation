import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { delta } from "./delta.mjs";
import { measure } from "./figures.mjs";
import { markdown } from "./markdown.mjs";
import { INVENTORY, REPORTS } from "./paths.mjs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const flag = process.argv.indexOf("--baseline");
const inventory = read(INVENTORY);
const change = flag === -1 ? undefined : delta(read(process.argv[flag + 1]), inventory);

const figures = await measure(inventory);
const text = markdown(figures, change);

mkdirSync(REPORTS, { recursive: true });
writeFileSync(
  path.join(REPORTS, "coverage.json"),
  `${JSON.stringify({ figures, change }, null, 2)}\n`,
);
writeFileSync(path.join(REPORTS, "coverage.md"), text);

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
console.log(text);
