## Why

`services/playwright-native` is a reserved workspace holding only a `package.json` — no dependency, no config, nothing runnable. Before any Gitea-specific Playwright work can start, the workspace needs the standard Playwright scaffold in place and proven to run.

## What Changes

- Add `@playwright/test` as a dev dependency of `@gitea-automation/playwright-native`.
- Scaffold the standard `npm init playwright@latest` output: `playwright.config.ts`, the default `tests/example.spec.ts` (and `tests-examples/` if the installer generates it), and browser binaries installed via `npx playwright install`.
- Add a `test` script to the workspace's `package.json` so `npm test -w @gitea-automation/playwright-native` runs the example spec.
- Update the workspace's own README to reflect that it is now installable and runnable, while keeping the "no Gitea-specific code yet" framing intact.

### Out of scope

- Any Gitea-specific test, page object, or API client.
- Wiring `core-playwright` or `business-logic-playwright` — both stay reserved/empty per their own READMEs.
- Adding `playwright-native` to `.gitea/workflows/ct.yml`. The workflow already picks up any service exposing a `test` script without editing the workflow itself, but turning that on (and provisioning a target Gitea instance for it) is separate follow-up work, not part of making the workspace locally runnable.
- Any BrowserStack, Allure, or reporting integration.

## Capabilities

No spec-level behavior changes: this only scaffolds the default Playwright example inside an already-reserved, empty workspace. `.openspec.yaml` for this change sets `skip_specs: true`.

## Impact

`services/playwright-native/package.json`, `services/playwright-native/playwright.config.ts`, `services/playwright-native/tests/example.spec.ts`, `services/playwright-native/README.md`, root `package-lock.json`. No change to `core/`, `business-logic/`, or `.gitea/workflows/`.
