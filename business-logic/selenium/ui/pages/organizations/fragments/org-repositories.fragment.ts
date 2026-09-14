import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";
import { By } from "selenium-webdriver";

export class OrgRepositoriesFragment extends BaseComponent {
  private readonly locators = {
    searchBar: By.css("[data-text='Search']"),
    // Right sidebar that contains the Members and Teams sections.
    organizationSidebar: By.css(".ui.five.wide.column"),
    // Counter link in the Members section.
    membersCount: By.css("a[href$='/members'] span"),
    // User avatars displayed in the Members section.
    memberAvatars: By.css("a.avatar-with-link img.ui.avatar"),
    // Links wrapping user avatars in the Members section.
    memberAvatarLinks: By.css("a.avatar-with-link[aria-label]"),
    // Counter link in the Teams section.
    teamsCount: By.css("a[href$='/teams'] span"),
    // Counters for the default Owners team.
    ownersMembersCount: By.css("a.muted[href$='/teams/owners'] strong"),
    ownersRepositoriesCount: By.css("a[href$='/teams/owners/repositories'] strong"),
    // Owner-only action in the Teams section.
    newTeamButton: By.css("a[href$='/teams/new']"),
    newRepositoryButton: By.css("a[href*='/repo/create?org=']"),
    newMigrationButton: By.css("a[href*='/repo/migrate?org=']"),
    repositoriesContainer: By.css(".flex-divided-list.items-with-main"),
    repositoryItem: By.css(".item"),
    repositoryName: By.css(".item-title a.name"),
  };

  async areOwnerElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    if (!ready) return false;
    return this.isVisible([
      this.locators.newTeamButton,
      this.locators.newRepositoryButton,
      this.locators.newMigrationButton,
    ]);
  }

  async areMemberElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    const ownerElementsVisible = await this.areOwnerElementsVisible();
    console.log(
      { pageContext: "main", ready, ownerElementsVisible },
      `Ready: ${ready}, Owner elements visible: ${ownerElementsVisible}`,
    );
    return ready && !ownerElementsVisible;
  }

  async getMembersCount(): Promise<string> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    return this.getText(this.locators.membersCount, sidebar);
  }

  async getMemberAvatarsCount(): Promise<number> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    const memberAvatars = await this.findElements(this.locators.memberAvatars, sidebar);
    return memberAvatars.length;
  }

  async hasMemberAvatar(username: string): Promise<boolean> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    const memberAvatarLinks = await this.findElements(this.locators.memberAvatarLinks, sidebar);
    const avatarUsernames = await Promise.all(
      memberAvatarLinks.map((memberAvatarLink) => memberAvatarLink.getAttribute("aria-label")),
    );
    return avatarUsernames.includes(username);
  }

  async getOwnersMembersCount(): Promise<string> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    return this.getText(this.locators.ownersMembersCount, sidebar);
  }

  async getOwnersRepositoriesCount(): Promise<string> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    return this.getText(this.locators.ownersRepositoriesCount, sidebar);
  }

  async hasNewTeamButton(): Promise<boolean> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    return this.isVisible(this.locators.newTeamButton, sidebar);
  }

  async clickNewRepositoryButton(): Promise<void> {
    await this.click(this.locators.newRepositoryButton);
  }

  async getRepositoryNames(): Promise<string[]> {
    const container = await this.findElement(this.locators.repositoriesContainer);
    const items = await this.findElements(this.locators.repositoryItem, container);
    return Promise.all(items.map((item) => this.getText(this.locators.repositoryName, item)));
  }

  async searchRepository(repositoryName: string): Promise<void> {
    await this.type(this.locators.searchBar, repositoryName);
  }

  async waitForElements(): Promise<boolean> {
    // searchBar only renders once the organization has at least one repository, so it can't
    // gate readiness here - organizationSidebar is present regardless of repository count.
    return this.isVisible(this.locators.organizationSidebar);
  }
}
