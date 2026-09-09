# @gitea-automation/core-data-handler

Naming helpers for test data created by the suites — 100% generic, no Gitea or Selenium knowledge. Renamed from `core/utils` to something that says what it's for.

## Structure

```
core/data-handler/
└── data-handler.util.ts   # testDataName(testCaseId, object, at) -> "AT-<caseId>-<object>-<date>-<time>-<browser>-<suffix>"; uniqueSuffix()
```

`testDataName` is the naming convention used across this monorepo for any Gitea resource a test creates (repos, labels, milestones, organizations, ...), so cleanup and debugging can trace a resource back to the test case that made it. `uniqueSuffix()` keeps names unique under concurrent runs.

## Imports

```ts
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
```
