import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pageFile } from "./paths.mjs";

async function matches(page, selector) {
  try {
    const ids = await page.$$eval(selector, (found) => found.map((element) => element.dataset.cov));
    return ids.filter((id) => id !== undefined).map(Number);
  } catch {
    return [];
  }
}

export async function coveredElements(used, templates, reached) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  const covered = new Map();

  for (const template of templates) {
    const selectors = used
      .filter(
        (entry) =>
          entry.template === template || (entry.template === null && reached.has(template)),
      )
      .map((entry) => entry.selector);
    const ids = new Set();

    await page.setContent(readFileSync(pageFile(template), "utf8"));
    for (const selector of selectors) (await matches(page, selector)).forEach((id) => ids.add(id));
    covered.set(template, ids);
  }

  await browser.close();
  return covered;
}
