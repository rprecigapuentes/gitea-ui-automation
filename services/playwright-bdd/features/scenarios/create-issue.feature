Feature: Create an issue
  As a repository owner
  I want an issue to carry the title and the description I gave it
  So that the work is described where the repository tracks it

  Scenario: An issue is created with a title and a description
    Given I am signed in as the repository owner
    When I open the new issue form of the repository
    And I fill the issue with a title and a description
    And I submit the issue
    Then the created issue carries that title and that description
    And the created issue is "Open"
    And the issue list of the repository shows the created issue
