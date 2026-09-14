## 1. Add the scenario

- [x] 1.1 Added `@smoke Scenario: Add a user to a team` to `organizations.feature`: login, `an organization already exists`, create one team, `the created teams are displayed in Teams page` (needed - without it, "I add the following team members:" tries to click the team's link while still on the just-created team's own detail page, not the list, and fails), add one seeded user, assert member count and avatars. Verified: `--tags "@smoke"` passed 3/3 (15 steps) twice, full `--tags "@organizations"` passed 4/4 (25 steps).
