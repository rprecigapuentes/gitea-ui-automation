@issues
Feature: Issue metadata
  As a repository owner
  I want an issue to keep the description, the label, the milestone and the assignee it was created with
  So that both list filters return it and closing it completes its milestone

  Scenario: An issue created with a Markdown description, a label, a milestone and an assignee is returned by both list filters and completes its milestone when it is closed
    Given I am signed in as the repository owner
    When I open the new issue form of the repository
    And I fill the issue with a title and a Markdown description
    And I open the description preview
    Then the description preview renders that heading and that paragraph

    When I select the seeded label, the seeded milestone and the maintainer as assignee
    Then the form shows the seeded label, the seeded milestone and the maintainer as selected

    When I submit the issue
    Then the created issue is "Open"
    And the created issue carries that title and renders that paragraph
    And the created issue carries the seeded label, the seeded milestone and the maintainer

    When I set the due date of the created issue to the seeded milestone's due date
    Then the created issue shows that due date

    When I filter the issue list of the repository by the seeded label
    Then the filtered issue list shows the created issue
    And the created issue carries only the seeded label in the list

    When I filter the issue list of the repository by the seeded milestone
    Then the filtered issue list shows the created issue

    When I filter the issue list of the repository by no milestone
    Then the filtered issue list does not show the created issue

    Then the seeded milestone counts 1 open and 0 closed issues at 0% complete

    When I close the created issue of the repository
    Then the created issue is "Closed"
    And the seeded milestone counts 0 open and 1 closed issues at 100% complete
