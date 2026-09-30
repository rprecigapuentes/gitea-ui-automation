import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { routeTemplate } from "./route-template.mjs";
import { seed, unseed } from "./seed.mjs";

const BASE = new URL(process.env.GITEA_BASE_URL ?? "http://localhost:3000");
const LIMIT = 200;
const AVOID =
  /logout|delete|\/-\/admin|\/api\/|\/assets\/|\/avatars?\/|\/attachments\/|\/archive\/|\/raw\/|\/media\/|\.rss$/;
const OUTPUT = path.resolve(
  import.meta.dirname,
  "../../../coverage-data/inventory/ui-inventory.json",
);

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

async function crawl(page, seeded) {
  const templates = new Set();
  const queue = ["/", ...seeded.entries];
  const known = new Set(queue.map(routeTemplate));

  while (queue.length > 0 && templates.size < LIMIT) {
    const response = await page.goto(BASE.origin + queue.shift()).catch(() => null);
    if (!response || response.status() >= 400) continue;

    templates.add(routeTemplate(new URL(page.url()).pathname));
    for (const link of await localLinks(page, seeded.owns)) {
      if (known.has(routeTemplate(link))) continue;
      known.add(routeTemplate(link));
      queue.push(link);
    }
  }

  return [...templates].sort();
}

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

mkdirSync(path.dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify({ gitea: version.version, urls }, null, 2)}\n`);
console.log(`${urls.length} URLs written to ${OUTPUT}`);
