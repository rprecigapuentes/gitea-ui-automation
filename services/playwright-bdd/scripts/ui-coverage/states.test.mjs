import assert from "node:assert/strict";
import { test } from "node:test";
import { impliedStates } from "./states.mjs";

test("an interaction implies visible and enabled", () => {
  assert.deepEqual(impliedStates("click"), ["visible", "enabled"]);
  assert.deepEqual(impliedStates("clickAndWaitForUrl"), ["visible", "enabled"]);
});

test("a state reader implies both values of its dimension", () => {
  assert.deepEqual(impliedStates("isRadioSelected"), ["visible", "checked", "unchecked"]);
});

test("anything else implies only visible", () => {
  assert.deepEqual(impliedStates("getText"), ["visible"]);
  assert.deepEqual(impliedStates(), ["visible"]);
});
