import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { collectElements, keyOf, withOrdinals } from "./elements.mjs";
import { INVENTORY, PAGES, pageFile } from "./paths.mjs";
import { routeTemplate } from "./route-template.mjs";
import { seed, unseed } from "./seed.mjs";

const BASE = new URL(process.env.GITEA_BASE_URL ?? "http://localhost:3000");
const LIMIT = 200;
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
  return hrefs
    .map((href) => new URL(href, page.url()))
    .filter((url) => url.port === BASE.port && !AVOID.test(url.pathname))
    .map((url) => url.pathname)
    .filter((pathname) => !routeTemplate(pathname).includes("{") || owns(pathname));
}

async function save(page, template) {
  const found = await page.evaluate(collectElements);
  const elements = withOrdinals(found.map((element) => keyOf(element, page.url())));
  writeFileSync(pageFile(template), await page.content());
  return { elements };
}

async function crawl(page, seeded) {
  const urls = {};
  const queue = ["/", ...seeded.entries];
  const known = new Set(queue.map(routeTemplate));

  while (queue.length > 0 && Object.keys(urls).length < LIMIT) {
    const response = await page.goto(BASE.origin + queue.shift()).catch(() => null);
    if (!response || response.status() >= 400) continue;

    const template = routeTemplate(new URL(page.url()).pathname);
    if (!urls[template]) urls[template] = await save(page, template);
    for (const link of await localLinks(page, seeded.owns)) {
      if (known.has(routeTemplate(link))) continue;
      known.add(routeTemplate(link));
      queue.push(link);
    }
  }

  return Object.fromEntries(Object.entries(urls).sort(([a], [b]) => a.localeCompare(b)));
}

mkdirSync(PAGES, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await signIn(page);
const seeded = await seed(page);
let urls;
try {
  urls = await crawl(page, seeded);
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
