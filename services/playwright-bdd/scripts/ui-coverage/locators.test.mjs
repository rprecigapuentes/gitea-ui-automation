import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePageObjects } from "./locators.mjs";

const combo = () => parsePageObjects().get("SidebarComboFragment").selectors.get("locators");

test("a selector that a constructor assigns is read, with its open ancestor dropped", () => {
  assert.equal(combo().get("trigger"), ".ui.dropdown a.fixed-text");
});

test("a whole attribute value that a call supplies is left open", () => {
  assert.equal(combo().get("menuItem"), ".menu a.item[data-value]");
});
