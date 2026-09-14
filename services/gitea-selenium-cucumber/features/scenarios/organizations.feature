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
      | dev-team | private    | write          | true       |
      | qa-team  | private    | write          | true       |
    Then the created teams are displayed in Teams page
    When I add the following team members:
      | user | team     |
      | 1    | dev-team |
      | 1    | qa-team  |
      | 2    | qa-team  |
    Then the member count for each created team is correct
    And the avatars for each created team are correct
    When I navigate to the repositories tab
    And I create the following repositories:
      | name     | visibility |
      | frontend | true       |
      | backend  | true       |
    Then the repositories were created successfully
    When I add the following repositories to each team:
      | team     | repository |
      | dev-team | frontend   |
      | qa-team  | frontend   |
      | qa-team  | backend    |
    Then the repositories assigned to each team are correct

  @smoke
  Scenario: Create a repository for an existing organization
    Given I login with valid credentials as "owner"
    And an organization already exists
    When I navigate to the repositories tab
    And I create the following repositories:
      | name     | visibility |
      | frontend | true       |
    Then the repositories were created successfully

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

  @smoke
  Scenario: Add a user to a team
    Given I login with valid credentials as "owner"
    And an organization already exists
    When I create the following teams:
      | name   | visibility | repoCodeAccess | createRepo |
      | team-1 | private    | none           | true       |
    Then the created teams are displayed in Teams page
    When I add the following team members:
      | user | team   |
      | 1    | team-1 |
    Then the member count for each created team is correct
    And the avatars for each created team are correct
