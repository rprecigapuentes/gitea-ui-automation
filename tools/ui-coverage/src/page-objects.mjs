import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PAGES } from "./locators.mjs";
import { routeTemplate } from "./route-template.mjs";

const STEPS = path.resolve(
  import.meta.dirname,
  "../../../services/playwright-bdd/features/step-definitions",
);

export function stepCalls() {
  const calls = [];

  for (const file of readdirSync(STEPS)) {
    const source = readFileSync(path.join(STEPS, file), "utf8");
    for (const [, getter, member] of source.matchAll(/pageObjects\.(\w+)\.(\w+)/g)) {
      calls.push([getter, member]);
    }
  }

  return calls;
}

export function factoryClasses() {
  const factory = readFileSync(path.join(PAGES, "page.factory.ts"), "utf8");
  const fileOfClass = new Map();
  const classes = new Map();

  for (const [, name, file] of factory.matchAll(/import \{ (\w+) \} from "\.\/([^"]+)"/g)) {
    fileOfClass.set(name, file);
  }
  for (const [, getter, name] of factory.matchAll(/get (\w+)\(\): (\w+)/g)) {
    classes.set(getter, { name, file: fileOfClass.get(name) });
  }

  return classes;
}

function sample(expression) {
  return /number|id$|index/i.test(expression) ? "1" : "x";
}

export function urlTemplate(file) {
  const source = readFileSync(path.join(PAGES, `${file}.ts`), "utf8");
  const found = source.match(/getUrl\([^)]*\)[^{]*\{\s*return `([^`]*)`/);
  if (!found) return undefined;

  const pathname = found[1]
    .replace("${baseUrl}", "")
    .replace(/\$\{([^}]*)\}/g, (_, e) => sample(e));
  return routeTemplate(pathname);
}

export function reachedUrls() {
  const classes = factoryClasses();
  const urls = new Set();

  for (const [getter] of stepCalls()) {
    const file = classes.get(getter)?.file;
    const template = file && urlTemplate(file);
    if (template) urls.add(template);
  }

  return urls;
}
