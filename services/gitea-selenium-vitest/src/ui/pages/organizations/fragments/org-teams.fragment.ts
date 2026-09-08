import { BaseComponent } from "@gitea-automation/core/selenium/ui/base-pages/base-component";
import { By } from "selenium-webdriver";

export class OrgTeamsFragment extends BaseComponent {
  private readonly locators = {
    searchBar: By.css("[data-text='Search']"),
    // Main content of the organization Teams tab.
    teamsPage: By.css("[role='main'].organization.teams"),
    // Owner-only action to create a team.
    newTeamButton: By.css("a[href$='/teams/new']"),
    // Team cards rendered in the Teams tab.
    teamContainers: By.css(".team-item-box"),
    teamName: By.css(".team-item-header a strong"),
    teamNameLink: By.css(".team-item-header .flex-text-inline a"),
    teamMembersCount: By.css(
      ".team-item-header .flex-text-block a:not(:has(strong)):not([href$='/repositories'])",
    ),
    teamAvatars: By.css("a.avatar-with-link img.ui.avatar"),
    // Entry point to the detail page for a team with no members.
    addTeamMemberLink: By.css(".ui.attached.segment a.flex-text-inline"),
  };

  async waitUntilDisplayed(): Promise<void> {
    await this.findElement(this.locators.teamsPage);
  }

  async hasExpectedElementsDisplayed(isOwner: boolean): Promise<boolean> {
    const expectedElements = [this.exists(this.locators.teamContainers)];
    if (isOwner) {
      expectedElements.push(this.exists(this.locators.newTeamButton));
    }
    return (await Promise.all(expectedElements)).every(Boolean);
  }

  async getTeamContainersCount(): Promise<number> {
    return (await this.findElements(this.locators.teamContainers)).length;
  }

  async hasTeamContainer(teamName: string): Promise<boolean> {
    const teamContainers = await this.findElements(this.locators.teamContainers);
    const teamNames = await Promise.all(
      teamContainers.map((teamContainer) => this.getText(this.locators.teamName, teamContainer)),
    );
    return teamNames.includes(teamName);
  }

  async getTeamMembersCount(teamName: string): Promise<string> {
    const teamContainer = await this.findTeamContainer(teamName);
    return this.getText(this.locators.teamMembersCount, teamContainer);
  }

  async getTeamAvatarsCount(teamName: string): Promise<number> {
    const teamContainer = await this.findTeamContainer(teamName);
    return (await teamContainer.findElements(this.locators.teamAvatars)).length;
  }

  async hasTeamAvatar(teamName: string, username: string): Promise<boolean> {
    const teamContainer = await this.findTeamContainer(teamName);
    const avatars = await teamContainer.findElements(this.locators.teamAvatars);
    const usernames = await Promise.all(avatars.map((avatar) => avatar.getAttribute("title")));
    return usernames.includes(username);
  }

  async clickNewTeamButton(): Promise<void> {
    await this.click(this.locators.newTeamButton);
  }

  async hasAddTeamMemberLink(teamName: string): Promise<boolean> {
    const teamContainer = await this.findTeamContainer(teamName);
    return this.exists(this.locators.addTeamMemberLink, teamContainer);
  }

  async doesNotHaveAddTeamMemberLink(teamName: string): Promise<boolean> {
    const teamContainer = await this.findTeamContainer(teamName);
    return (await teamContainer.findElements(this.locators.addTeamMemberLink)).length === 0;
  }

  async clickAddTeamMemberLink(teamName: string): Promise<void> {
    const teamContainer = await this.findTeamContainer(teamName);
    await this.click(this.locators.addTeamMemberLink, teamContainer);
  }

  async clickTeamName(teamName: string): Promise<void> {
    const teamContainer = await this.findTeamContainer(teamName);
    await this.click(this.locators.teamNameLink, teamContainer);
  }

  private async findTeamContainer(teamName: string) {
    const teamContainers = await this.findElements(this.locators.teamContainers);
    const teamContainer = await Promise.all(
      teamContainers.map(async (container) =>
        (await this.getText(this.locators.teamName, container)) === teamName
          ? container
          : undefined,
      ),
    ).then((containers) => containers.find(Boolean));

    if (!teamContainer) {
      throw new Error(`Team container for "${teamName}" was not found`);
    }

    return teamContainer;
  }

  async searchTeam(teamName: string): Promise<void> {
    await this.type(this.locators.searchBar, teamName);
  }
}
