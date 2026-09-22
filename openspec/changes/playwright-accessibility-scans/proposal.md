# Proposal

## Why

Accessibility is one of the two non-functional areas the module implements, and nothing in the framework scans for it. The application under test has never been evaluated against WCAG, so the first run produces an inventory, not a verdict: the deliverable is the reading of it, not only its production.

## What Changes

- Add `@axe-core/playwright` to `services/playwright-native` and a `makeAxeBuilder` fixture fixing the rule tags in one place.
- Scan three pages, each in its own spec: the login form as an anonymous visitor, the user dashboard and organization creation as the signed-in owner, reusing the existing `sessionManager`.
- Scan on `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`, the set the documentation names. No further tag is added: a wider set would change what the baseline means before anyone has read the first one.
- Assert on a fingerprint of the violations rather than on an empty list. The pages carry violations today, so an empty-list assertion would fail forever and be silenced. A fingerprint baseline fails only on a violation that was not there before, and is itself the inventory to triage.
- Publish each scan twice: attached to the result, which Allure picks up; and written to `reports/accessibility/` as raw JSON, which is what triage reads.
- Report each finding against WCAG, not only against axe: the success criteria and conformance level come from the tags each rule already carries. It stays a reading of the findings, not a conformance claim, which no automated scan can give.
- Give the scans their own Playwright projects under `tests/non-functional/accessibility/`. The functional projects ignore `non-functional/`, so the two never run together and each area carries settings of its own. A scan runs on bundled Chromium by default; the three branded browsers are defined for the same scans and share one baseline, since axe evaluates the DOM rather than the render.
- Run them from `.gitea/workflows/accessibility.yml`, dispatched by hand, so an evidence-producing suite never sits in the continuous-testing path.

## Capabilities

### New Capabilities

- `accessibility`: what the scan suite covers, how it decides an outcome, and what evidence it leaves behind.

### Modified Capabilities

- `pipeline`: adds a requirement for a non-functional suite that runs on its own manually dispatched workflow, outside the default `test` entry point.

## Impact

- `services/playwright-native/` (fixture, config, specs, baselines, `package.json`), `.gitea/workflows/accessibility.yml`, `package-lock.json`, both READMEs.

## Out of Scope

- Wiring the scans into `ct.yml`: Gitea issue 108, which waits on the visual and performance suites.
- Visual regression and performance, which reuse this project layout but land as their own changes.
- Filing the triaged findings as bugs: each bug is its own report.
- Any page beyond the three named, and any remediation of the application under test.
