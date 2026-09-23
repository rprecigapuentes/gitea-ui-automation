## MODIFIED Requirements

### Requirement: The visual workflow compares against committed baselines and lets a person record new ones by hand

The visual workflow SHALL run in one job that compares the suite against the committed baselines by default. A dispatch, or a commit that asks for it, SHALL make it record every baseline instead of comparing. Whatever the run recorded SHALL be uploaded as an artifact for a person to download and commit; nothing is committed by the workflow itself. When the run compares (it was not asked to record) and a baseline was auto-created because it was missing, the job SHALL fail and name the baseline(s) that were created, even though the individual check that created it reports as passed, so a missing baseline cannot pass unnoticed.

#### Scenario: A normal run

- **WHEN** the workflow runs without asking to record baselines
- **THEN** the job compares the suite against the committed baselines and publishes its report

#### Scenario: A person asks to record baselines

- **WHEN** the workflow is dispatched to record baselines, or a commit asks for it
- **THEN** the job records every baseline instead of comparing
- **AND** the recorded baselines are uploaded as an artifact for a person to commit

#### Scenario: A baseline is missing during a comparing run

- **WHEN** the workflow compares (it was not asked to record) and a view has no committed baseline
- **THEN** the job fails
- **AND** the failure names the baseline that was auto-created
- **AND** the recorded baseline is still uploaded as an artifact for a person to commit
