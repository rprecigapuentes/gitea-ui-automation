## Context

See proposal.md - Why. Five independent cleanups bundled into one change because they're all "the structure stopped matching what the code actually is" — the same category of problem as the `business-logic-selenium` rename, just the rest of it. The Factory addition is a genuinely new (small) pattern, worth writing down once for both packages since it's the same shape in each.

## Goals / Non-Goals

**Goals:**

- Every folder name says what's actually in it: no `ui/` wrapper holding the only content a package has, no `config/` that's actually just BrowserStack, no package split by a technology distinction (`api`/`common`) that no longer exists.
- A consumer picks a technology once, through one Factory call, instead of importing a specific `createXStrategy` function per technology.
- Zero behavior change anywhere — every moved file's content is unchanged beyond import paths; every Factory method is a one-line delegate to the constructor it replaces.

**Non-Goals:**

- Changing what `IInteractionStrategy`/`IRequestStrategy` require, or any strategy's internals.
- A shared Factory abstraction between `core/page-objects` and `core/api-client`. They construct different things (`IInteractionStrategy` from a driver/page, `IRequestStrategy` from a baseUrl/token) with no common shape worth a generic `IStrategyFactory<T>` — two small, independent classes, same idea, is enough.

## Decisions

**`business-logic/api` and `business-logic/common` merge into one package, `business-logic/` itself.** Both are already 100% technology-agnostic — there's no split left to justify two packages. The merged package holds exactly `clients/`, `pages/`, `entities/`, `state/`; `PageFactory` goes into `pages/` since assembling pages is what it does. Root `package.json`'s `workspaces` entry changes from `"business-logic/*"` to `"business-logic"` — a literal path, not a glob, since there's now exactly one package there, not several.

**Interfaces and Context classes stay at each package's top level; only the concrete, technology-named implementations move into `strategies/`.** `interaction-strategy.interface.ts`, `element-handle.interface.ts`, `base-component.ts`, `base.page.ts`, `errors.ts` in `core/page-objects`, and `request-strategy.interface.ts`, `gitea-api-client.ts` in `core/api-client`, aren't technology-specific — moving them would say "these belong to a browser/HTTP technology" when the entire point of the Strategy pattern is that they don't.

**The Factory replaces the old `createXStrategy` functions rather than wrapping them.** Keeping both would mean two ways to construct the same strategy for no reason — confusing, not backward-compatible for its own sake. `InteractionStrategyFactory.selenium(driver)` / `.playwright(page)` and `RequestStrategyFactory.got(baseUrl, token)` / `.playwright(baseUrl, token)` are one-line delegates straight to `new SeleniumInteractionStrategy(driver)` etc. — the Factory is the only public construction path now.

**`core/selenium/config/` renames to `browserstack-config/` rather than flattening to a bare file.** Its one file, `browserstack.config.ts`, keeps its own name; only the folder's name changes, since the folder — not the file — was the vague one.

## Risks / Trade-offs

- **The `business-logic` merge is the widest single change here**: every file that imported `@gitea-automation/business-logic-api/*` or `@gitea-automation/business-logic-common/*` needs its specifier updated, and imports that crossed the old package boundary (pages importing entities) become in-package relative imports. Confirmed via grep before starting: no other package imports anything from these two beyond the plain client/entity/page/state paths already accounted for.
- **Removing `createSeleniumStrategy`/`createPlaywrightStrategy`/`createGotStrategy` is a breaking API change** for the two `core/` packages — every consumer (3 services) needs the same-turn update. Accepted: same reasoning as every prior breaking constructor/API change this branch (`GiteaApiClient`, `PageFactory`) — no value in a temporary dual API when every caller is in this repo and gets updated in the same commit.
