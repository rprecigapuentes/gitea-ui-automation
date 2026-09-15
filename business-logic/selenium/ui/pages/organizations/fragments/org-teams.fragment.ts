import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";
import { By } from "selenium-webdriver";

export class OrgTeamsFragment extends BaseComponent {
  private readonly locators = {
    // Main content of the organization Teams tab.
    teamsPage: By.css("[role='main'].organization.teams"),
    // Owner-only action to create a team.
    newTeamButton: By.css("a[href$='/teams/new']"),
    // Grid holding every team card rendered in the Teams tab.
    teamsContainer: By.css(".ui.two.column.stackable.grid"),
    // Team cards rendered in the Teams tab - every team, not just Owners.
    teamContainer: By.css(".team-item-box"),
    teamName: By.css(".team-item-header a strong"),
    teamNameLink: By.css(".team-item-header .flex-text-inline a"),
    teamMembersCount: By.css(
      ".team-item-header .flex-text-block a:not(:has(strong)):not([href$='/repositories'])",
    ),
    teamAvatars: By.css("a.avatar-with-link img.ui.avatar"),
    // Entry point to the detail page for a team with no members.
    addTeamMemberLink: By.css(".ui.attached.segment a.flex-text-inline"),
    searchBar: By.css(".ui.form.ignore-dirty.tw-my-4"),
  };

  async waitForElements(): Promise<boolean> {
    const isVisible = await this.isVisible(this.locators.searchBar);
    return isVisible;
  }

  async areOwnerElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    if (!ready) return false;
    return this.isVisible([this.locators.newTeamButton]);
  }

  async areMemberElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    const ownerElementsVisible = await this.areOwnerElementsVisible();
    return ready && !ownerElementsVisible;
  }

  async getTeamContainersCount(): Promise<number> {
    return (await this.findElements(this.locators.teamContainer)).length;
  }

  async getTeamNames(): Promise<string[]> {
    const teamsContainer = await this.findElement(this.locators.teamsContainer);
    const teamContainers = await this.findElements(this.locators.teamContainer, teamsContainer);

    return Promise.all(
      teamContainers.map((teamContainer) => this.getText(this.locators.teamName, teamContainer)),
    );
  }

  async hasTeamContainer(teamName: string): Promise<boolean> {
    return this.isVisible(this.teamContainerNamed(teamName));
  }

  async getTeamMembersCount(teamName: string): Promise<string> {
    const teamContainer = await this.findTeamContainer(teamName);
    return this.getText(this.locators.teamMembersCount, teamContainer);
  }

  async getTeamAvatarsCount(teamName: string): Promise<number> {
    const teamContainer = await this.findTeamContainer(teamName);
    return (await teamContainer.findElements(this.locators.teamAvatars)).length;
  }

  async getTeamAvatarUsernames(teamName: string): Promise<string[]> {
    const teamContainer = await this.findTeamContainer(teamName);
    const avatars = await teamContainer.findElements(this.locators.teamAvatars);
    return Promise.all(avatars.map(async (avatar) => (await avatar.getAttribute("title")) ?? ""));
  }

  async hasTeamAvatar(teamName: string, username: string): Promise<boolean> {
    const usernames = await this.getTeamAvatarUsernames(teamName);
    return usernames.includes(username);
  }

  async clickNewTeamButton(): Promise<void> {
    await this.click(this.locators.newTeamButton);
  }

  async hasAddTeamMemberLink(teamName: string): Promise<boolean> {
    const teamContainer = await this.findTeamContainer(teamName);
    return this.isVisible(this.locators.addTeamMemberLink, teamContainer);
  }

  async doesNotHaveAddTeamMemberLink(teamName: string): Promise<boolean> {
    const teamContainer = await this.findTeamContainer(teamName);
    return !(await this.isVisible(this.locators.addTeamMemberLink, teamContainer, 0));
  }

  async clickAddTeamMemberLink(teamName: string): Promise<void> {
    const teamContainer = await this.findTeamContainer(teamName);
    await this.click(this.locators.addTeamMemberLink, teamContainer);
  }

  async clickTeamName(teamName: string): Promise<void> {
    const teamContainer = await this.findTeamContainer(teamName);
    await this.click(this.locators.teamNameLink, teamContainer);
  }

  // Naming the card in the locator is what makes the wait mean something: reading every card and
  // then picking one samples the grid once, so a page that has rendered some other team's card
  // satisfies the wait and the one being looked for is reported missing. The team's own link is
  // what identifies it - Gitea lowercases the name into the URL - so no text matching is needed.
  private teamContainerNamed(teamName: string): By {
    return By.css(`.team-item-box:has(a[href$="/teams/${teamName.toLowerCase()}"])`);
  }

  private async findTeamContainer(teamName: string) {
    return this.findElement(this.teamContainerNamed(teamName));
  }

  async searchTeam(teamName: string): Promise<void> {
    await this.type(this.locators.searchBar, teamName);
  }
}
