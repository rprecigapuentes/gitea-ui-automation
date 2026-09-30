import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pageFile } from "./paths.mjs";
import { performedActions } from "./actions.mjs";
import { impliedStates } from "./states.mjs";

async function matches(page, selector) {
  try {
    return await page.$$eval(selector, (found) =>
      found.map((element) => {
        const dropdown = element.closest(".ui.dropdown");
        return {
          id: element.dataset.cov,
          dropdown: dropdown && dropdown !== element ? dropdown.dataset.cov : undefined,
        };
      }),
    );
  } catch {
    return [];
  }
}

function appliesTo(entry, template, reached) {
  return entry.template === template || (entry.template === null && reached.has(template));
}

function record(elements, id, entry) {
  const hit = elements.get(id) ?? {
    states: new Set(),
    actions: new Set(),
    tests: new Set(),
  };

  impliedStates(entry.action).forEach((state) => hit.states.add(state));
  performedActions(entry.action).forEach((action) => hit.actions.add(action));
  entry.tests.forEach((test) => hit.tests.add(test));
  elements.set(id, hit);
}

export async function coveredStates(used, templates, reached) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  const covered = new Map();

  for (const template of templates) {
    const elements = new Map();
    await page.setContent(readFileSync(pageFile(template), "utf8"));

    for (const entry of used.filter((candidate) => appliesTo(candidate, template, reached))) {
      const opens = performedActions(entry.action).includes("open");

      for (const { id, dropdown } of await matches(page, entry.selector)) {
        if (id !== undefined) record(elements, Number(id), entry);
        if (dropdown !== undefined && opens) record(elements, Number(dropdown), entry);
      }
    }
    covered.set(template, elements);
  }

  await browser.close();
  return covered;
}
