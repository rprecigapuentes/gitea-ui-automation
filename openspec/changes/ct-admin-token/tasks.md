## 1. Provision the administrative identity in CT

- [x] 1.1 In `ct.yml`'s "Register the owner and invited accounts" step, call the existing `register()` helper for a `ct-admin` account ahead of the `for b in CHROME FIREFOX EDGE` loop, and rename the step to say it also registers the administrator. Verify by dispatching CT with `suite=gitea-selenium-cucumber` and reading `account ct-admin is usable` in the step log, printed before the first `account chrome-owner is usable`.
- [x] 1.2 Mint `ct-admin` a token scoped `["write:admin"]` over `POST /api/v1/users/ct-admin/tokens`, `::add-mask::` it, and append `GITEA_ADMIN_TOKEN=` to `$GITHUB_ENV`, following the shape of the existing per-browser mint. Verify in the same dispatch that the step log shows `::set-env:: GITEA_ADMIN_TOKEN=***` with the value masked, and that the three `GITEA_TOKEN_<BROWSER>` exports still appear with their scopes unchanged.
- [x] 1.3 Guard the minted token: call `GET /api/v1/admin/users?limit=1` with it and `exit 1` naming `ct-admin` and `write:admin` when the call is refused, so a job that cannot provision an administrator stops before the suite starts. Verify by temporarily pointing the probe at a browser owner's token in a scratch dispatch, confirming the job fails at this step with that message, then reverting to `ct-admin`.

## 2. Close the documentation gap that caused the bug

- [x] 2.1 Add `GITEA_ADMIN_TOKEN` to `services/gitea-selenium-cucumber/README.md` and to its `.env.example`, stating that it belongs to a Gitea administrator, needs the `write:admin` scope, and that without it every run dies in `BeforeAll`. Verify by reading the section back and confirming it names the variable `credentials.ts` actually reads.

## 3. Confirm the fix end to end

- [x] 3.1 Verified from run #280 onward: the step logs `account ct-admin is usable` before the browser accounts and `admin token minted for ct-admin`, the token is masked, and Cucumber reaches its scenarios instead of dying in `BeforeAll`. The privilege probe has never fired, so Gitea's first-registered-user rule holds on 1.27.3.
- [x] 3.2 Verified on #306: both suites ran, both published their own Allure report, and the run succeeded. `npm run format`, `npm run lint` and `npm run typecheck` are clean.
- [x] 3.3 Removed. The block is back to plus .
