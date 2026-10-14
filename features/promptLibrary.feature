@Regression @auth @prompt-library @mode:default
Feature: Prompt Library

  As a NesGPT user
  I want to organise and reuse my prompts
  So that I can work consistently across conversations

  Background:
    Given I am on the Prompt Library page

  Scenario Outline: User navigates between Prompt Library sections
    When I open the "<section>" Prompt Library section
    Then the "<section>" Prompt Library section is loaded

    Examples:
      | section        |
      | Get inspired   |
      | Pinned Prompts |
      | My Categories  |

  Scenario: User starts an empty chat from the Prompt Library
    When I start a new NesGPT chat from the Prompt Library
    Then the new chat input is empty

  Scenario: User creates a category
    When I create a test category in the Prompt Library
    Then the test category is selected in the Prompt Library

  Scenario: User renames a category without losing its prompts
    Given I have a test prompt in its own Prompt Library category
    When I rename the test Prompt Library category
    Then the renamed test category is selected in the Prompt Library
    And the test prompt is visible with its saved content

  Scenario: User cancels category deletion
    Given I have a test prompt in its own Prompt Library category
    When I cancel deletion of the test Prompt Library category
    Then the test category is selected in the Prompt Library
    And the test prompt is visible with its saved content

  Scenario: User deletes an empty category
    Given I create a test category in the Prompt Library
    When I delete the test Prompt Library category
    Then the test category is not visible in the Prompt Library

  Scenario: Deleting a category moves its prompts to General
    Given I have a test prompt in its own Prompt Library category
    When I delete the test Prompt Library category
    Then the test category is not visible in the Prompt Library
    When I open the General Prompt Library category
    Then the test prompt is visible with its saved content

  Scenario: User creates a prompt and its content persists
    Given I create a test category in the Prompt Library
    When I create a test prompt in the selected category
    And I reload the Prompt Library page
    Then the test prompt is visible with its saved content

  Scenario: User cancels prompt creation
    Given I create a test category in the Prompt Library
    When I cancel creation of a test prompt
    Then the test prompt is not visible in the Prompt Library

  Scenario: User edits a prompt and its content persists
    Given I have a test prompt in its own Prompt Library category
    When I edit the test prompt name and content
    And I reload the Prompt Library page
    Then the edited test prompt is visible with its saved content
    And the original test prompt name is not visible

  Scenario: User cancels prompt editing
    Given I have a test prompt in its own Prompt Library category
    When I cancel editing the test prompt
    Then the test prompt is visible with its saved content
    And the edited test prompt name is not visible

  Scenario: User pins a prompt
    Given I have a test prompt in its own Prompt Library category
    When I pin the test prompt
    And I reload the Prompt Library page
    Then the "Pinned Prompts" Prompt Library section is loaded
    And the test prompt is visible with its saved content

  Scenario: User unpins a prompt without deleting it
    Given I have a test prompt in its own Prompt Library category
    When I pin the test prompt
    And I unpin the test prompt
    And I reload the Prompt Library page
    Then the test prompt is not visible in the Prompt Library
    When I open the test Prompt Library category
    Then the test prompt is visible with its saved content

  Scenario: User cancels prompt deletion
    Given I have a test prompt in its own Prompt Library category
    When I cancel deletion of the test prompt
    Then the test prompt is visible with its saved content

  Scenario: User deletes a pinned prompt
    Given I have a test prompt in its own Prompt Library category
    When I pin the test prompt
    And I open the test Prompt Library category
    And I delete the test prompt
    And I reload the Prompt Library page
    Then the test prompt is not visible in the Prompt Library
    When I open the "Pinned Prompts" Prompt Library section
    Then the test prompt is not visible in the Prompt Library

  Scenario Outline: User sorts prompts by title
    Given I have three test prompts in their own Prompt Library category
    When I sort the Prompt Library by "<order>"
    Then the test prompts are displayed in "<order>" order

    Examples:
      | order         |
      | Title: A -> Z |
      | Title: Z -> A |

  Scenario: User uses a saved prompt in a new chat
    Given I have a test prompt in its own Prompt Library category
    When I start a new chat using the test prompt
    Then the chat input contains the saved test prompt content
