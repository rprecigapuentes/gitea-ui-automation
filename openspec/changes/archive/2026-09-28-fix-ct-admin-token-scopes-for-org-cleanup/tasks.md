# Tasks

## 1. Reproduce the CI failure against the same Gitea version

- [x] 1.1 Mint a local token scoped `["write:admin"]` only, against a local Gitea 1.27.3 (matching
      `ct-functional.yml`'s `gitea-test` image), and call `GET /users/{username}/orgs` with it.
      Verify it returns 403, matching the CI stack trace exactly (the code iterates the response
      directly without checking status, so a 403 body throws "is not iterable").

403, `required=[read:user read:organization]`.

- [x] 1.2 Mint a token adding `write:organization` alone and retry. Verify it still 403s — Gitea does
      not treat `write:organization` as implying `read:organization` here, and silently drops a
      `read:organization` scope from the mint request as redundant, so requesting it is a no-op.
      Mint a token with `read:user` instead and verify `GET /users/{username}/orgs` then succeeds.

Confirmed both: `write:organization` alone still 403s; `read:user` added succeeds (200).

## 2. Fix the workflow

- [x] 2.1 Add `read:user` and `write:organization` to the `playwright` job's admin token scopes in
      `ct-functional.yml`. Leave the `selenium` job's untouched.

## 3. Prove it

- [x] 3.1 Mint a token with exactly `["write:admin", "read:user", "write:organization"]` — what the
      fixed workflow now requests — and run the full `playwright-native` suite on chrome and the
      full `playwright-bdd` suite on chrome and edge with `GITEA_ADMIN_TOKEN` overridden to it.
      Verify none of the "not iterable" failures recur.

16/16 on `playwright-native` chrome; 9/9 on `playwright-bdd` chrome and edge. Firefox hit two
unrelated UI timeouts on the same run (a `isCodeTabVisible` wait and a locator wait, in different
steps each attempt) — after the extensive testing this session put through the local instance, not
the error this change fixes, and not reproduced against the scope itself: chrome and edge, run
back to back with the same token, both green.
