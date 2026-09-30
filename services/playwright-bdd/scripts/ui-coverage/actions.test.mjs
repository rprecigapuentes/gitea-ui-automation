import assert from "node:assert/strict";
import { test } from "node:test";
import { performedActions, possibleActions } from "./actions.mjs";

test("the possible actions follow the role of the element", () => {
  assert.deepEqual(possibleActions("button"), ["click"]);
  assert.deepEqual(possibleActions("textbox"), ["fill", "clear"]);
  assert.deepEqual(possibleActions("dropdown"), ["open"]);
  assert.deepEqual(possibleActions("unknown"), []);
});

test("a click performs the actions that a click carries out", () => {
  assert.deepEqual(performedActions("clickAndWaitForUrl"), ["click", "open", "toggle", "choose"]);
});

test("typing fills, and clearAndType also clears", () => {
  assert.deepEqual(performedActions("type"), ["fill"]);
  assert.deepEqual(performedActions("clearAndType"), ["fill", "clear"]);
});

test("a read performs no action", () => {
  assert.deepEqual(performedActions("getText"), []);
  assert.deepEqual(performedActions(), []);
});
