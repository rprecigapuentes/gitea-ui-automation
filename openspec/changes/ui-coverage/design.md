# Design

## Denominator and numerator come from different places

```
Gitea --crawl--> ui-inventory.json ----\
                                        match --> coverage report
page objects + steps --parse--> usage -/
```

The crawler says what exists, the parser says what the suite exercises, and the matcher joins them.
Nothing in the page objects knows about coverage.

## The three units

- **URL**: the pathname reduced to a route template, so `/alice/app/issues/4` and
  `/bob/lib/issues/9` are the one URL `/{owner}/{repo}/issues/{n}`.
- **Element**: an interactive element of a URL, keyed by its role and accessible name.
- **State**: a value of a property observed on an element, such as `visible`, `enabled` or `checked`.

## How the two sides meet

Every locator in a page object is a CSS string. The crawler stores the DOM of each URL it visits, and
the matcher runs each used locator against that DOM. The elements it selects are the covered ones. No
name is compared with another name.

A locator is used only when a step of `playwright-bdd` reaches it: step, then `pageObjects.<getter>`,
then the class `PageFactory` returns, then the methods it calls and the locators those read.

A state counts as covered only when the method that reads the locator implies it: `isVisible`,
`isChecked`, `isDisabled`. When in doubt it does not count.

## Limits

The figure is a floor of a floor. The denominator holds only what the crawler reached, so the ratio
is relative to that and not to Gitea as a whole.

The crawler does not reach:

- states that need particular data or permissions, unless the crawl seeds them
- multi-step wizards, hover-only or timed interface
- the site administration, unless the crawl signs in as an administrator
- anything behind a destructive action, which the crawler avoids on purpose
- navigation done by script rather than by a link

A different Gitea version changes the inventory, which is why the version is recorded in it.

Read the figure as a trend over one inventory, not as a share of the application.

## Framework versus application

`openspec/specs/` describes the automation framework. It says nothing about which pages, elements or
states Gitea has, so it cannot be the denominator of a coverage of Gitea's UI. The denominator is the
crawled UI.

## What the first measurement showed

- The crawl signs in as the owner of the run, creates a repository with an issue, and an organization
  with a project, crawls, and deletes all of it in a `finally`. It follows only links that belong to
  that data, so what other runs left behind cannot change the inventory.
- A locator counts only when a step reaches the method that reads it. Values the parser cannot
  resolve (a selector built from an argument) are not counted, and a fragment returned by one call
  and used by the next is not followed. Both make the figure smaller, never larger.
- A fragment has no URL of its own, so its locators run against every URL a step reaches.
- A selector counts every interactive element it selects. A generic one such as `.item` selects many,
  so the element figure can be higher than the number of elements a test looks at on purpose.
- The DOM of each URL is kept in `coverage-data/pages/`, which is regenerated and not committed.

## States

A state is one of `visible`, `enabled`, `disabled`, `checked`, `unchecked`, `expanded`, `collapsed`.
The crawler reads them from each element, then shows every drop-down menu and every `details` of the
page by style, without clicking, and reads them again, so the items of a menu that is closed on load are
observed as visible. Clicking to open them was tried first and made the inventory depend on animation
times, so two crawls differed.
An element's states are the union of what was seen.

A locator covers the states its call implies: an interaction covers `visible` and `enabled`, a reader
such as `isRadioSelected` covers both values of its dimension, anything else covers `visible`.

The crawl does not open modals, inline editors or menus that need a hover. Their elements are in the
inventory without `visible`, and count only when a step touches them.

## Checking that the figure moves by what it should

A step that calls `createProjectPage.openFor` was added and then removed. The element figure rose by
56: one element that the two locators of that method select, and 55 that the fragment locators select
on the page that became reached. Both numbers were counted independently against the stored page.
Reaching a new page therefore raises the figure through the fragments as well, which is what the rule
"a fragment applies to every URL a step reaches" says.

## In the pipeline

The measurement runs in the Playwright job of `ct-functional.yml`, for the BDD suite, after the
suite whether it passed or not: the numerator is read from the code and does not depend on the
outcome. It crawls the run's own gitea-test, so the inventory it produces belongs to a fresh
instance. The step does not fail the run, and it uploads the inventory and the report. Promoting an
uploaded inventory to the committed one is a decision taken in a pull request.

## Which tests cover an element

Each step definition is read on its own, together with the helper functions of its file that it
calls, so every locator is known to be reached by that step. Each feature is parsed, its Background
steps are added to every scenario, and each step text is matched to a definition with the Cucumber
expression that definition declares. An element is covered by the scenarios whose steps reach a
locator that selects it. A step text that no definition matches, such as an outline placeholder, is
not attributed to any scenario, so a scenario can be missing from the list but never wrongly in it.

The report is also written as `coverage.html`, with the figures, the pages and the inventory of
elements, each marked as covered or not and listing its scenarios.

## Actions

A fourth level counts what can be done with an element. The possible actions are not observed; they
are inferred from the role of the element, by a table in `actions.mjs`:

| Element                             | Actions     |
| ----------------------------------- | ----------- |
| link, button, menu item, tab, other | click       |
| drop-down menu                      | open        |
| text field                          | fill, clear |
| checkbox                            | toggle      |
| radio, selection list               | choose      |

The performed actions come from the method that reads the locator: a `click*` method performs click,
open, toggle and choose, `type*` performs fill, and `clearAndType` performs fill and clear. Reads such
as `getText` or `isVisible` perform none, so an element that a step only looks at is covered but has no
action covered.

A drop-down menu (`.ui.dropdown`) is an element of its own, so opening one is counted. A locator that a
step builds from an argument is not resolved, which leaves part of the drop-down use of the suite out of
the figure.

The inventory is not everything that can be done in Gitea, which is a universe too large to list. It is
what can be inferred from the pages the crawler reached: their elements, the states seen on them and
the actions their type allows. Dragging, hovering and keyboard shortcuts are not in the table, and the
report says so.

## A stable inventory

The elements of a URL are written sorted by key, because the order of a list on the page can follow
the time of the data, and the position of an element on the page is kept apart, next to the stored
page, so that a selector that matches it can be traced back to its key. The names of drop-down menus
are left out of the key, since they carry the name of whatever the menu currently shows. The page is
given half a second to settle before it is read. Three crawls in a row gave the same inventory.

## Selectors that a run completes

Some page objects build a selector from a value that only the run has: a prefix given to the
constructor, or the value of an attribute passed to a function. The parser reads the selectors that a
constructor assigns and the functions that return one, and leaves the unknown value open in two
places only: a whole attribute value (`[data-value="${value}"]` becomes `[data-value]`) and a leading
ancestor (`${root} .menu` becomes `.menu`). A selector with anything else left open, such as part of an
attribute value, is still dropped, because opening it would select far more than the test does.

The selectors that result are wider than the ones a run uses, so the figure can rise above what a
test looks at on purpose. Nothing in the page objects changes: they are read and never written.

A click on an element inside a drop-down menu also counts as opening that menu, since the element
cannot be reached otherwise.
