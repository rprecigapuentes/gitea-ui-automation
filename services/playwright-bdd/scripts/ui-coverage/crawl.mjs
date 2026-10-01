// Crawls the application as the run's owner, stores each page's DOM and writes the inventory of
// URLs, elements and states that the coverage is measured against.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  collectElements,
  describe,
  keyOf,
  openMenus,
  readStates,
  withOrdinals,
} from "./elements.mjs";
import { idsFile, INVENTORY, PAGES, pageFile } from "./paths.mjs";
import { routeTemplate } from "./route-template.mjs";
import { seed, unseed } from "./seed.mjs";

const BASE = new URL(process.env.GITEA_BASE_URL ?? "http://localhost:3000");
// A ceiling on the URLs visited, so a crawl that finds an endless link space still ends.
const LIMIT = 200;
// Never followed: sign-out, deletes, the admin area and non-page resources.
const AVOID =
  /logout|delete|\/-\/admin|\/api\/|\/assets\/|\/avatars?\/|\/attachments\/|\/archive\/|\/raw\/|\/media\/|\.rss$/;

async function signIn(page) {
  await page.goto(`${BASE.origin}/user/login`);
  await page.fill("#user_name", process.env.GITEA_OWNER_CHROME);
  await page.fill("#password", process.env.GITEA_OWNER_CHROME_PASSWORD);
  await page.press("#password", "Enter");
  await page.waitForURL((url) => url.pathname !== "/user/login");
}

async function localLinks(page, owns) {
  const hrefs = await page.$$eval("a[href]", (anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  );
  // A templated route is followed only when it belongs to the data this crawl seeded.
  return hrefs
    .map((href) => new URL(href, page.url()))
    .filter((url) => url.port === BASE.port && !AVOID.test(url.pathname))
    .map((url) => url.pathname)
    .filter((pathname) => !routeTemplate(pathname).includes("{") || owns(pathname));
}

function merge(states, observed) {
  for (const [id, list] of observed) list.forEach((state) => states[id]?.add(state));
}

const replacementsOf = ({ owner, repo, org }) => [
  [repo, "{repo}"],
  [org, "{org}"],
  [owner, "{owner}"],
];

async function save(page, template, seeded) {
  // Lets late rendering settle before the page is read.
  await page.waitForTimeout(500);
  const found = await page.evaluate(collectElements);
  const states = found.map(() => new Set());

  merge(states, await page.evaluate(readStates));
  writeFileSync(pageFile(template), await page.content());
  // Read again with the drop-down menus open: their items only exist then.
  await page.evaluate(openMenus);
  merge(states, await page.evaluate(readStates));

  const described = withOrdinals(
    found.map((element) => describe(element, page.url(), replacementsOf(seeded))),
  );
  writeFileSync(idsFile(template), JSON.stringify(described.map(keyOf)));

  const elements = described.map((element, index) => ({
    ...element,
    states: [...states[index]].sort(),
  }));
  return { elements: elements.sort(compare) };
}

function compare(a, b) {
  return keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0;
}

const sorted = (urls) =>
  Object.fromEntries(Object.entries(urls).sort(([a], [b]) => a.localeCompare(b)));

// Only seen signed out: a signed-in session is sent away from it.
async function visitLogin(page) {
  await page.goto(`${BASE.origin}/user/login`);
  return { "/user/login": await save(page, "/user/login", {}) };
}

async function crawl(page, seeded) {
  const urls = {};
  const queue = ["/", ...seeded.entries];
  const known = new Set(queue.map(routeTemplate));

  while (queue.length > 0 && Object.keys(urls).length < LIMIT) {
    // A URL that does not load is skipped: one dead link must not end the crawl.
    const response = await page.goto(BASE.origin + queue.shift()).catch(() => null);
    if (!response || response.status() >= 400) continue;

    const template = routeTemplate(new URL(page.url()).pathname);
    if (!urls[template]) urls[template] = await save(page, template, seeded);
    for (const link of await localLinks(page, seeded.owns)) {
      if (known.has(routeTemplate(link))) continue;
      known.add(routeTemplate(link));
      queue.push(link);
    }
  }

  return sorted(urls);
}

mkdirSync(PAGES, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const login = await visitLogin(page);
await signIn(page);
const seeded = await seed(page);
let urls;
// Whatever the crawl does, the seeded data is deleted and the browser closed.
try {
  urls = sorted({ ...login, ...(await crawl(page, seeded)) });
} finally {
  await unseed(seeded);
  await browser.close();
}

const version = await fetch(`${BASE.origin}/api/v1/version`).then((response) => response.json());

mkdirSync(path.dirname(INVENTORY), { recursive: true });
writeFileSync(
  INVENTORY,
  `${JSON.stringify({ gitea: version.version, urls }, null, 2)}
`,
);
console.log(`${Object.keys(urls).length} URLs written to ${INVENTORY}`);
