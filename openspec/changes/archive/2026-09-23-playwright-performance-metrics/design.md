# Design

## Context

The suite already carries two non-functional areas, and this is the third to reuse their project layout. What is new is that a measurement has no stable answer: an accessibility scan and a screenshot return the same result on an unchanged page, and a timing does not. Every decision below follows from that. See proposal.md for the motivation.

Two properties of the existing suite shape the approach. `sessionManager.loginAsOwner` establishes the session through the API and then navigates to the base URL, so a navigation has already happened by the time a spec begins. And a test reaches the browser only through a page object, which `openspec/config.yaml` states for non-functional suites too: a collector is handed the page, the navigation around it is not.

## Goals / Non-Goals

**Goals:**

- A figure a second run can be compared against, rather than a figure that only describes one run.
- An explanation beside every number, so a regression can be investigated from the artifact alone.
- The same project, account and workflow shape the other two non-functional areas use.

**Non-Goals:**

- A verdict on whether Gitea is fast. The baseline says what this runner measured, not what is acceptable.
- Measuring anything that is not a page load. Interaction timing would reach into the page objects.
- Gating a merge. The suite is dispatched, like the other two.

## Decisions

### What decides the outcome

A timing differs on every run, so the accessibility fingerprint has no counterpart here and the question has to be answered again.

| Option                        | A measurement fails when                   | Cost                                                                                            |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Evidence only, no assertion   | Never                                      | Nothing is learned from the second run                                                          |
| Fixed threshold, hand-written | The figure exceeds a number someone chose  | The number is an opinion about Gitea, which the framework has no standing to hold               |
| Exact recorded value          | The figure differs from the baseline       | Fails on every run: no two loads agree                                                          |
| Recorded tolerance band       | The figure leaves the band recorded for it | A band has to be recorded per metric and re-approved when the application or the runner changes |

The tolerance band is chosen. It keeps the suite capable of failing, which evidence-only does not, and it fails on a change rather than on an opinion, which a hand-written threshold does not. The band is recorded from the same repeated loads the run publishes, so it describes the machine it was recorded on.

### Why a page is loaded more than once

A single load on a shared runner varies by more than the regressions worth catching, so a one-load baseline fails on noise and a one-load result proves nothing. The run loads each page several times and publishes the median with the spread. The median rather than the mean, because one long load pulls a mean out of shape and this is exactly the machine that produces one. The spread is published rather than discarded: it is what tells a reader whether the band is meaningful.

### Why the measurement is read after the page object opens the page

`applySession` ends by navigating to the base URL, so the navigation entry present when a spec starts describes the dashboard, not the page under measurement. Reading it there would publish the same figure for every signed-in page and never fail. The collector is therefore called after the page object's own `open`, which also waits for that view's ready locators, so the point of reading is the point the framework already treats as the page being ready. Paint entries are per document and reset on that navigation, which makes the ordering a correctness requirement rather than a preference.

### Why Chromium alone

The engine counters come from a protocol only Chromium speaks, so a cross-browser project would publish a different set of metrics per browser and nothing comparable between them. The area runs one project. Its name ends in `chromium`, which the existing credential resolution maps to the Chrome account the workflows already seed, so the decision costs no new account.

The cross-browser question this forecloses is real but is not the question the issue asks: comparing engines needs the same metric on each, which is the navigation timings alone, and that comparison can be added later as a second project without changing anything here.

### Why the network exchange is recorded as well as measured

The resource entries carry weight and timing but no status and no headers, so a redirect chain, a missing asset and a response served without compression are all invisible in them. Recording the exchange answers those, and is what makes the artifact readable as a waterfall by someone who did not run it. Response bodies are dropped: they multiply the artifact by the size of the application's own bundles and answer nothing about its speed.

### Why no retry, no trace and one worker

Each of the three would change what is being measured. A retry republishes a warm run as if it were the recorded one. A trace charges the page for the collector's own overhead. A second worker puts a browser beside the one under measurement on the same machine. The other two areas set no retries for unrelated reasons; here it is a correctness setting.

## Risks / Trade-offs

- **A band recorded on a workstation does not hold on the runner, and the reverse** → the band is recorded where it will be checked, and a run that finds no band records one rather than passing. The visual area met the same problem with baselines per platform; this area avoids it by only trusting bands recorded by the workflow.
- **The runner's own variance widens the bands until they catch nothing** → the spread is published beside every figure, so a band that has gone useless is visible as such rather than silently passing. If it does, the honest answer is a wider repeat count, not a narrower band.
- **The engine counters reset on every navigation, rather than accumulating as first assumed** → measured on the login page before the collector depended on it: two loads of the same page reported 0.069 and 0.045 seconds of script rather than the second adding to the first. The counter read after a navigation therefore describes that document on its own, and taking a difference across the navigation yields noise around zero, negative as often as not. They are also reported in seconds while every timing beside them is in milliseconds, so they are converted where they are read.
- **The largest-contentful-paint entry is delivered over the life of the document rather than read at the end** → it is subscribed to with the buffered flag rather than polled, and a page that never reports one publishes the rest without it.
- **Overriding the context options to give each test its own recording is a typing question that has no precedent in this repository** → it is verified by the typecheck the pipeline runs before anything depends on it, and the fallback is a literal path declared per spec file.
- **The suite measures a Gitea that shares its machine with the runner** → the figures describe that arrangement and no other, which is why the baseline is a band recorded there and never a claim about the application.
