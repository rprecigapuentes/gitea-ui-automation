import assert from "node:assert/strict";
import { test } from "node:test";
import { routeTemplate } from "./route-template.mjs";

const cases = {
  "/": "/",
  "/user/login": "/user/login",
  "/alice": "/{owner}",
  "/alice/app": "/{owner}/{repo}",
  "/alice/app/issues/4": "/{owner}/{repo}/issues/{n}",
  "/bob/lib/issues/9": "/{owner}/{repo}/issues/{n}",
  "/alice/app/src/branch/main/docs/a.md": "/{owner}/{repo}/src/*",
  "/org/acme/dashboard": "/org/{org}/dashboard",
  "/acme/-/projects/12": "/{owner}/-/projects/{n}",
};

for (const [pathname, expected] of Object.entries(cases)) {
  test(pathname, () => assert.equal(routeTemplate(pathname), expected));
}
