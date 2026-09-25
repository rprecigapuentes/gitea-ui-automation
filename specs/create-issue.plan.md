# Create Issue in Gitea Repository - Test Plan

## Application Overview

This plan covers creating an issue in the Gitea repository `chrome-owner/agent-baseline` on a local Gitea instance (http://localhost:3000). It focuses exclusively on the issue-creation flow reachable at /chrome-owner/agent-baseline/issues/new: the happy path (title + description), the optional nature of the description field, client-side validation when the title is empty, and whitespace-only title handling. All tests start from a logged-out browser state and log in as the repository owner (chrome-owner) before navigating to the issue tracker. Each test creates its own issue(s) so scenarios remain independent and can run in any order; no test depends on issue numbers created by another test.

## Test Scenarios

### 1. Create Issue

**Seed:** ``

#### 1.1. Create an issue with a title and a description (happy path)

**File:** `tests/create-issue/happy-path.spec.ts`

**Steps:**

1. Navigate to http://localhost:3000/user/login - expect: The Sign In page loads with 'Username or Email Address' and 'Password' fields
2. Log in with the username and password read from the .env file at the repository root (GITEA_OWNER_CHROME / GITEA_OWNER_CHROME_PASSWORD), then submit the Sign In form - expect: Login succeeds and the user is redirected to the Dashboard, with the user's avatar visible in the top navigation bar
3. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new - expect: The 'New Issue' form loads, showing a 'Title' textbox, a 'Leave a comment' (description) textbox with Write/Preview tabs, and a 'Create Issue' button
4. Enter a unique, descriptive title (e.g. 'Happy path - title and description <timestamp>') into the Title field
5. Enter a non-empty description (e.g. 'This is a description created by an automated test.') into the description textbox
6. Click the 'Create Issue' button - expect: The browser navigates to the new issue's detail page at /chrome-owner/agent-baseline/issues/<n> - expect: The page title and the H1 heading show the entered issue title followed by '#<n>' - expect: The issue body/comment area displays the exact description text that was entered - expect: The issue status badge shows 'Open' - expect: The 'opened ... by chrome-owner' metadata line is present - expect: The repository's Issues tab counter increments by one
7. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues (the issue list) - expect: The newly created issue appears in the open issues list with the correct title and issue number, linking to its detail page

#### 1.2. Create an issue with a title only (description left empty)

**File:** `tests/create-issue/title-only.spec.ts`

**Steps:**

1. Log in as chrome-owner (per the .env credentials) via http://localhost:3000/user/login and navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new - expect: The 'New Issue' form loads
2. Enter a unique, descriptive title (e.g. 'Title only - no description <timestamp>') into the Title field and leave the description textbox empty
3. Click the 'Create Issue' button - expect: The issue is created successfully and the browser navigates to its detail page at /chrome-owner/agent-baseline/issues/<n>, confirming the description field is optional - expect: The H1 heading shows the entered title followed by '#<n>' - expect: No description/comment body text is rendered under the issue metadata (the initial comment area is empty) - expect: The issue status badge shows 'Open'

#### 1.3. Attempt to create an issue with an empty title is blocked by validation

**File:** `tests/create-issue/empty-title-validation.spec.ts`

**Steps:**

1. Log in as chrome-owner (per the .env credentials) via http://localhost:3000/user/login and navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new - expect: The 'New Issue' form loads with the Title field empty and focused
2. Without entering a title, optionally enter a description (e.g. 'Description without a title.') into the description textbox
3. Click the 'Create Issue' button - expect: The form is not submitted: the browser stays on /chrome-owner/agent-baseline/issues/new - expect: No new issue is created (the repository's Issues counter does not increment) - expect: The Title field is reported as invalid/required (native browser 'required' validation) and receives focus
4. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues and note the current open-issue count - expect: The open-issue count matches the state prior to the blocked submission attempt, confirming no issue was created from the empty-title attempt

#### 1.4. Attempt to create an issue with a whitespace-only title is blocked by validation

**File:** `tests/create-issue/whitespace-title-validation.spec.ts`

**Steps:**

1. Log in as chrome-owner (per the .env credentials) via http://localhost:3000/user/login and navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new - expect: The 'New Issue' form loads
2. Type only spaces (e.g. three space characters) into the Title field, then enter a valid description
3. Click the 'Create Issue' button - expect: The submission is rejected: either the browser stays on /chrome-owner/agent-baseline/issues/new with the Title field flagged invalid (client-side 'required' check treats whitespace as empty), or, if the browser allows submission, the server responds with a validation error and no issue is created - expect: No new issue with a blank/whitespace title appears in the issues list at /chrome-owner/agent-baseline/issues
