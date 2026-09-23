# accessibility Specification

## Purpose

TBD - created by archiving change fix-accessibility-heatmap-noise. Update Purpose after archive.

## Requirements

### Requirement: A scan leaves out the regions the page under scan declares time-dependent

The page object that owns a page SHALL be able to declare the regions a scan leaves out, and the scan SHALL exclude them before analysing. A region qualifies when how much of it renders depends on when the scan ran rather than on the markup under test, so that a baseline records only violations that outlive the run that recorded them. The selectors SHALL come from the page object, never from the spec, the same way a visual check takes its masked regions.

#### Scenario: The page under scan declares no excluded region

- **WHEN** a scan runs against a page whose page object declares none
- **THEN** the whole page is analysed
- **AND** the baseline is unchanged

#### Scenario: The page under scan declares excluded regions

- **WHEN** a scan runs against a page whose page object declares them
- **THEN** no violation is reported for an element inside one
- **AND** the baseline holds only the violations found in the rest of the page

#### Scenario: An excluded region renders a different number of elements

- **WHEN** two scans of the same page run on days that render that region differently
- **THEN** both produce the same result
- **AND** neither rewrites the baseline
