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
  };

  async hasExpectedElementsDisplayed(isOwner: boolean): Promise<boolean> {
    const sidebar = await this.findElement(this.locators.organizationSidebar);
    const expectedElements = [
      this.exists(this.locators.membersCount, sidebar),
      this.exists(this.locators.teamsCount, sidebar),
    ];

    if (isOwner) {
      expectedElements.push(this.exists(this.locators.newTeamButton, sidebar));
    }

    return (await Promise.all(expectedElements)).every(Boolean);
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
    return this.exists(this.locators.newTeamButton, sidebar);
  }

  async searchRepository(repositoryName: string): Promise<void> {
    await this.type(this.locators.searchBar, repositoryName);
  }
}
