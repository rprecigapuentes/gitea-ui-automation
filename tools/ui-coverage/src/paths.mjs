import path from "node:path";

const DATA = path.resolve(import.meta.dirname, "../../../coverage-data");

export const INVENTORY = path.join(DATA, "inventory/ui-inventory.json");
export const PAGES = path.join(DATA, "pages");

export const pageFile = (template) =>
  path.join(PAGES, `${template.replace(/[^\w{}-]+/g, "_")}.html`);
