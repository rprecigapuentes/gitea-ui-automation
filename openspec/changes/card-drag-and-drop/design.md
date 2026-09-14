## Context

See proposal.md - Why. What follows was verified against the instance under test (Gitea 1.27.3) and its templates, not assumed.

- The board is a SortableJS list initialised without `forceFallback`, so it runs on the browser's own HTML5 drag events rather than on synthesised mouse moves.
- A card is `#project-board .issue-card[data-issue="<issue id>"]`, addressed by the issue's internal id. The drop target is the column's `.cards` container, not the column root: dropping on the root lands outside the sortable list.
- A card's move is saved by a request the library sends after it has already moved the node, so the DOM says the move succeeded before the server has been asked.
- geckodriver moves the element during `dragover` and never emits the `drop` (mozilla/geckodriver#1450, open since 2019). SortableJS never fires `onAdd`, no request leaves the browser, and the card sits under the target column having changed nothing. Chromium completes the same gesture.
- `BaseComponent.findElement` throws when a locator matches more than one element, and `findElements` requires every match to be displayed.

## Goals / Non-Goals

**Goals:**

- One way to drag, owned by the core, so no page reaches for the driver.
- An assertion that reads what the server kept, never what the interaction left on the screen.
- The same scenario passing on Chrome, Firefox and Edge without a per-browser branch in the feature or in the steps.

**Non-Goals:**

- Making geckodriver emit the drop. It is the browser driver's defect, not the framework's.
- A general gesture API. Only the drag this board needs is added.
- Changing the `BaseComponent` / `BasePage` contract for anything that already exists.

## Decisions

**The gesture is attempted first, the event sequence second.** The pointer gesture is what a person does, so it is what the test should do: it goes through the real input stack, and on Chromium it exercises the page exactly as a user would. Dispatching events skips the input stack, and a test that only ever dispatched them could pass against a page no human can drag. Considered dispatching events always, for one code path across browsers, rejected on that ground. Considered branching on `process.env.BROWSER`, rejected because the browser matrix would then be encoded in a page object, and because the question the fallback answers is not "which browser is this" but "did the server keep it".

**The fallback is chosen by the reloaded board, not by a caught error.** The failing gesture raises nothing: on Firefox it completes, and the card is visibly in the target column. The only thing that distinguishes it from a real move is that the server was never asked. So `moveCard` reloads and asks whether the card is under the target column; the fallback runs when the answer is no. This is also why the check cannot be an instant DOM read.

**The drag primitives take locators, not elements.** Every other `BaseComponent` method takes a `By` and resolves it under a root with a wait, and returning a `WebElement` to a page for it to drive by hand is the review blocker the framework is trying to close. `dragAndDrop` and `dispatchDragEvents` therefore take a source locator and a target locator and resolve both themselves. The cost is that the board has to hand the column's cards container as a locator, which is why `ProjectColumnFragment` exposes one rather than an element.

**`reload` waits for locators the caller names.** It mirrors `open`: the caller says what proves the screen is back. A reload that returned as soon as the navigation settled would hand the next read a half-rendered board.

**`waitUntil` takes a predicate and a message.** The persistence check is a poll over a condition, not over a locator, so no existing method fits. It is `protected`, because a scenario waiting on an arbitrary condition is a step doing page work.

**The scenario asserts both columns.** A card that appears in the target column proves half of a move. The issue count of the source column, the issue count of the target, and the id left behind in the default column are the other half, and they are the business-level assertions the trainer's review asked for over reading a single node off the DOM.

## Risks / Trade-offs

- **[Risk]** The gesture succeeds on Chromium, so the fallback path only ever runs on Firefox and could rot unnoticed. → **Mitigation**: the suite runs on all three browsers in the pipeline, so Firefox exercises it on every scheduled run.
- **[Risk]** A dispatched event sequence is not a user gesture, so a regression that breaks dragging for real users could still pass on Firefox. → **Mitigation**: Chromium runs the real gesture against the same scenario, so the user-visible behaviour is covered by the matrix as a whole, not by any one browser.
- **[Risk]** The fallback runs after a reload, so the elements resolved before the gesture are stale and must be resolved again. → **Mitigation**: both primitives take locators and resolve them at call time, which makes a stale reference unrepresentable.
- **[Risk]** The persistence poll reloads, so a genuinely failed move costs the full timeout before failing. → **Mitigation**: the timeout is declared at the call site, at 10 s, rather than inherited.
- **[Risk]** `dispatchDragEvents` encodes a sequence and its spacing that a future version of the drag library could stop answering. → **Mitigation**: it lives in one file in the core with the reason written down, and its failure is a named timeout on the persistence wait, not a silent pass.
