## Why

`@e2e` creates a repo but never adds a file to it. Building this out surfaced the real DOM behind two new page objects that only had `waitForElements()` stubs (`CreateRepoFileFragment`, `RepoFileFragment`), confirmed live:

- A repo created through the UI form (no auto-init) lands on an empty-repo view with a directly visible "New File" button - a repo created through the API with `auto_init: true` instead shows the regular file browser, where the same action collapses into a closed dropdown item. The two aren't interchangeable for locating this button.
- The filename input is plain, but the content field is a CodeMirror editor over a hidden `textarea` - typing has to go through the editor's own `.cm-content`, not the textarea. The commit button is disabled until the filename alone is filled.
- Committing redirects through a loader before the file-view page's elements exist; confirmed live the whole round trip can take several seconds under load, so `RepoFileFragment.waitForElements()` gets a wider budget.
- The org repo-creation form doesn't auto-init, so after adding one file the repo holds exactly that one file - `#repo-files-table .repo-file-item` is what counts them on the Code tab.

## What Changes

- `CreateRepoFileFragment` gains `fillFileName()` (waits for the commit button to enable), `fillFileContent()`, `clickCommitChangesButton()`.
- `RepoFileFragment` gains `getFileName()`/`getFileContent()`; its `waitForElements()` gets a 15s budget for the post-commit loader.
- `RepoCodeTabFragment` gains `clickNewFileButton()` and `getFilesCount()`. `RepoNavBarFragment` gains `navigateToTab()`.
- `"I create the following repositories:"` now adds one file (named and filled with the owner's own username) to each repo right after creating it, asserts the file's name and content, then asserts the Code tab's file count - reusing the same per-repo loop, no new Gherkin step.

## Impact

`business-logic/selenium/ui/pages/repositories/fragments/create-repo-file.fragment.ts`, `repo-file.fragment.ts`, `repo-code-tab.fragment.ts`, `repo-nav-bar.fragment.ts`; `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `features/step-definitions/organizations.steps.ts`.
