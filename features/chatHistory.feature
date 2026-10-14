@Regression @chat-history
Feature: Chat History

  As a NesGPT user
  I want to manage my chats in the Chat History
  So that I can keep my conversations organized

  @auth @NESGPTAI-5956
  Scenario: User renames a chat in the Chat History
    Given I create a test chat for the Chat History tests
    When I rename the chat
    Then the renamed chat is visible in the Chat History

  @auth @NESGPTAI-5957
  Scenario: User pins a chat in the Chat History
    Given I create a test chat for the Chat History tests
    When I pin the chat
    Then the chat is pinned

  @auth @NESGPTAI-5958
  Scenario: User unpins a pinned chat in the Chat History
    Given I create a test chat for the Chat History tests
    When I pin the chat
    And I unpin the chat
    Then the chat is not pinned

  @auth @NESGPTAI-5959
  Scenario: User deletes a chat in the Chat History
    Given I create a test chat for the Chat History tests
    When I delete the chat
    Then the chat is not visible in the Chat History

  @auth @NESGPTAI-5960
  Scenario: User filters the Chat History by date range
    Given I create a test chat for the Chat History tests
    When I filter the Chat History by date range "Preview 7 days"
    And I open the Chat History filters
    Then the "Preview 7 days" filter is applied
    When I clear all Chat History filters
    And I open the Chat History filters
    Then the "All" filter is applied

  @auth @NESGPTAI-5961
  Scenario: User selects multiple chats in the Chat History
    Given I create a test chat for the Chat History tests
    When I open the Chat History selection mode
    And I select the chat in the Chat History selection mode
    Then the Chat History shows 1 selected

  @auth @NESGPTAI-5962
  Scenario: User deletes a chat using the multi-select mode
    Given I create a test chat for the Chat History tests
    When I open the Chat History selection mode
    And I select the chat in the Chat History selection mode
    And I delete the selected chats
    Then the chat is not visible in the Chat History
