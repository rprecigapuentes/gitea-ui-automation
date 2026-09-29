## Why

`fix-seeded-user-org-membership-leak` made `seededUsers`' teardown call
`OrganizationClient.getOrganizationsForUser` and `.removeMember` with the admin token, and it was
verified only against a local, unscoped admin token. The `playwright` job of `ct-functional.yml`
mints its admin token with `scopes: ["write:admin"]` alone, which does not cover either call:
`Change team members permissions` and `demo-e2e`, the two suites that use `seededUsers`, failed on
every browser with `TypeError: (intermediate value) is not iterable` — `getOrganizationsForUser`
resolving Gitea's 403 error body, an object, where the code expected an array to iterate.

## What Changes

- The `playwright` job's admin token in `ct-functional.yml` gains `read:user` and
  `write:organization`, alongside its existing `write:admin`. Reproduced directly against the same
  Gitea version the job runs (1.27.3): `write:admin` alone gives 403 on
  `GET /users/{username}/orgs`; Gitea does not accept `read:organization` in its place, only
  `read:user`; `write:organization` covers the membership removal.
- The `selenium` job's admin token is untouched: neither `gitea-selenium-vitest` nor
  `gitea-selenium-cucumber` calls either method.

## Capabilities

No requirement text changes — a token-provisioning correction the pipeline capability already
requires ("a job provisions every Gitea account and API token its suite needs, at the privilege
that suite needs"). `skip_specs: true`.

## Impact

`.gitea/workflows/ct-functional.yml`.
