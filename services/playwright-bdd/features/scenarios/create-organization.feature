@organization
Feature: Create an organization and add members
  As an organization owner
  I want to create teams in my organization and add members to them
  So that each member has the access their team gives

  Scenario: An owner creates an organization with two teams and adds a member to one
    Given I am signed in as the owner
    When I open the main page
    Then the main page shows the owner as the current account

    When I open the create organization form from the organizations menu
    Then the create organization form has its default state
    When I create a private organization
    Then the dashboard of the created organization is shown

    When I open the created organization
    Then the organization has the owner as its only member and no repositories
    And the browser is on the created organization

    When I open the Teams tab of the organization
    Then the Teams tab is selected
    And the Teams tab lists these teams:
      | team   | members |
      | Owners | 1       |
    And the owner is the only member of the team "Owners"

    When I open the new team form
    Then the Teams tab is selected
    And the new team form has its default state
    When I create the private team "team-1" that can create repositories
    Then the Teams tab is selected
    And the Teams tab counts 2
    And the page of the team "team-1" shows a private team without members or repositories

    When I return to the Teams tab
    Then the Teams tab is selected
    And the Teams tab counts 2
    And the Teams tab lists these teams:
      | team   | members |
      | Owners | 1       |
      | team-1 | 0       |
    And the team "team-1" offers to add a member

    When I open the new team form
    Then the new team form has its default state
    When I create the private team "team-2" that can create repositories
    Then the Teams tab counts 3
    And the page of the team "team-2" shows a private team without members or repositories

    When I return to the Teams tab
    Then the Teams tab is selected
    And the Teams tab counts 3
    And the Teams tab lists these teams:
      | team   | members |
      | Owners | 1       |
      | team-1 | 0       |
      | team-2 | 0       |
    And the team "team-1" offers to add a member
    And the team "team-2" offers to add a member

    When I open the team "team-1"
    Then the Teams tab is selected
    And the Teams tab counts 3
    And the page of the team "team-1" shows a private team without members or repositories

    When I search for users by the first 2 characters of the invited user's name
    Then the search lists only matching users, including the invited user
    When I select the invited user
    Then the invited user is selected
    When I add the selected user to the team
    Then the page of the team "team-1" lists the invited user as its only member
    And the Members tab counts 2

    When I return to the Teams tab
    Then the Teams tab is selected
    And the Teams tab counts 3
    And the Teams tab lists these teams:
      | team   | members |
      | Owners | 1       |
      | team-1 | 1       |
      | team-2 | 0       |
    And the team "team-1" shows the invited user's avatar and no longer offers to add a member
    And the team "team-2" offers to add a member

    When I open the team "team-1"
    Then the page of the team "team-1" offers to remove the invited user
    When I ask to remove the invited user from the team
    Then the removal confirmation is shown
    When I confirm the removal
    Then the removal confirmation is closed
    And the page of the team "team-1" shows a team without members
    And the Members tab counts 1
    And the Teams tab counts 3

    When I return to the Teams tab
    Then the Teams tab counts 3
    And the Teams tab lists these teams:
      | team   | members |
      | Owners | 1       |
      | team-1 | 0       |
      | team-2 | 0       |
    And the team "team-1" offers to add a member
    And the team "team-2" offers to add a member

    When the owner signs out
