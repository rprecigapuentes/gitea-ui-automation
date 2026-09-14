// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

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
    organizationName: By.css(".tw-text-2xl"),
    // Tab container for the organization's navigation tabs.
    tabsContainer: By.css(".overflow-menu-items"),
    // Counter displayed inside the Members and Teams tabs.
    tabCounter: By.css(".ui.small.label"),
  };

  // Each tab's own href, relative to the current organization - Repositories lives at the
  // org's root, the rest under /org/{name}/...
  private readonly tabHref: Record<OrgTab, (organizationName: string) => string> = {
    [OrgTab.Repos]: (organizationName) => `/${organizationName}`,
    [OrgTab.Projects]: (organizationName) => `/${organizationName}/-/projects`,
    [OrgTab.Packages]: (organizationName) => `/${organizationName}/-/packages`,
    [OrgTab.Members]: (organizationName) => `/org/${organizationName}/members`,
    [OrgTab.Teams]: (organizationName) => `/org/${organizationName}/teams`,
    [OrgTab.Worktime]: (organizationName) => `/org/${organizationName}/worktime`,
  };

  private async currentOrganizationName(): Promise<string> {
    const segments = new URL(await this.getCurrentUrl()).pathname.split("/").filter(Boolean);
    return segments[0] === "org" ? segments[1] : segments[0];
  }

  private async tabLocator(tab: OrgTab): Promise<By> {
    const organizationName = await this.currentOrganizationName();
    return this.tabLocatorFor(tab, organizationName);
  }

  private tabLocatorFor(tab: OrgTab, organizationName: string): By {
    return By.css(
      `overflow-menu[role='navigation'] [href="${this.tabHref[tab](organizationName)}"]`,
    );
  }

  async waitForElements(): Promise<boolean> {
    return this.isVisible([this.locators.organizationName, this.locators.tabsContainer]);
  }

  async areOwnerElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    if (!ready) return false;
    const organizationName = await this.currentOrganizationName();
    const locators = Object.values(OrgTab).map((tab) => this.tabLocatorFor(tab, organizationName));
    return this.isVisible(locators);
  }

  async areMemberElementsVisible(): Promise<boolean> {
    const ready = await this.waitForElements();
    if (!ready) return false;
    const organizationName = await this.currentOrganizationName();
    const locators = Object.values(OrgTab)
      .slice(0, -1)
      .map((tab) => this.tabLocatorFor(tab, organizationName));
    return this.isVisible(locators);
  }

  async hasOrganizationNameDisplayed(organizationName: string): Promise<boolean> {
    return (await this.getText(this.locators.organizationName)) === organizationName;
  }

  async isTabSelected(tab: OrgTab): Promise<boolean> {
    const classValue = await this.getAttribute(await this.tabLocator(tab), "class");
    return classValue.includes("active");
  }

  async isTabNotSelected(tab: OrgTab): Promise<boolean> {
    return !(await this.isTabSelected(tab));
  }

  async getTabCount(tab: OrgTab.Members | OrgTab.Teams): Promise<string> {
    const tabElement = await this.findElement(await this.tabLocator(tab));
    return this.getText(this.locators.tabCounter, tabElement);
  }

  async navigateToTab(tab: OrgTab): Promise<void> {
    await this.click(await this.tabLocator(tab));
    this.currentTab = tab;
  }
}
