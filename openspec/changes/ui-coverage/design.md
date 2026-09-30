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
The crawler reads them from each element, then opens up to twenty dropdowns of the page, one at a
time, and reads them again, so the items of a menu that is closed on load are observed as visible.
An element's states are the union of what was seen.

A locator covers the states its call implies: an interaction covers `visible` and `enabled`, a reader
such as `isRadioSelected` covers both values of its dimension, anything else covers `visible`.

The crawl does not open modals, inline editors or menus that need a hover. Their elements are in the
inventory without `visible`, and count only when a step touches them.
