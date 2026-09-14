## Why

The project board smokes left the drag out. `BaseComponent` can click, type and read; nothing in it moves one element onto another, so a page that wanted to drag would reach for `driver.actions()`, a review blocker.

The board's result also cannot be read where the interaction happened. Its drag library rewrites the DOM before the request that saves the move is answered, and on Firefox geckodriver moves the element during `dragover` and never emits the `drop`, so the element sits in the target column having changed nothing (mozilla/geckodriver#1450). A component needs to confirm the move on a reloaded screen, without touching `driver.wait` or `driver.navigate()` either.

## What Changes

- `BaseComponent` gains `dragAndDrop`, the pointer gesture, and `dispatchDragEvents`, the same drag as the event sequence the page listens for, for an engine whose gesture never completes the drop.
- `BaseComponent` gains `reload` and `waitUntil`, so a component can re-read a screen and wait for its own condition without calling the driver.
- The event sequence lives in `core/selenium/ui/utils/html5-drag.util.ts`, the only place that runs a script in the browser.
- `ProjectColumnFragment` exposes its cards: the container a card is dropped into, and the issue ids it holds.
- `ProjectBoardPage` gains `moveCard(issueId, toColumnTitle)`: the gesture, then the reloaded board, then the fallback when the reloaded board says the move was not kept.
- `project-board.feature` gains S2-ISS-01 and its steps, on the seeding the `@project-board` tag already provides.

### Out of scope

- S2-SMK-ISS-06, moving a card from the issue sidebar: a different control and a different page object.
- S2-SMK-ISS-07, the collaborator's own session: it needs a team client the API layer does not have.
- Reordering cards within a column, and moving columns: same library, neither an acceptance criterion.
- Retrying a drag. A gesture that neither persisted nor fell back is a failure, not a flake to paper over.

## Capabilities

### New Capabilities

- `core-driver`: how a component performs a drag, and how it waits for the state the server kept rather than the state the interaction left on the screen.

### Modified Capabilities

None. The new page methods satisfy the `page-objects` contract without changing it.

## Impact

`core/selenium/ui/base-pages/base-component.ts`, a new `core/selenium/ui/utils/html5-drag.util.ts`, the project board page and its column fragment, and the project board feature and steps in `services/gitea-selenium-cucumber/`. The Vitest service gains the `BaseComponent` methods and uses none of them. No driver, dependency or pipeline change.
