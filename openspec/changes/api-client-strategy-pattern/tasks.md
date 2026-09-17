## 1. Scaffold core/api-client

- [x] 1.1 Create `core/api-client/package.json` (`@gitea-automation/core-api-client`, `exports: {"./*": "./*.ts"}`, deps on `got`/`@gitea-automation/core-logger`) and `tsconfig.json`
- [x] 1.2 Write `request-strategy.interface.ts` (`IRequestStrategy`: `get<T>`, `post<T>`, `put<T>`, `delete<T = void>`, all returning the parsed body)
- [x] 1.3 Write `got-request-strategy.ts` (`GotRequestStrategy` — real port of today's `got.extend()` config and logging hooks — plus `createGotStrategy(baseUrl, token)`)
- [x] 1.4 Write `gitea-api-client.ts` (`GiteaApiClient` — same public `(baseUrl, token)` constructor, builds a `GotRequestStrategy` internally, exposes `get`/`post`/`put`/`delete` to subclasses)
- [x] 1.5 Verify `npm run typecheck -w @gitea-automation/core-api-client` passes standalone and nothing else in the repo changes (the old `core/selenium/api/gitea-client.client.ts` still exists and is still what every client uses)

## 2. Migrate the 7 clients and their callers

- [ ] 2.1 Migrate `issue.client.ts`, `label.client.ts`, `milestone.client.ts`, `repository.client.ts`, `user.client.ts`: import `GiteaApiClient` from `core-api-client`, call `this.post`/`this.get`/`this.delete` instead of `this.client.*`, return `Promise<T>` instead of `Promise<Response<T>>`, drop the `got` import
- [ ] 2.2 Migrate `organizations.client.ts` the same way, plus rename its local `Organization` interface to `OrganizationSummary` and update `deleteAllOrganizations` to stop destructuring `.body` off `getUserOrganizations()`
- [ ] 2.3 Migrate `team.client.ts` the same way, plus rename its local `Team` interface to `TeamSummary`
- [ ] 2.4 Update `business-logic/selenium/package.json`: drop `@gitea-automation/core-selenium`, add `@gitea-automation/core-api-client`
- [ ] 2.5 Update every caller that destructured `.body`: `services/gitea-selenium-vitest/src/fixtures/fixture.ts` (5 sites — `scopedLabels`, `issue`, `maintainer`, `classificationLabel`, `milestone`), `services/gitea-selenium-cucumber/features/support/hooks.ts` (2 sites — `seedOrganizationWithIssues`, the `@demo-e2e` hook), `services/gitea-selenium-cucumber/features/support/seeded-users.ts` (1 site — `createSeededUsers`)
- [ ] 2.6 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` are green, grep confirms zero `got`/`Response` imports left in the 7 migrated client files; run `npm run test:chrome -w @gitea-automation/gitea-selenium-vitest` against the local Gitea instance and confirm organizations/issues/labels/milestones still get created and read correctly through the migrated clients

## 3. Retire core/selenium/api

- [ ] 3.1 Delete `core/selenium/api/gitea-client.client.ts` and the now-empty `api/` directory; drop `"./api/*"`, `got`, and `@gitea-automation/core-logger` from `core/selenium/package.json`
- [ ] 3.2 Update the one-line mentions of `core/selenium`'s `api/` folder in `core/selenium/README.md` and `core/README.md`
- [ ] 3.3 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` are green, grep confirms zero remaining references to `core-selenium/api/gitea-client.client` anywhere in the repo, `core-selenium`'s own typecheck still passes with only `selenium-webdriver` as a real dependency; run the full regression: `gitea-selenium-vitest` on all 3 browsers plus `gitea-selenium-cucumber`'s `@smoke` scenarios
