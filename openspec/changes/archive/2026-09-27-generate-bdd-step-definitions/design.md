## The constraint that shaped the configuration

`generator_write_test` does not inspect what it is given — it writes the agent's text verbatim, so
a step-definition file is acceptable content. What it does check is the path:

```js
for (const project of config.projects) {
  if (resolvedFile && isPathInside(project.project.testDir, resolvedFile)) {
    /* write */
  }
}
throw new Error(`Test file did not match any of the test dirs: ${dirs.join(", ")}`);
```

In this service the test directories are `.features-gen/<browser>`, written by `bddgen`, and
whatever the starting states use. `features/step-definitions/` is inside neither, so the generator
could not write a step definition at all.

Three ways out were available:

1. **Move the step definitions under a test directory.** Rejected: they would leave
   `features/step-definitions/`, where the Cucumber service keeps its own, and the two BDD suites
   are meant to read alike.
2. **Add a project that exists only to authorise the path**, collecting nothing. Rejected as a
   second project that never runs, whose purpose no reader could infer.
3. **Widen the starting states' project to the service root and bound it with `testMatch`.**
   Chosen. One project, it still collects exactly the two starting states, and the directory layout
   is untouched. The `testMatch` is what carries the meaning, and the comment says why.

## Why the starting states are not a BDD project

`defineBddProject` derives its tests from features. A starting state has no feature and must be
runnable before any scenario exists, so it is a plain Playwright project. `bddgen` was verified to
tolerate a project it did not generate.

It is listed first because the MCP server takes the first top-level project when an agent names
none, and it is named `seeds-chrome` because `resolveOwnerCredentials` reads the browser from the
segment after the project name's last dash.

## Why the compile step is a rule rather than a convenience

The runner executes `.features-gen/`, not the files anyone edits. The healer's tool list has no
shell, so it cannot regenerate: handed a stale build it diagnoses the previous version of the test,
and its repair is reasoning about code that is no longer there. That makes `bddgen` a precondition
of the repair step rather than a detail of the run, which is why it is written into the apply
stage and into the capability rather than only into a script.
