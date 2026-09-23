## Context

See proposal.md - Why. `gitea-smoke.spec.ts` and `login-api.spec.ts` are self-contained Playwright spec files under `services/playwright-native/tests/`: neither is imported by another spec, fixture, or page object, and CI runs the whole `tests/` directory rather than naming files individually.

## Goals / Non-Goals

**Goals:**

- Bring `playwright-native`'s functional test set back to a 1:1 match with the Selenium suites' scenarios.

**Non-Goals:**

- Deciding whether anonymous-landing-page, sign-up-form, or API-level login checks are worth having in either framework going forward — that is a separate coverage decision, not this change.
- Touching `non-functional/` (accessibility, visual), which intentionally covers a different axis than functional parity.

## Decisions

- **Delete outright rather than port to Selenium.** The alternative was adding matching Cucumber/Vitest scenarios so both sides keep the coverage. Rejected: neither test came from a Selenium scenario in the first place, and the request was specifically to make Playwright match Selenium's existing scope, not to grow Selenium's.
- **Verify with `typecheck` + `lint` + `format`, not a full Playwright run.** These are static, self-contained deletions with no other file referencing them (confirmed by grep before deleting), so a live run against the Gitea instance adds risk (state mutation, flakiness) without adding confidence. The repo's own pipeline gate for this kind of change is the static check set, per the archived `playwright-demo-e2e` precedent.
- **Leave `README.md` stale.** It documents both deleted files under "What's here" / "UI tests". Per this repo's standing convention (no docs unless asked), the README is left as-is; out of scope in proposal.md.

## Risks / Trade-offs

- [Losing incidental coverage the two deleted tests provided — anonymous landing page, sign-up form fields, API-driven session login] → Mitigation: none applied here by design; if this coverage turns out to matter, it should come back as an explicit, separately-proposed scenario on whichever side needs it, not as a reason to keep an unmatched test.
- [`README.md` now describes files that no longer exist] → Mitigation: flagged to the user in this change's summary; a follow-up doc change can fix it on request.
