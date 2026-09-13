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
    # And I create the following teams:
    #   | name   | name  | description        | visibility | repoAccess | createRepo | permissions |
    #   | team-1 | admin | Team 1 description | public     | read       | true       | admin       |
    #   | team-2 | write | Team 2 description | public     | write      | true       | write       |
    

  @smoke
  Scenario: Create Organization
    Given I login with valid credentials as "owner"
    When I navigate to the "Create Organization" page by "organization dropdown" menu
    And I create a new organization using:
      | name        | test-org |
      | visibility  | public   |
      | permissions | true     |
    Then I should see the organization created successfully
