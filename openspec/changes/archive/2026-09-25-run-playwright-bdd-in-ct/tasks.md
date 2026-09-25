## 1. Concurrent browsers

- [x] 1.1 Make `playwright-bdd`'s `test` script run the three browsers as concurrent processes, and check it with `CI=1`

## 2. Pipeline

- [x] 2.1 Add `playwright-bdd` to the dispatch options and to the Playwright job's condition and dispatch-driven matrix
- [x] 2.2 Name the suite in the steps that run, report and upload it

## 3. Wrap up

- [x] 3.1 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 3.2 Archive the change
