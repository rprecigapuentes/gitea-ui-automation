# Tasks

## 1. Scaffold

- [ ] 1.1 `tools/ui-coverage` workspace and `tools/*` in the root workspaces.
- [ ] 1.2 `route-template.mjs`: reduce a pathname to a route template, with a unit test.

## 2. URL level

- [x] 2.1 Crawler over same-origin links, signed in through the API session, writing the URLs of
      `ui-inventory.json`.
- [x] 2.2 Parser: the `getUrl()` of each page object reached by a BDD step, as a route template.
- [x] 2.3 URL figure printed by `npm run coverage`.

## 3. Element level

- [x] 3.1 Crawler stores, per URL, the interactive elements and the DOM.
- [x] 3.2 Parser: the locators of each page object, and which ones a step reaches.
- [x] 3.3 Matcher runs the used locators on the stored DOM. Element figure.

## 4. State level

- [x] 4.1 Crawler records the states of each element.
- [x] 4.2 Map the reading methods to the states they imply. State figure.

## 5. Report

- [ ] 5.1 `coverage.json` and `coverage.md`, with the delta against the committed inventory.
- [ ] 5.2 Verified: two crawls give the same inventory, and adding a step that reaches one more
      locator raises the element figure by exactly what it selects.
