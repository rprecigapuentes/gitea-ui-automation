// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";

export enum OrgTab {
  Repos = "Repos",
  Projects = "Projects",
  Packages = "Packages",
  Members = "Members",
  Teams = "Teams",
  Worktime = "Worktime",
}

export class OrgNavigationFragment extends BaseComponent {
  protected currentTab: OrgTab | null = null;

  private readonly locators = {
    // Main content region of an organization profile.
    organizationPage: By.css("[role='main'].organization.profile"),
    // Visible organization name in the profile header.
    organizationName: By.css("[role='main'].organization.profile .tw-text-2xl"),
    // Tab navigation specific to the organization profile.
    repositoriesTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Repositories'])"),
    projectsTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Projects'])"),
    packagesTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Packages'])"),
    membersTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Members'])"),
    teamsTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Teams'])"),
    worktimeTab: By.css("overflow-menu[role='navigation'] a:has([data-text='Worktime'])"),
    // Counter displayed inside the Members and Teams tabs.
    tabCounter: By.css(".ui.small.label"),
  };

  private readonly tabLocators: Record<OrgTab, By> = {
    [OrgTab.Repos]: this.locators.repositoriesTab,
    [OrgTab.Projects]: this.locators.projectsTab,
    [OrgTab.Packages]: this.locators.packagesTab,
    [OrgTab.Members]: this.locators.membersTab,
    [OrgTab.Teams]: this.locators.teamsTab,
    [OrgTab.Worktime]: this.locators.worktimeTab,
  };

  async hasExpectedElementsDisplayed(isOwner: boolean): Promise<boolean> {
    const expectedTabs = isOwner
      ? Object.values(OrgTab)
      : Object.values(OrgTab).filter((tab) => tab !== OrgTab.Worktime);
    const tabResults = await Promise.all(
      expectedTabs.map((tab) => this.exists(this.tabLocators[tab])),
    );
    return (await this.exists(this.locators.organizationPage)) && tabResults.every(Boolean);
  }

  async hasOrganizationNameDisplayed(organizationName: string): Promise<boolean> {
    return (await this.getText(this.locators.organizationName)) === organizationName;
  }

  async isTabSelected(tab: OrgTab): Promise<boolean> {
    const classValue = await this.getAttribute(this.tabLocators[tab], "class");
    return classValue.includes("active");
  }

  async isTabNotSelected(tab: OrgTab): Promise<boolean> {
    return !(await this.isTabSelected(tab));
  }

  async getTabCount(tab: OrgTab.Members | OrgTab.Teams): Promise<string> {
    const tabElement = await this.findElement(this.tabLocators[tab]);
    return this.getText(this.locators.tabCounter, tabElement);
  }

  async navigateToTab(tab: OrgTab): Promise<void> {
    await this.click(this.tabLocators[tab]);
    this.currentTab = tab;
  }
}
