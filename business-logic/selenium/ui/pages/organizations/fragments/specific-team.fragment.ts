import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class SpecificTeamFragment extends BaseComponent {
  private readonly locators = {
    // Created team details card.
    teamDetails: By.css("[role='main'].organization.teams .ui.six.wide.column"),
    // Team name in the details card header.
    teamName: By.css("[role='main'].organization.teams .ui.six.wide.column h4 strong"),
    // Team visibility label in the details card header.
    teamVisibilityLabel: By.css(
      "[role='main'].organization.teams .ui.six.wide.column h4 .ui.mini.label",
    ),
    // Owner-only member management form and controls.
    addTeamMemberForm: By.css("form[action$='/action/add']"),
    searchUserInput: By.css("input[name='uname']"),
    // Gitea user search widget and dynamically rendered result entries.
    userSearchResults: By.css("#search-user-box .results .result"),
    userSearchResultName: By.css(".title"),
    addTeamMemberButton: By.css("form[action$='/action/add'] button"),
    joinButton: By.css("form[action$='/action/join'] button"),
    settingsButton: By.css("a[href$='/edit']"),
    // Member and repository counters in the team navigation.
    membersCount: By.css(".org-team-navbar a.active strong"),
    repositoriesCount: By.css(".org-team-navbar a[href$='/repositories'] strong"),
    // Empty and populated states of the team members list.
    emptyMembersMessage: By.css(".flex-divided-list .tw-text-text-light.tw-italic"),
    teamMemberUsernames: By.css(".flex-divided-list .item-title a.text.muted"),
    removeTeamMemberButton: By.css("button[data-modal='#remove-team-member']"),
    // Confirmation modal shown when removing a team member.
    removeTeamMemberModal: By.css("#remove-team-member"),
    removeTeamMemberModalTitle: By.css("#remove-team-member .header"),
    removeTeamMemberModalContent: By.css("#remove-team-member .content"),
    confirmRemoveTeamMemberButton: By.css("#remove-team-member button.ui.primary.ok"),
  };

  async waitForElements(): Promise<boolean> {
    return this.isVisible(this.locators.teamDetails);
  }

  async waitUntilTeamDisplayed(teamName: string): Promise<void> {
    await this.findElement(this.locators.teamDetails);
    await this.driver.wait(
      async () => (await this.getText(this.locators.teamName)) === teamName,
      5000,
    );
  }

  async isVisibleForOwner(): Promise<boolean> {
    return this.isVisible([
      this.locators.membersCount,
      this.locators.repositoriesCount,
      this.locators.addTeamMemberForm,
      this.locators.searchUserInput,
      this.locators.addTeamMemberButton,
      this.locators.joinButton,
      this.locators.settingsButton,
    ]);
  }

  async isVisibleForMember(): Promise<boolean> {
    return this.isVisible([this.locators.membersCount, this.locators.repositoriesCount]);
  }

  async hasTeamNameDisplayed(teamName: string): Promise<boolean> {
    return (await this.getText(this.locators.teamName)) === teamName;
  }

  async hasPrivateVisibility(): Promise<boolean> {
    return (await this.getText(this.locators.teamVisibilityLabel)) === "Private";
  }

  async getMembersCount(): Promise<string> {
    return this.getText(this.locators.membersCount);
  }

  async getRepositoriesCount(): Promise<string> {
    return this.getText(this.locators.repositoriesCount);
  }

  async hasEmptyMembersMessage(): Promise<boolean> {
    return (await this.getText(this.locators.emptyMembersMessage)) === "No members on this team.";
  }

  async hasMember(username: string): Promise<boolean> {
    const usernames = await this.findElements(this.locators.teamMemberUsernames);
    const displayedUsernames = await Promise.all(usernames.map((element) => element.getText()));
    return displayedUsernames.includes(username);
  }

  async hasRemoveTeamMemberButton(): Promise<boolean> {
    return this.isVisible(this.locators.removeTeamMemberButton);
  }

  async clickRemoveTeamMemberButton(): Promise<void> {
    // The modal's fade-in animation can outlast the default wait when the machine is busy
    // running other browsers, so it gets a more generous budget.
    await this.clickAndWaitFor(
      this.locators.removeTeamMemberButton,
      [this.locators.removeTeamMemberModal],
      this.driver,
      10000,
    );
  }

  async isRemoveTeamMemberModalDisplayed(): Promise<boolean> {
    return this.isVisible(this.locators.removeTeamMemberModal);
  }

  async hasExpectedRemoveTeamMemberModalElements(): Promise<boolean> {
    return this.isVisible([
      this.locators.removeTeamMemberModalTitle,
      this.locators.removeTeamMemberModalContent,
      this.locators.confirmRemoveTeamMemberButton,
    ]);
  }

  async confirmRemoveTeamMember(): Promise<void> {
    await this.click(this.locators.confirmRemoveTeamMemberButton);
    await this.driver.wait(() => this.isRemoveTeamMemberModalHidden(), 5000);
  }

  async isRemoveTeamMemberModalHidden(): Promise<boolean> {
    const modal = await this.driver.findElements(this.locators.removeTeamMemberModal);
    // The modal is removed from the DOM (not just hidden) once its close transition finishes,
    // so an element reference fetched a moment ago can go stale before isDisplayed() runs.
    // A stale reference means the element is gone, which means it is, by definition, not
    // displayed.
    const displayed = await Promise.all(
      modal.map((element) => element.isDisplayed().catch(() => false)),
    );
    return !displayed.some(Boolean);
  }

  async searchUsers(query: string): Promise<void> {
    await this.type(this.locators.searchUserInput, query);
    await this.findElements(this.locators.userSearchResults);
  }

  // uname is a plain form field, so an exact username needs no suggestion click to submit.
  async addMemberByUsername(username: string): Promise<void> {
    await this.type(this.locators.searchUserInput, username);
    await this.clickAndWaitUntil(this.locators.addTeamMemberButton, () => this.hasMember(username));
  }

  async hasOnlyMatchingUserSearchResults(query: string): Promise<boolean> {
    const results = await this.findElements(this.locators.userSearchResults);
    const usernames = await Promise.all(
      results.map((result) => this.getText(this.locators.userSearchResultName, result)),
    );
    return usernames.every((username) => username.toLowerCase().includes(query.toLowerCase()));
  }

  async hasUserSearchResults(): Promise<boolean> {
    return (await this.findElements(this.locators.userSearchResults)).length > 0;
  }

  async hasUserSearchResult(username: string): Promise<boolean> {
    const results = await this.findElements(this.locators.userSearchResults);
    const usernames = await Promise.all(
      results.map((result) => this.getText(this.locators.userSearchResultName, result)),
    );
    return usernames.includes(username);
  }

  async selectUser(username: string): Promise<void> {
    const result = await this.findUserSearchResult(username);
    await result.click();
  }

  async hasSelectedUser(username: string): Promise<boolean> {
    return (await this.getAttribute(this.locators.searchUserInput, "value")) === username;
  }

  async addSelectedUser(): Promise<void> {
    await this.clickAndWaitFor(this.locators.addTeamMemberButton, [
      this.locators.teamMemberUsernames,
    ]);
  }

  async hasNoEmptyMembersMessage(): Promise<boolean> {
    return !(await this.isVisible(this.locators.emptyMembersMessage, this.driver, 0));
  }

  private async findUserSearchResult(username: string) {
    const results = await this.findElements(this.locators.userSearchResults);
    const result = await Promise.all(
      results.map(async (candidate) =>
        (await this.getText(this.locators.userSearchResultName, candidate)) === username
          ? candidate
          : undefined,
      ),
    ).then((candidates) => candidates.find(Boolean));

    if (!result) {
      throw new Error(`Search result for user "${username}" was not found`);
    }

    return result;
  }
}
