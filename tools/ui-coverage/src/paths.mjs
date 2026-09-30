import path from "node:path";

const DATA = path.resolve(import.meta.dirname, "../../../coverage-data");

export const INVENTORY = path.join(DATA, "inventory/ui-inventory.json");
export const PAGES = path.join(DATA, "pages");
export const REPORTS = path.join(DATA, "reports");

const slug = (template) => template.replace(/[^\w{}-]+/g, "_");

export const pageFile = (template) => path.join(PAGES, `${slug(template)}.html`);
export const idsFile = (template) => path.join(PAGES, `${slug(template)}.ids.json`);
