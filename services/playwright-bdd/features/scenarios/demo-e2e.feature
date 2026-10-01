@demo-e2e @cleanup
Feature: Organization work item lifecycle
  As an organization owner
  I want the work of my repositories to be assignable, tracked on a board and closable
  So that the state of an item is the same wherever the organization looks at it

  @e2e @skip
  Scenario: A work item travels from the team that may be assigned it to the board that tracks it
    Given the seeded organization has two repositories with one issue each
    And I am logged in as the organization owner
    And the seeded organization is open

    When I create the following teams:
      | name    | visibility | repoCodeAccess | createRepo |
      | qa-team | private    | write          | false      |
    Then the created teams are displayed in Teams page
    And the team "qa-team" has no members yet

    When I add the first seeded repository to the team "qa-team"
    And I open the new issue form of the first seeded repository
    Then the assignee list does not offer user 1

    Given the teams page of the organization is open
    When I add the following team members:
      | user | team    |
      | 1    | qa-team |
    Then the member count for each created team is correct
    And the avatars for each created team are correct

    When I open the new issue form of the first seeded repository
    Then the assignee list offers user 1
    And the assignee list does not offer user 2

    When I create the scoped label "priority/high" in the first seeded repository
    And I open the new issue form of the first seeded repository
    And I fill the issue "Demo work item" with a description
    Then the description preview renders the heading "Demo work item"

    When I select the label, the milestone and user 1 as assignee
    And I submit the issue
    Then the created issue carries the label, the milestone and user 1 as assignee

    When I filter the issue list of the first seeded repository by the label
    Then the issue list shows only the created issue

    Given a project created from the Basic Kanban template
    And the seeded issues of both repositories are in the default column
    And the created issue is in the default column
    When I open the project board
    Then the board shows the columns Backlog, To Do, In Progress and Done
    And the default column is "Backlog"
    And the default column counts 3 issues
    And the column "In Progress" counts 0 issues

    When I add the column "Review" to the board
    And I open the project board
    Then the board shows the column "Review"

    When I drag the first seeded issue onto the column "In Progress"
    And I drag the second seeded issue onto the column "Review"
    Then the column "In Progress" holds only the first seeded issue
    And the column "Review" holds only the second seeded issue
    And the default column counts 1 issue

    When I delete the column "Review"
    And I open the project board
    Then the board does not show the column "Review"
    And the default column holds the second seeded issue
    And the default column counts 2 issues

    When I close the created issue
    Then the created issue is "Closed"
    And the milestone counts 0 open and 1 closed issues at 100% complete
    When I open the project board
    Then the default column counts 2 issues
    And the column "Done" counts 0 issues

    When I reopen the created issue
    Then the created issue is "Open"
    And the milestone counts 1 open and 0 closed issues at 0% complete

    When I logout
    And I login with valid credentials as user 1
    And the seeded organization is open
    Then the organization page does not offer the owner actions
    And the teams page does not offer to add a member to "qa-team"
    And the created issue carries user 1 as assignee
