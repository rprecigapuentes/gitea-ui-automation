## Context

See proposal.md - Why. The Cucumber service's hooks build and quit the driver and nothing else, its World carries an empty `ScenarioState`, and its `PageFactory` exposes the login page, the main page and the nav bar. The Vitest service already solves the same problem, with fixtures: per-test API clients, an owner token resolved per browser, and an auto fixture that deletes the organization when the test ends. None of it is reachable from Cucumber without moving it out of that service, which this change does not do.

Constraints verified against the instance under test (Gitea 1.27.3) and its sources, not assumed:

- There are no API endpoints for projects, project columns or cards, and the issue-creation payload carries no project field. Organizations, repositories and issues do have endpoints.
- The Basic Kanban template creates four columns, not three: a default one, plus the three named ones. The default column cannot be deleted (the server refuses it, and the interface does not offer it), and deleting any other column returns its cards to the default one.
- A card on the board is addressed by the issue's internal id, which is not the number the issue page shows.
- `BaseComponent.findElement` throws when a locator matches more than one element, and `findElements` requires every match to be displayed. A locator that merely happens to put the right element first is not usable here.

## Goals / Non-Goals

**Goals:**

- One seeding mechanism for this service, declared per scenario and visible in the `.feature`.
- Board locators that survive a translated interface, a re-render, and a project whose ids differ on every run.
- Cleanup that cannot leak an organization on a failed scenario.

**Non-Goals:**

- Extracting a seeding layer shared with the Vitest service.
- Any change to the `BaseComponent` / `BasePage` contract that just landed.
- Describing the board's own behaviour anywhere other than the `.feature`.

## Decisions

**Tagged hooks seed; the World only transports.** `Before({ tags: ... })` creates the organization, the two repositories and their issues and writes them into the scenario's `ScenarioState`; `After` with the same tag removes them. Considered seeding in the World constructor, rejected because it runs for every scenario including login. Considered a `Given` step per entity, rejected because four API calls spelled out as steps make the `.feature` document the framework instead of the behaviour under test.

**The project is created by an explicit `Given` through the interface.** There is no API for it, so the alternative would be reaching into the instance's database, which is not something a test may do to the system it is testing, and which the pipeline could not do at all against a remote grid. The cost is roughly four interactions per scenario. The day Gitea exposes a projects API, only that step changes.

**Cleanup deletes the seeded repositories first, then the organization.** Deleting the organization while it still owns repositories is refused: the instance answers 500 with `user still has ownership of repositories`. Deleting each repository first (one call each, verified to answer 204) and then the organization succeeds, and takes the issues and the organization-level projects with it, since those the server does cascade. A single delete of the organization was the first choice and does not work.

**S2-SMK-ISS-04 puts a card in a non-default column by moving the default, not the card.** Proving that a deleted column returns its cards to the default one needs a card outside the default column, and both ways of moving a card (the drag, and the sidebar column combo) are the scenarios this change leaves out. Instead the scenario assigns the issue, which lands it in Backlog, and then uses the set-default item of the To Do column, which sits in the same menu as the delete item already in scope. Backlog becomes an ordinary column holding the card, and deleting it must hand the card to To Do. Considered narrowing the scenario to the half that needs no card, rejected because it drops an acceptance criterion; considered pulling in the sidebar column combo, rejected because that is S2-SMK-ISS-06.

**The oracle is the reloaded board.** Every assertion re-opens the board before reading it, so what is asserted is what the server persisted, not the DOM the page's own JavaScript left behind after an interaction.

**Column locators are built from a root and anchored on attributes, never on rendered text.** A column is found through an attribute of its own menu that carries the column's title; its delete item is found through the HTTP method that item declares; the default column is found through the presence of the tooltip attribute its title carries, not through its name and not through the tooltip's translated value. Considered matching the visible column title, rejected on three counts: the default column's title node also contains an icon, the interface language is a run-time setting of the instance, and the repository's convention is `By.css`. The root-based construction follows `SidebarComboFragment`, which is also what keeps each locator down to the single match `findElement` requires.

**A seeded issue records its internal id as well as its number.** The board addresses a card by the internal id; URLs need the number. Both come back in the same API response, so recording both costs nothing, and it is the only way a step can name a card without reading it off the screen first.

**No identifier that belongs to a run is written into a locator.** Column and project ids exist only after the scenario creates them, so every locator is parameterised by title or by a seeded value read from the scenario context.

## Risks / Trade-offs

- **[Risk]** The attribute a column's title is read from is only rendered for a user with write permission on the project. → **Mitigation**: these scenarios always run as the organization's owner. A read-only variant would need a different anchor, and none is planned.
- **[Risk]** The column root uses `:has()`, which needs a current engine. → **Mitigation**: the repository already depends on it (`SidebarComboFragment.byField`), so this change adds no new constraint. If the browser matrix ever includes an engine without it, both places break together and move together.
- **[Risk]** Creating the project through the interface couples every scenario's background to the creation form, and costs interactions. → **Mitigation**: it is one page object and one step; the coupling is to a form of four fields.
- **[Risk]** A column's delete item lives in a menu that is hidden until opened, so an absence check against it can report a satisfied absence simply because the menu was never opened. → **Mitigation**: the absence is evaluated only after the menu is confirmed open, which is what the `page-objects` contract already requires and what the scenario for the default column depends on.
- **[Risk]** Cleanup is now several calls, so it can fail half way and leave a repository behind. → **Mitigation**: the failure is reported with the name of what it could not delete, and the organization name carries a fixed prefix, so a later run can find and remove leftovers the way the organization suite already does.
- **[Risk]** Deleting the organization at the end of a failed scenario removes the evidence. → **Mitigation**: cleanup runs after the reporter has collected the scenario's attachments, and a failure in cleanup is reported without replacing the scenario's own failure.
