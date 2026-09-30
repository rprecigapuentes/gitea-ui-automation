import assert from "node:assert/strict";
import { test } from "node:test";
import { describe } from "./elements.mjs";

const page = "http://localhost:3000/alice/app";

test("a button keeps the name the page gives it", () => {
  assert.deepEqual(describe({ role: "button", name: "Create Issue", href: null }, page), {
    type: "button",
    name: "Create Issue",
  });
});

test("a link is named by its text and keeps the kind of page it leads to", () => {
  const link = { role: "link", name: "Issues 12", href: "/alice/app/issues" };

  assert.deepEqual(describe(link, page), {
    type: "link",
    name: "Issues N",
    target: "/{owner}/{repo}/issues",
  });
});

test("a link without text is named by its target", () => {
  const link = { role: "link", name: "", href: "/alice/app/issues" };

  assert.equal(describe(link, page).name, "/{owner}/{repo}/issues");
});

test("what a run generates is replaced by a placeholder", () => {
  const replacements = [["alice", "{owner}"]];

  assert.equal(
    describe({ role: "link", name: "alice", href: "/" }, page, replacements).name,
    "{owner}",
  );
  assert.equal(describe({ role: "link", name: "9f3a2bc", href: "/" }, page).name, "{hash}");
  assert.equal(describe({ role: "link", name: "3 hours ago", href: "/" }, page).name, "{time}");
});
