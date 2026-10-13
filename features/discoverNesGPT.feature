@Regression @auth @discover-nesgpt
Feature: Discover NesGPT

  As a NesGPT user
  I want to view information about NesGPT and its help topics
  So that I can understand how to use the assistant

  Background:
    Given I am on the NesGPT homepage
    When I open the "Discover NesGPT" menu option

  Scenario: User sees the Discover NesGPT landing page
    Then the Discover NesGPT header and navigation are visible
    And the NesGPT introduction and capabilities are visible

  Scenario Outline: User views an About or Help topic
    When I open the "<topic>" Discover NesGPT topic
    Then the "<topic>" Discover NesGPT content is visible

    Examples:
      | topic                            |
      | What is NesGPT                   |
      | Essential Knowledge              |
      | NesGPT AI Assistants              |
      | Prompting                        |
      | NesGPT in Copilot                 |
      | FAQ (Frequently Asked Questions) |
      | Changelog                        |
      | Security and Compliance          |
      | Support and Incident Reporting   |
