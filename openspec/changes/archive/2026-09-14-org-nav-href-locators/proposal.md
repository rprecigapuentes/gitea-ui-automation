## Why

The org nav tabs were located with `overflow-menu[role='navigation'] a:has([data-text='Teams'])`, the exact locator behind the session's recurring "Teams tab" timeouts. Testing an href-based alternative instead.

## What Changes

- `OrgNavigationFragment` derives the current org's name from the browser's own URL (`BaseComponent.getCurrentUrl()`, new) and builds each tab's locator from its real href (`/{org}`, `/{org}/-/projects`, `/org/{org}/members`, etc.), confirmed live, instead of matching on `data-text`.
- Still scoped to `overflow-menu[role='navigation']` - dropping that scope let the Repositories tab's href collide with another link sharing the same href elsewhere on the page (confirmed live: caused a silent `isVisible` false via `findElement`'s "expected exactly 1" catch).
- Public API unchanged - no call site outside this file needed to change.

## Impact

`core/selenium/ui/base-pages/base-component.ts`; `business-logic/selenium/ui/pages/organizations/fragments/org-navigation.fragment.ts`.
