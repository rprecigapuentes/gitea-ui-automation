import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { logger } from "@gitea-automation/core-logger/pino.logger";

const TAB_CLICK_ATTEMPTS = 2;
const TAB_NAVIGATION_TIMEOUT_MS = 5000;

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
    organizationPage: "[role='main'].organization.profile",
    // Visible organization name in the profile header.
    organizationName: ".tw-text-2xl",
    // Tab container for the organization's navigation tabs.
    tabsContainer: ".overflow-menu-items",
    // Counter displayed inside the Members and Teams tabs.
    tabCounter: ".ui.small.label",
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

  private async tabLocator(tab: OrgTab): Promise<string> {
    const organizationName = await this.currentOrganizationName();
    return this.tabLocatorFor(tab, organizationName);
  }

  private tabLocatorFor(tab: OrgTab, organizationName: string): string {
    return `overflow-menu[role='navigation'] [href="${this.tabHref[tab](organizationName)}"]`;
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

  /**
   * The tab bar is a custom element that rebuilds its items as it upgrades, so a click that lands
   * while it is still doing that hits a node the rebuild then replaces and no navigation follows.
   * What decides is the address the browser ends up on, and a lost click is clicked again.
   */
  async navigateToTab(tab: OrgTab): Promise<void> {
    const organizationName = await this.currentOrganizationName();
    const locator = this.tabLocatorFor(tab, organizationName);
    const href = this.tabHref[tab](organizationName);
    const reachedTab = async (): Promise<boolean> =>
      new URL(await this.getCurrentUrl()).pathname === href;

    for (let attempt = 1; attempt <= TAB_CLICK_ATTEMPTS; attempt += 1) {
      try {
        await this.actAndWaitUntil(
          () => this.click(locator),
          reachedTab,
          TAB_NAVIGATION_TIMEOUT_MS,
        );
        this.currentTab = tab;
        return;
      } catch (error) {
        if (attempt === TAB_CLICK_ATTEMPTS) throw error;

        logger.warn({ tab, href }, "The organization tab click did not navigate; clicking again");
      }
    }
  }
}
