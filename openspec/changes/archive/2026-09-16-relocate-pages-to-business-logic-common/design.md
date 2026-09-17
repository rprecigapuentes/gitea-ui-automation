## Context

See proposal.md - Why. `business-logic/README.md` documented the prior structure as a deliberate two-way split by tool (`selenium/` vs `playwright/`), each internally split by layer (`ui/` vs `api/`) the way `core/*` already is. This change starts to move away from that: `ui/pages/**` no longer lives under either tool-named package, because pages are the layer the eventual multi-tool support has to reach first.

## Goals / Non-Goals

**Goals:**

- The moved files compile, lint and typecheck exactly as before — this is a location change, not a behavior change.
- Every import crossing what is now a package boundary goes through the target package's declared name and `exports` map, never a relative path reaching across workspaces (the pattern every service already used for `api/entities`, `api/clients` and `state`).

**Non-Goals:**

- Rewriting the pages to drop their `selenium-webdriver`/`core-selenium` dependency. They are relocated, not yet portable — `playwright-native` still cannot use them.
- Deciding the final shape of `business-logic/common` (whether `api/` moves there too, whether it gains its own entities, whether `business-logic/selenium` keeps its name once most of its layer split is gone). One workspace holding `ui/pages/**` is the only claim this change makes.

## Decisions

**A new workspace (`business-logic/common`), not a folder moved within `business-logic/selenium`.** The pages needed to stop being importable as `@gitea-automation/business-logic-selenium/ui/pages/...` — that specifier says "this is Selenium's," which is exactly what no longer holds. A new package name is what actually changes that signal; nesting the folder differently inside the same package would not.

**The moved pages keep importing `business-logic-selenium`'s `api/entities` by package name, not by copying or moving the entities too.** The entities are already documented as tool-agnostic (`business-logic/selenium/api/entities/**` — pure data shapes, no `WebDriver`/`By`); moving them as well was a larger, undecided step (proposal.md's Out of scope). Importing them by name is exactly the dependency every service already declares on `business-logic-selenium` for the same entities, so `business-logic-common` depending on it the same way is consistent, not a new kind of coupling.

**`business-logic/selenium/package.json` loses its `"./ui/*"` export instead of keeping it as a dead alias.** Nothing resolves through it anymore now that `ui/` is empty; keeping it would silently claim a capability the package no longer has.

## Risks / Trade-offs

- **A page importing both `business-logic-common` (for itself) and `business-logic-selenium` (for entities) reads as an odd dependency direction while the rename is mid-flight** — a package named "common" depending on one named "selenium". → Named and scoped deliberately as an interim state (see Non-Goals): resolved whenever the entities question is decided, not before.
- **Four service/package READMEs and the root README now describe a structure that no longer matches the tree.** → Left unfixed on purpose (proposal.md's Out of scope) until the reorg's direction is settled, rather than documenting an intermediate state that would need rewriting again shortly after.
