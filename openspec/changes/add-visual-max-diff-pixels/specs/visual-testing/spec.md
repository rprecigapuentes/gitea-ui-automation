## Purpose

Defines how the Playwright suite checks a rendered Gitea page or component against a recorded screenshot, including what tolerance a check may allow before it is considered a mismatch.

## ADDED Requirements

### Requirement: Bounded pixel tolerance per check

A visual check SHALL accept an optional maximum number of differing pixels. When given, the check SHALL pass as long as the number of pixels that differ from the baseline does not exceed it. When omitted, the check SHALL require an exact match, as every existing check does today.

#### Scenario: A check tolerates a bounded number of differing pixels

- **WHEN** a spec calls a visual check with a maximum differing-pixel count and the rendered page differs from its baseline by fewer pixels than that count
- **THEN** the check passes

#### Scenario: Omitting the tolerance keeps exact-match behavior

- **WHEN** a spec calls a visual check without a maximum differing-pixel count and the rendered page differs from its baseline by even one pixel
- **THEN** the check fails, matching today's behavior
