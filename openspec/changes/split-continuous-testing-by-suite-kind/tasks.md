## 1. Rename the functional workflow

- [x] 1.1 Rename `.gitea/workflows/ct.yml` to `ct-functional.yml` with `name: CT-functional`, keeping its trigger, its dispatch input and its two jobs unchanged; verify `git status` records a rename rather than a delete and an add.
- [x] 1.2 Point its concurrency group at the shared `ct` group with `cancel-in-progress: false`, and verify the comment says why a queued run is preferable to a cancelled one.

## 2. Carry the non-functional suites on one workflow

- [x] 2.1 Add `.gitea/workflows/ct-non-functional.yml` with `name: CT-non-functional`, the shared concurrency group, and the `accessibility` job moved from `accessibility.yml` unchanged; verify it runs the same script and publishes the same artifact name.
- [x] 2.2 Add the `visual` job from `visual.yml`, chained with `needs: accessibility` and `if: always()`, keeping its dispatch input, its baseline fingerprinting and both its artifacts; verify the input still reaches it.
- [x] 2.3 Add the `performance` job from `performance.yml`, chained with `needs: visual` and `if: always()`, last in the chain so nothing else occupies the runner while it measures; verify it keeps `trace: off` and takes no video.
- [x] 2.4 Delete `accessibility.yml`, `visual.yml` and `performance.yml`, and verify no workflow, script or README still names them.

## 3. Confirm it on the runner

- [x] 3.1 Add the temporary on-push trigger to both new workflows, push, and verify each starts.
- [ ] 3.2 Verify `CT-non-functional` runs its three jobs one after another, never two at once, and that each publishes its artifact under the name it published before.
- [ ] 3.3 Verify `CT-functional` publishes a `junit` file per browser and no recording on a green run, which is task 4.2 of `add-pipeline-failure-artifacts`.
- [ ] 3.4 Remove the temporary triggers in one commit, and verify that commit touches only the two workflows.

## 4. Document the two workflows

- [x] 4.1 Replace the CI/CD list in the root `README.md` with the three workflows that remain, saying what each publishes; verify the stale `visual.yml` description, which still claims two jobs and a push trigger, goes with it.
- [x] 4.2 Update `services/playwright-native/README.md` where it names the three removed workflows, and verify no README describes a workflow that no longer exists.
- [x] 4.3 Run the three gates, `npm run format`, `npm run lint` and `npm run typecheck`, and verify all three pass.
