@project-board @cleanup
Feature: Organization project board
  As an organization owner
  I want a Kanban board over the organization's issues
  So that I can see and arrange the work of its repositories

  Background:
    Given the seeded organization has two repositories with one issue each
    And I am logged in as the organization owner
    And a project created from the Basic Kanban template

  Scenario: The Basic Kanban template lays the board out
    When I open the project board
    Then the board shows the columns Backlog, To Do, In Progress and Done
    And the default column is "Backlog"

  Scenario: An issue added to the project lands in the default column
    When I add the first seeded issue to the project
    And I open the project board
    Then the default column holds the first seeded issue
    And the default column counts 1 issue

  Scenario: A column added from the board appears on it
    When I open the project board
    And I add the column "Review" to the board
    And I open the project board
    Then the board shows the column "Review"

  Scenario: The default column cannot be deleted and takes in the cards of a deleted one
    Given the first seeded issue is in the default column
    And I open the project board
    And the column "To Do" is made the default column
    When I open the project board
    Then the column "To Do" does not offer to be deleted
    And the column "Backlog" offers to be deleted
    When I delete the column "Backlog"
    And I open the project board
    Then the board does not show the column "Backlog"
    And the column "To Do" holds the first seeded issue
