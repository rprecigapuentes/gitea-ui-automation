## 1. Drop the dead trailing re-login from `@e2e`

- [x] 1.1 Remove the trailing `When I logout` / `And I login with valid credentials as "owner"` after `@e2e`'s final `Then` - teardown runs through the owner's API token, not the browser session, so nothing needed it. Verified: `--tags "@e2e"` clean across 3 full runs (63/63 steps each), `--tags "@smoke"` clean (40/40).
