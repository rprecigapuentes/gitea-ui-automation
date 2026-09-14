@organizations @cleanup
Feature: Organization
  As a Gitea user
  I want to change the team member's permissions
  So that the user can have the appropriate info access

  @e2e
  Scenario: Change team members permissions
    Given I login with valid credentials as "owner"
    When I navigate to the "Create Organization" page by "organization dropdown" menu
    And I create a new organization using:
      | name        | test-org |
      | visibility  | public   |
      | permissions | true     |
    Then I should see the organization created successfully
    When I navigate to the organization page
    And I create the following teams:
      | name     | visibility | repoCodeAccess | createRepo |
      | dev-team | private    | none           | true       |
      | qa-team  | private    | write          | true       |

  @smoke
  Scenario: Create Organization
    Given I login with valid credentials as "owner"
    When I navigate to the "Create Organization" page by "organization dropdown" menu
    And I create a new organization using:
      | name        | test-org |
      | visibility  | public   |
      | permissions | true     |
    Then I should see the organization created successfully

  @smoke
  Scenario: Create teams for an existing organization
    Given I login with valid credentials as "owner"
    And an organization already exists
    When I create the following teams:
      | name   | visibility | repoCodeAccess | createRepo |
      | team-1 | private    | none           | true       |
    Then the created team's page is displayed
