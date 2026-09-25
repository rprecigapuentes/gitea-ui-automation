## 1. Add the scenario

- [x] 1.1 Write `services/playwright-native/tests/create-issue/title-only.spec.ts`: log in as the owner through the UI, open the new-issue form for a repository, fill only the title, leave the description empty, submit, and confirm the issue is created with the entered title, an empty rendered body and the `Open` state

The scenario was verified in the browser during the exploration recorded in `specs/create-issue.plan.md`, section 1.2. Gitea accepts the submission and renders the issue with no comment body.

The repository `chrome-owner/agent-baseline` exists on the local instance at `http://localhost:3000` and the owner credentials are in `.env` under `GITEA_OWNER_CHROME` and `GITEA_OWNER_CHROME_PASSWORD`.

## 2. Close whatever gap the scenario finds

- [x] 2.1 Add the page-object method the scenario needed and did not find, if any, under `business-logic/pages/issues/`, rather than inlining a locator in the spec

## 3. Wrap up

- [x] 3.1 Run the new spec on chrome against the local instance
- [x] 3.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
