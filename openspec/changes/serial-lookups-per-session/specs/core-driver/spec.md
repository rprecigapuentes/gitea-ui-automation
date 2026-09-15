## ADDED Requirements

### Requirement: The base component resolves locators one at a time per session

The base component SHALL send at most one element lookup at a time to a given browser session, whatever concurrency the components built on it express. A lookup issued while another is in flight on the same session SHALL wait for it, and SHALL then run unchanged. The wait that surrounds a lookup MUST NOT hold the session while it sleeps between polls, so that concurrent waits on one session still interleave.

#### Scenario: Two components ask for elements at the same moment

- **WHEN** two lookups are issued on the same session without waiting for each other
- **THEN** the session receives the second only after it has answered the first
- **AND** each lookup returns the result of its own locator

#### Scenario: Two waits poll the same session

- **WHEN** two waits are polling the same session at the same time
- **THEN** their polls alternate on the session
- **AND** neither wait's timeout is extended by the other's sleep between polls

#### Scenario: A lookup fails while another is queued behind it

- **WHEN** a lookup raises and another is waiting behind it on the same session
- **THEN** the failure reaches only the caller of the lookup that raised
- **AND** the queued lookup runs next
