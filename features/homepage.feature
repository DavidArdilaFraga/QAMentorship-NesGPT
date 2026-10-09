@login @Regression
Feature: Login

  @NESGPTAI-5947
  Scenario: User log in NesGPT
    Given I am on login page
    When I complete the login form
    Then I see the NesGPT homepage

  @NESGPTAI-5949
  Scenario: User log in NesGPT again
    Given I am on login page
    When I complete the login form
    Then I receive an email

  @auth @NESGPTAI-5952
  Scenario: User navigates through the NesGPT menu options
    Given I am on the NesGPT homepage
    When I open the "<menuOption>" menu option
    Then the "<menuOption>" page is loaded correctly

    Examples:
      | menuOption      |
      | Prompt Library  |
      | Chat History    |
      | Discover NesGPT |
      | Settings        |
