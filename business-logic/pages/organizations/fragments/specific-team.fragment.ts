import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { IElementHandle } from "@gitea-automation/core-page-objects/element-handle.interface";
import { InteractionInterceptedError } from "@gitea-automation/core-page-objects/errors";

const INSTANT = 0;

export class SpecificTeamFragment extends BaseComponent {
  private readonly locators = {
    // Created team details card.
    teamDetails: "[role='main'].organization.teams .ui.six.wide.column",
    // Team name in the details card header.
    teamName: "[role='main'].organization.teams .ui.six.wide.column h4 strong",
    // Team visibility label in the details card header.
    teamVisibilityLabel: "[role='main'].organization.teams .ui.six.wide.column h4 .ui.mini.label",
    // Owner-only member management form and controls.
    addTeamMemberForm: "form[action$='/action/add']",
    searchUserInput: "input[name='uname']",
    // Gitea user search widget and dynamically rendered result entries.
    userSearchResults: "#search-user-box .results .result",
    // The list narrows as the query grows, so "the only entry left" is a waitable condition and
    // the one entry it resolves to is the searched user, without matching on its text.
    onlyUserSearchResult: "#search-user-box .results .result:only-child",
    userSearchResultName: ".title",
    addTeamMemberButton: "form[action$='/action/add'] button",
    joinButton: "form[action$='/action/join'] button",
    settingsButton: "a[href$='/edit']",
    settingsIcon: ".svg.octicon-gear",
    // Member and repository counters in the team navigation.
    membersCount: ".org-team-navbar a.active strong",
    repositoriesCount: ".org-team-navbar a[href$='/repositories'] strong",
    repositoriesTabLink: ".org-team-navbar a[href$='/repositories']",
    repoSearchInput: "input[name='repo_name']",
    addRepoButton: "form[action$='/repo/add'] button",
    // Repositories tab's assigned-repos list - distinct from the search form's own segment,
    // which also carries the "ui attached segment" classes.
    assignedRepositoriesContainer: ".ui.attached.segment:has(.flex-divided-list)",
    assignedRepositoryLink: ".item-main a.item-title",
    // Empty and populated states of the team members list.
    emptyMembersMessage: ".flex-divided-list .tw-text-text-light.tw-italic",
    teamMemberUsernames: ".flex-divided-list .item-title a.text.muted",
    // Scoped by data-modal-name - every row's remove button shares the same data-modal id,
    // so an unscoped selector matches every member once a team has more than one.
    removeTeamMemberButton: (username: string) => `[data-modal-name='${username}']`,
    // Confirmation modal shown when removing a team member.
    removeTeamMemberModal: "#remove-team-member",
    removeTeamMemberModalTitle: "#remove-team-member .header",
    removeTeamMemberModalContent: "#remove-team-member .content",
    confirmRemoveTeamMemberButton: "#remove-team-member button.ui.primary.ok",
  };

  async waitForElements(): Promise<boolean> {
    return this.isVisible(this.locators.teamDetails);
  }

  async waitUntilTeamDisplayed(teamName: string): Promise<void> {
    await this.actAndWaitUntil(
      async () => {
        await this.findElement(this.locators.teamDetails);
      },
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

  async clickSettingsButton(): Promise<void> {
    await this.click(this.locators.settingsIcon);
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

  async hasRemoveTeamMemberButton(username: string): Promise<boolean> {
    return this.isVisible(this.locators.removeTeamMemberButton(username));
  }

  async clickRemoveTeamMemberButton(username: string): Promise<void> {
    const locator = this.locators.removeTeamMemberButton(username);

    try {
      await this.clickAndWaitFor(locator, [this.locators.removeTeamMemberModal], undefined, 15000);
    } catch {
      try {
        await this.click(locator, undefined, 0);
      } catch (retryClickError) {
        // A dimmer already covering the button means the first click landed and the modal is
        // mid-transition under load, not stalled - fall through to just waiting for it instead
        // of treating a second, blocked click as a real failure.
        if (!(retryClickError instanceof InteractionInterceptedError)) {
          throw retryClickError;
        }
      }
      await this.findElement(this.locators.removeTeamMemberModal, undefined, 15000);
    }
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
    await this.clickAndWaitUntil(
      this.locators.confirmRemoveTeamMemberButton,
      () => this.isRemoveTeamMemberModalHidden(),
      undefined,
      5000,
    );
  }

  async isRemoveTeamMemberModalHidden(): Promise<boolean> {
    const modal = await this.queryAll(this.locators.removeTeamMemberModal);
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
    return this.waitUntil(
      async () => (await this.findElements(this.locators.userSearchResults)).length > 0,
    );
  }

  // Keeps looking while the list settles. One read of it answers for whatever the search had
  // returned at that instant, which on the CT grid was a filtered list the user had not reached
  // yet, and no locator can name an entry that carries its username only as text.
  async hasUserSearchResult(username: string): Promise<boolean> {
    return this.waitUntil(async () => (await this.getUserSearchResultNames()).includes(username));
  }

  private async getUserSearchResultNames(): Promise<string[]> {
    const results = await this.findElements(
      this.locators.userSearchResults,
      undefined,
      INSTANT,
    ).catch((): IElementHandle[] => []);

    return Promise.all(
      results.map((result) =>
        this.getText(this.locators.userSearchResultName, result, INSTANT).catch(() => ""),
      ),
    );
  }

  // A suggestion entry carries the username as text and nothing else - no href, no id, no data
  // attribute - so no selector can name one. Reading the list and clicking the entry that matched
  // is what fails: it re-renders on every keystroke and every response, and the click lands on
  // whatever now occupies that position. Typing the rest of the name narrows the list to one entry
  // instead, and the wait after the click is what proves that entry was taken. The remainder is
  // typed rather than the whole name retyped because clearing the field leaves Fomantic's search
  // widget holding a value with no results - confirmed against the instance under test.
  async selectUser(username: string): Promise<void> {
    const queried = await this.getAttribute(this.locators.searchUserInput, "value");
    await this.type(this.locators.searchUserInput, username.slice(queried.length));
    await this.clickAndWaitUntil(this.locators.onlyUserSearchResult, () =>
      this.hasSelectedUser(username),
    );
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
    return !(await this.isVisible(this.locators.emptyMembersMessage, undefined, 0));
  }

  async navigateToRepositoriesTab(): Promise<void> {
    await this.clickAndWaitFor(this.locators.repositoriesTabLink, [
      this.locators.repoSearchInput,
      this.locators.addRepoButton,
    ]);
  }

  async addRepository(repositoryName: string): Promise<void> {
    await this.type(this.locators.repoSearchInput, repositoryName);
    // The assignment re-render can outlast the default timeout under load, same as the other
    // team-management actions in this fragment.
    await this.clickAndWaitUntil(
      this.locators.addRepoButton,
      () => this.hasAssignedRepository(repositoryName),
      undefined,
      15000,
    );
  }

  async hasAssignedRepository(repositoryName: string): Promise<boolean> {
    const names = await this.getAssignedRepositoryNames().catch((): string[] => []);
    return names.includes(repositoryName);
  }

  async getAssignedRepositoryNames(): Promise<string[]> {
    const container = await this.findElement(this.locators.assignedRepositoriesContainer);
    const links = await this.findElements(this.locators.assignedRepositoryLink, container);
    const texts = await Promise.all(links.map((link) => link.getText()));
    return texts.map((text) => text.split("/").pop()!.trim());
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
