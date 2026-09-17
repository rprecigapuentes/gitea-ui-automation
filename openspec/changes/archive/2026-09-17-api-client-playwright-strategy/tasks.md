## 1. Add PlaywrightRequestStrategy and switch GiteaApiClient to injection

- [x] 1.1 Write `core/api-client/playwright-request-strategy.ts` (`PlaywrightRequestStrategy implements IRequestStrategy`, lazily-created `APIRequestContext` via `request.newContext({baseURL, extraHTTPHeaders})`, parses empty bodies as `undefined`) plus `createPlaywrightStrategy(baseUrl, token)`
- [x] 1.2 Add `@playwright/test` to `core/api-client/package.json` dependencies
- [x] 1.3 Change `GiteaApiClient`'s constructor from `(baseUrl, token)` to `(strategy: IRequestStrategy)`; drop its `createGotStrategy` import
- [x] 1.4 Update `core/api-client/README.md` (structure, pattern example, dependencies, current-limitation section)
- [x] 1.5 Verify `npm run typecheck -w @gitea-automation/core-api-client` passes standalone

## 2. Update every client construction site to inject GotRequestStrategy

- [x] 2.1 `services/gitea-selenium-cucumber/features/support/hooks.ts` — `ownerClients()`, 5 sites
- [x] 2.2 `services/gitea-selenium-cucumber/features/support/seeded-users.ts` — `adminClient()`, 1 site
- [x] 2.3 `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts` — 1 site
- [x] 2.4 `services/gitea-selenium-vitest/src/fixtures/fixture.ts` — `userClient`, `organizationClient` (x2), `repositoryClient`, `labelClient`, `issueClient`, `milestoneClient`, 7 sites
- [x] 2.5 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 3. Verify PlaywrightRequestStrategy end to end

- [x] 3.1 Standalone `tsx` smoke script against the local Gitea instance: construct `createPlaywrightStrategy(baseUrl, token)`, wrap it in a `GiteaApiClient` subclass (e.g. `OrganizationClient`), exercise create/get/delete, confirm real HTTP round-trips and that a deliberate failure (e.g. deleting a nonexistent org) throws. Found and fixed a real bug this way: `baseURL: \`${baseUrl}/api/v1\``(no trailing slash) made Playwright's WHATWG-based URL resolution drop the`v1`segment when joining a relative endpoint like`orgs` (`.../api/v1`+`orgs`→`.../api/orgs`, not `.../api/v1/orgs`) — `got`'s `prefixUrl`doesn't have this behavior, so it wasn't caught by parity with`GotRequestStrategy`. Fixed by adding the trailing slash. After the fix: create/list/delete all round-tripped correctly, and a second delete of the same org correctly threw (non-ok response handling works)
- [x] 3.2 Ran the real suites once more. `gitea-selenium-vitest` chrome: 4/4 passed, including `organizations.test.ts` (previously flaky in earlier runs this session, clean this time). `gitea-selenium-cucumber` chrome (no tag filter, full run): 9/12 passed; the 3 broken scenarios (`Add a repository to a team` x2, `Change team members permissions`) all failed on a plain Selenium `TimeoutError` mid-UI-wait, not any API call — and `organizations.steps.ts` already documents exactly this category of flake at lines 213 and 299 ("can outlast Cucumber's default step timeout under load"). Zero regressions from the constructor-injection change
- [x] 3.3 Archive this change and commit

## 4. Code review fixes

- [x] 4.1 Removed the non-ok-check/throw wrapper from `PlaywrightRequestStrategy` (`core/api-client/playwright-request-strategy.ts`) — flagged as unnecessary for now, since nothing yet constructs a client with this strategy. `get`/`post`/`put`/`delete` now just parse the response body directly
- [x] 4.2 Stopped `organizations.steps.ts` from constructing its own `OrganizationClient`/`GotRequestStrategy` inline — flagged as breaking the rule that steps only reach clients/pages through the world or through hooks. Added `organizationClient` to `GiteaWorld`, populated once per scenario in the general `Before` hook via the existing `ownerClients()` helper; the step now reads `this.organizationClient`
- [x] 4.3 Verified `npm run typecheck --workspaces --if-present` and `npm run lint` green; re-ran the `tsx` smoke script (create/list/delete round-trip correctly without the throw wrapper); re-ran `gitea-selenium-cucumber` chrome — all three scenarios using "an organization already exists" passed, the same two pre-existing UI-timing flakes as before (unrelated to this fix) were the only failures
