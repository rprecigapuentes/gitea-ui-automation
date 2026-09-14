## 1. Verify repository names and add a repo-only smoke scenario

- [x] 1.1 Add `getRepositoryNames()` to `OrgRepositoriesFragment` (container + children + `.item-title a.name`). Extend `"the repositories were created successfully"` to assert each created repository's name is present. Add an `@smoke` scenario: an existing organization, one repository created directly, no team. Verified: root `typecheck` clean, `eslint` clean, `--tags "@e2e"` (1 scenario, 13 steps passed), `--tags "@smoke"` (4 scenarios, 20 steps passed).
