@issues
Feature: Scoped labels
  As a repository owner
  I want a scoped label to replace the label of its own scope and to coexist with other scopes
  So that an issue carries at most one label per scope and the list filters agree with it

  Scenario: A scoped label replaces the label of its own scope, coexists with labels of other scopes, and leaves the issue when it is removed
    Given I am signed in as the repository owner
    When I open the label list of the repository
    And I open the new label form
    Then the exclusive option is disabled

    When I name the label "priority/high"
    Then the exclusive option is enabled

    When I mark "priority/high" exclusive and submit it described "Blocks the release" and coloured "#d73a4a"
    Then the label list shows "priority/high" as exclusive, coloured "d73a4a" and described "Blocks the release"
    And the label "priority/high" reads as the scope "priority" and the item "high"

    When I create these exclusive labels:
      | name         | description         | colour  |
      | priority/low | Can wait            | #0e8a16 |
      | kind/bug     | Something is broken | #1d76db |

    When I open the seeded issue
    And I apply the label "priority/high" to the issue
    Then the issue carries only the label "priority/high"
    And the last label event names "priority/high"

    When I apply the label "priority/low" to the issue
    Then the issue carries only the label "priority/low"
    And the last label event names "priority/low"

    When I apply the label "kind/bug" to the issue
    Then the issue carries only the labels "priority/low" and "kind/bug"

    When I filter the issue list of the repository by the label "priority/low"
    Then the filtered issue list shows the seeded issue
    And the seeded issue carries the labels "priority/low" and "kind/bug" in the list

    When I filter the issue list of the repository by the label "kind/bug"
    Then the filtered issue list shows the seeded issue

    When I filter the issue list of the repository by the label "priority/high"
    Then the filtered issue list does not show the seeded issue

    When I open the seeded issue
    And I remove the label "kind/bug" from the issue
    Then the issue carries only the label "priority/low"

    When I filter the issue list of the repository by the label "kind/bug"
    Then the filtered issue list does not show the seeded issue

    When I open the label list of the repository
    Then the label list counts these issues:
      | label        | issues |
      | priority/low | 1      |
      | kind/bug     | 0      |
