import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { routeTemplate } from "./route-template.mjs";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const PAGES = path.join(ROOT, "business-logic/pages");
const STEPS = path.join(ROOT, "services/playwright-bdd/features/step-definitions");

function stepGetters() {
  const getters = new Set();

  for (const file of readdirSync(STEPS)) {
    const source = readFileSync(path.join(STEPS, file), "utf8");
    for (const [, getter] of source.matchAll(/pageObjects\.(\w+)/g)) getters.add(getter);
  }

  return getters;
}

function fileOfGetter() {
  const factory = readFileSync(path.join(PAGES, "page.factory.ts"), "utf8");
  const fileOfClass = new Map();
  const fileOf = new Map();

  for (const [, name, file] of factory.matchAll(/import \{ (\w+) \} from "\.\/([^"]+)"/g)) {
    fileOfClass.set(name, file);
  }
  for (const [, getter, name] of factory.matchAll(/get (\w+)\(\): (\w+)/g)) {
    fileOf.set(getter, fileOfClass.get(name));
  }

  return fileOf;
}

function sample(expression) {
  return /number|id$|index/i.test(expression) ? "1" : "x";
}

function urlTemplate(file) {
  const source = readFileSync(path.join(PAGES, `${file}.ts`), "utf8");
  const found = source.match(/getUrl\([^)]*\)[^{]*\{\s*return `([^`]*)`/);
  if (!found) return undefined;

  const pathname = found[1]
    .replace("${baseUrl}", "")
    .replace(/\$\{([^}]*)\}/g, (_, e) => sample(e));
  return routeTemplate(pathname);
}

export function reachedUrls() {
  const fileOf = fileOfGetter();
  const urls = new Set();

  for (const getter of stepGetters()) {
    const file = fileOf.get(getter);
    const template = file && urlTemplate(file);
    if (template) urls.add(template);
  }

  return urls;
}
