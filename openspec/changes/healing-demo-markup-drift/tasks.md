## 1. The drift, in the core

- [x] 1.1 Add `core/selenium/ui/utils/markup-drift.util.ts` with a `renameClass(driver, elements, from, to)` that runs one `classList.replace` script over the elements it is given, and a `BaseComponent.renameClass(locator, from, to, root?, timeoutMs?)` that resolves the locator through `findElements` and hands the elements to it. Verify with `npm run typecheck` and `npm run lint` clean.

## 2. The page and the case

- [x] 2.1 In `label-list.page.ts`, derive `editButton` from one `EDIT_BUTTON_CLASS` constant and add `driftEditButtons()` that renames it to `edit-label-btn` through the base component. Verify with `npm run typecheck`.
- [x] 2.2 Add `services/gitea-selenium-vitest/tests/healing.test.ts` with `AT-HEAL-01`: `repository` and `classificationLabel` fixtures, open the label list, `driftEditButtons()`, then `waitForLabel(classificationLabel.name)` returns a row whose `name` matches. Skip with a message when `SELENIUM_REMOTE_URL` is unset. Verify locally that the case reports skipped, and that with the drift commented out it passes through the direct path.

## 3. The heal, in CT

- [x] 3.1 Push, let CT run vitest, and read the session of `healing.test.ts` per browser in `reports/healenium/*.heals.json`: one heal, `failedLocatorValue` `.edit-label-button`, a healed CSS locator, a score. Verify the case passes on the three browsers and that `https://healenium.estiberz.online/healenium/report` shows the heal with its screenshot.

## 4. Make the heal legible in the CT log

- [x] 4.1 The evidence step reads the heal count from the proxy log (`Using healed locator`) instead of `/report/data`, which stays empty on hlm-proxy 2.2.1 because the heal is saved without a sessionKey and never linked into a report. Verify in CT that the session of `healing.test.ts` prints `.edit-label-button -> a.edit-label-btn (0.98)`.
