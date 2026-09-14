## Why

The project board smokes left the drag out. `BaseComponent` can click, type and read; nothing in it moves one element onto another, so a page that wanted to drag would reach for `driver.actions()`, a review blocker.

The board's result also cannot be read where the interaction happened. Its drag library rewrites the DOM before the request that saves the move is answered, and on Firefox geckodriver never emits the `drop`, so the element sits under the target having changed nothing (mozilla/geckodriver#1450). A component needs to confirm the move on a reloaded screen, without touching `driver.wait` or `driver.navigate()` either.

## What Changes

- `BaseComponent` gains `dragAndDrop`, the pointer gesture, and `dispatchDragEvents`, the same drag as the events the page listens for, for an engine whose gesture never completes the drop.
- `BaseComponent` gains `reload`, so a component re-reads a screen without calling the driver. Waiting for it to say yes reuses the predicate wait already there.
- The event sequence lives in one file in the core, the only place that dispatches them.
- The driver sizes its window, because a gesture cannot reach a point outside the viewport and a headless browser opens at 800x600.
- `ProjectColumnFragment` exposes its cards: the container a card is dropped into, and the issue ids it holds.
- `ProjectBoardPage` gains `moveCard(issueId, toColumnTitle)`: the gesture, the reloaded board, and the fallback when that board says it was not kept.
- `project-board.feature` gains S2-ISS-01 and its steps, on the seeding the `@project-board` tag already provides.

### Out of scope

- S2-SMK-ISS-06, the card moved from the issue sidebar: a different control and page object.
- S2-SMK-ISS-07, the collaborator's own session: it needs a team client the API layer does not have.
- Reordering cards, and moving columns: neither is an acceptance criterion.
- Retrying a drag: one that neither persisted nor fell back is a failure, not a flake.

## Capabilities

### New Capabilities

- `core-driver`: how a component performs a drag and waits for the state the server kept rather than the one the interaction left.

### Modified Capabilities

None. The new page methods satisfy the `page-objects` contract unchanged.

## Impact

`core/selenium/ui/base-pages/base-component.ts`, `ui/drivers/driver.factory.ts`, a new `ui/utils/html5-drag.util.ts`, the project board page and its column fragment, and the board feature and steps. The Vitest service gains the `BaseComponent` methods and uses none of them. The only driver change is the window size. No dependency or pipeline change.
