## Context

See proposal.md - Why. Three facts of this setup shape everything below.

The runner denies jobs the Docker socket, so the application under test is a `services:` block the runner starts around the job, never a `docker compose` inside it. `services:` is per job: a second job gets its own `gitea-test`, not a share of the first one's.

Gitea Actions supports only `always()` among the expression functions, so conditional logic stays on plain comparisons and on separate jobs rather than one job full of guards.

`services/playwright-native` already runs: `playwright.config.ts` declares `chrome`, `firefox` and `edge` projects and the workspace exposes `test`, `test:chrome`, `test:firefox` and `test:edge`. Neither branded project sets a `channel`, so `chrome` and `edge` are the same bundled Chromium today.

## Goals / Non-Goals

**Goals:**

- The Playwright suite runs on the schedule the Selenium suites already run on, publishing its own Allure artifact whatever the Selenium suites did.
- Each of the three projects drives the browser it is named after, so a green run per browser means what the reader assumes.
- The second job is the extension point: `playwright-bdd` joins its matrix by growing a `test` script, with no other edit to the workflow.

**Non-Goals:**

- Sharing one `gitea-test` between the two jobs. It is not expressible, and a shared instance would break the seeding both suites depend on, starting with Gitea making the first registered user an administrator.
- Extracting the account-seeding block into a composite action. The Playwright job needs no account, so there is still only one copy.

## Decisions

**The Playwright job runs in `mcr.microsoft.com/playwright:v1.63.0-noble`, not on the default image with `playwright install --with-deps`.** The runner's image carries no browsers and no system libraries for them, and the cache action is unusable here because it builds its URL from an address jobs cannot reach, so a per-run install would download roughly 500 MB every night with nothing to cache it against. A spike measured the image at 956 MB, pulled once and then cached on the host. The alternative of a `playwright run-server` service was rejected: it pulls the same image into a service container and adds a connection layer that buys nothing when the job can hold the browsers itself.

**The tag is pinned to the `@playwright/test` version in `package-lock.json` and bumped by hand.** A tag that drifts from the lockfile is not a warning, it is an unrunnable browser. The image and the lockfile move together, in one commit.

**Chrome and Edge are the real products, installed with `npx playwright install chrome msedge` and selected with `channel`.** The browser matrix claims three browsers; without a channel two of them are one Chromium and a green run per browser overstates what was covered. The spike confirmed both install on this image and launch: Chrome 153.0.8010.47, Edge 153.0.4234.32, alongside the bundled Firefox 155.0. This reverses the reasoning currently written in `services/playwright-native/README.md`, which argued a channel was not viable on CI because the real browser might be absent; the official image plus one install step removes that objection, and the README is corrected in the same change.

**`actions/setup-node` runs inside the container.** The image ships Node 24.20.0 and the repo declares `engines.node: ">=22 <23"` with `.nvmrc` at 22. There is no `.npmrc`, so `engine-strict` is off and `npm ci` would install quietly on the wrong major. Installing Node from `.nvmrc` over the image's own keeps the lockfile honest.

**Two jobs, each with its own matrix, rather than one matrix with per-leg conditions.** `services:` cannot be made conditional, so a single matrix would start Selenium for a leg that never uses it, and a job-level `container:` would apply to the Selenium legs too. Three jobs, one per workspace, were rejected in the other direction: the two Selenium suites are the same job under two names, and splitting them would give the fragile account-seeding block a third copy to drift from.

**The Playwright job declares `needs: selenium` with `if: always()`.** There is one VPS, which is why the existing matrix carries `max-parallel: 1`; two top-level jobs would run concurrently and contend for it. `always()` keeps the Playwright job independent of the Selenium result, which is what "one suite's outcome does not decide another's" requires. It is also the documented way to survive a skipped dependency when a manual dispatch selects only one suite.

**The smoke asserts rendered pages and never logs in.** `core/playwright` and `business-logic/playwright` are empty, so a login smoke would put selectors directly in the service, which is the same layering violation the Selenium side treats as a review blocker. Asserting that the deployed Gitea serves its landing and sign-up pages already proves what the job exists to prove: the application under test came up and Playwright drove a real browser against it.

**Allure, not Playwright's built-in HTML reporter.** Both satisfy the requirement to publish a report, but the two Selenium suites already generate Allure 3 through `allure` and `allurerc.js`, and a third report format would mean a reader learns two tools to read one nightly run.

## Risks / Trade-offs

- **The image tag and the lockfile drift apart on a dependency bump.** → They live in two files, so nothing enforces it. The tasks put the bump and the tag in one commit, and a mismatch fails loudly on the first browser launch rather than silently.
- **Installing Chrome and Edge costs a download on every run** (193 MB for Edge alone in the spike, plus Chrome) because the `apt-get` lands in the container's ephemeral layer. → Accepted for a nightly run. If it proves slow on the VPS, the fallback is a small image built once from the official one with both browsers baked in.
- **`container:` on a job is less exercised on act_runner than `services:` is.** Service hostnames resolve because the job already runs in a container on the services network, but that is inference, not a measurement here. → The temporary push trigger on this branch verifies it before the schedule ever depends on it.
- **A second job lengthens the nightly run** by the Playwright job's wall clock, since the two are chained. → Deliberate: contention on a single VPS costs more than sequence does.

## Migration Plan

The suite changes land before the workflow changes, so no commit leaves a job pointing at a configuration that does not exist yet. The temporary push trigger from `ct-drop-healenium` stays on the branch until a run is green on all three browsers, then goes in the commit that closes both changes. Rollback is dropping the `playwright` job: nothing in the Selenium job depends on it.

## Open Questions

- How long `npx playwright install chrome msedge` takes on the VPS, as opposed to the spike's host. It changes only whether a pre-baked image is worth building later, not the approach or the specs.
