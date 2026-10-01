// Runs each used selector against the stored DOM of a page: the elements it selects are the covered
// ones, and the method that read it says which states count.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pageFile } from "./paths.mjs";
import { performedActions } from "./actions.mjs";
import { impliedStates } from "./states.mjs";

// A fragment has no URL. A selector of it that selects on more pages than this is part of the chrome
// of the application, and says nothing about where the fragment is used.
const SPECIFIC_PAGES = 10;
// The pages of a fragment are those where most of its other selectors find something, and at least
// this many do.
const HOME_SELECTORS = 2;

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
    // A selector the stored page cannot evaluate selects nothing.
    return [];
  }
}

const mayApply = (entry, template) => entry.template === template || entry.template === null;

async function scan(used, templates) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  const found = new Map();

  for (const template of templates) {
    const selectors = new Set(
      used.filter((entry) => mayApply(entry, template)).map((e) => e.selector),
    );
    const onPage = new Map();

    await page.setContent(readFileSync(pageFile(template), "utf8"));
    for (const selector of selectors) onPage.set(selector, await matches(page, selector));
    found.set(template, onPage);
  }

  await browser.close();
  return found;
}

function spreadOf(found) {
  const spread = new Map();

  for (const onPage of found.values()) {
    for (const [selector, selected] of onPage) {
      if (selected.length > 0) spread.set(selector, (spread.get(selector) ?? 0) + 1);
    }
  }

  return spread;
}

const isSpecific = (spread, selector) => (spread.get(selector) ?? 0) <= SPECIFIC_PAGES;

function homesOf(used, found, spread) {
  const byOwner = new Map();

  for (const entry of used.filter((e) => e.template === null && isSpecific(spread, e.selector))) {
    for (const [template, onPage] of found) {
      if (!(onPage.get(entry.selector) ?? []).some((match) => match.id !== undefined)) continue;

      const byTemplate = byOwner.get(entry.owner) ?? new Map();
      const selectors = byTemplate.get(template) ?? new Set();
      byOwner.set(entry.owner, byTemplate.set(template, selectors.add(entry.selector)));
    }
  }

  const homes = new Map();
  for (const [owner, byTemplate] of byOwner) {
    const best = Math.max(...[...byTemplate.values()].map((selectors) => selectors.size));
    const pages = [...byTemplate].filter(([, selectors]) => selectors.size === best);
    if (best >= HOME_SELECTORS) homes.set(owner, new Set(pages.map(([template]) => template)));
  }

  return homes;
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

/** The elements each page has covered, and the tests of the pages that only a fragment reaches. */
export async function coveredStates(used, templates, declared) {
  const found = await scan(used, templates);
  const spread = spreadOf(found);
  const homes = homesOf(used, found, spread);
  const covered = new Map();
  const viaFragments = new Map();

  for (const template of templates) {
    const elements = new Map();

    for (const entry of used.filter((candidate) => mayApply(candidate, template))) {
      const own = entry.template === template || declared.has(template);
      const home = isSpecific(spread, entry.selector) && homes.get(entry.owner)?.has(template);
      if (!own && !home) continue;

      const opens = performedActions(entry.action).includes("open");
      for (const { id, dropdown } of found.get(template).get(entry.selector)) {
        if (id !== undefined) record(elements, Number(id), entry);
        if (dropdown !== undefined && opens) record(elements, Number(dropdown), entry);
        if (!own && (id !== undefined || dropdown !== undefined)) {
          const tests = viaFragments.get(template) ?? new Set();
          entry.tests.forEach((test) => tests.add(test));
          viaFragments.set(template, tests);
        }
      }
    }
    covered.set(template, elements);
  }

  return { covered, viaFragments };
}
