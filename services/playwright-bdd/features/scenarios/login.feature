Feature: Login
  As a Gitea user
  I want to log in with my credentials
  So that I can access main page

  Scenario: A valid Gitea user can log in
    Given I am on the Gitea login page
    When I log in with valid credentials
    Then I should land on the Gitea dashboard
