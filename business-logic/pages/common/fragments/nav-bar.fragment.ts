import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";

const INSTANT = 0;

export class NavBarFragment extends BaseComponent {
  private readonly navigationBarLocators = {
    // container for the main navigation bar
    navigationBarContainer: "#navbar",
  };

  private readonly primaryBarLocators = {
    profileAvatar: "span.navbar-avatar",
  };

  private readonly secondaryBarLocators = {
    // container for the secondary navigation bar
    secondaryBarContainer: ".ui.secondary.stackable.menu",
    rightOptionsContainer: ".right.menu.tw-flex-wrap.tw-justify-end",
    // elements within the secondary navigation bar
    organizationDropdown: ".text [class=gt-ellipsis]",
    teamsDropdown: "div.ui.floating.dropdown.jump:nth-of-type(2)",
    activitiesOption: ".item.tw-ml-auto",
    issuesOption: ".ui.secondary.stackable.menu a[href$='/issues']",
    pullRequestsOption: ".ui.secondary.stackable.menu a[href$='/pulls']",
    milestonesOption: ".ui.secondary.stackable.menu a[href$='/milestones']",
    viewOrganizationButton: ".basic.button",
    accountDropdown: "[data-tooltip-content='Profile and Settings…']",
    accountAvatar: "[data-tooltip-content='Profile and Settings…'] img.ui.avatar",
    signOutLink: "a[href='/user/logout']",
    organizationDropdownContainer: ".stackable.menu div[role='menu']",
  };

  private readonly dropdownOrganizationLocators = {
    // container for the options within the organization dropdown
    menuOptionsContainer: ".menu.context-user-switch.transition",
    // List of organizations within the dropdown
    organizationsContainer: ".scrolling.menu",
    // options within the organization dropdown
    newOrganizationOption: ".tw-ml-1.tw-mr-5.svg.octicon-plus",
    organizationAvatar: ".secondary-nav .ui.floating.dropdown.jump span.text img.ui.avatar",
    organizationName: ".secondary-nav .text span.gt-ellipsis",
  };

  private readonly baseLocators = [
    this.secondaryBarLocators.organizationDropdown,
    this.dropdownOrganizationLocators.organizationAvatar,
  ];

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  async getCurrentOrganization(timeoutMs?: number): Promise<string> {
    return this.getText(this.secondaryBarLocators.organizationDropdown, undefined, timeoutMs);
  }

  async clickNewOrganizationDropdownOption(): Promise<void> {
    await this.click(this.dropdownOrganizationLocators.newOrganizationOption);
  }

  async clickOrganizationsDropdown(): Promise<void> {
    const readyLocators = [this.dropdownOrganizationLocators.menuOptionsContainer];
    await this.clickAndWaitFor(this.secondaryBarLocators.organizationDropdown, readyLocators);
  }

  // The base pair has to resolve before getCurrentOrganization() is safe to call (it reads a
  // locator that only renders once the bar itself is up), so it short-circuits rather than
  // joining the same Promise.all as the rest.
  async isVisibleOnMainPage(username: string): Promise<boolean> {
    if (!(await this.isVisible(this.baseLocators))) {
      logger.info({ pageContext: "main" }, "Navbar not ready");
      return false;
    }

    try {
      const [usernameMatches, teamsDropdownAbsent, rightOptionsAbsent] = await Promise.all([
        this.getCurrentOrganization().then((text) => text === username),
        this.isVisible(this.secondaryBarLocators.teamsDropdown, undefined, INSTANT).then((v) => !v),
        this.isVisible(this.secondaryBarLocators.rightOptionsContainer, undefined, INSTANT).then(
          (v) => !v,
        ),
      ]);

      const results = { usernameMatches, teamsDropdownAbsent, rightOptionsAbsent };
      logger.info({ pageContext: "main", ...results }, "Navbar expectations");
      return Object.values(results).every(Boolean);
    } catch (thrown) {
      logger.warn(
        {
          pageContext: "main",
          url: await this.getCurrentUrl().catch(() => "unknown"),
          reason: String(thrown),
        },
        "Navbar expectations could not be read",
      );
      return false;
    }
  }

  async areOrgDashboardElementsVisible(): Promise<boolean> {
    const orgDashboardElements = [this.navigationBarLocators.navigationBarContainer];
    return this.isVisible(orgDashboardElements);
  }

  async getViewOrganizationButtonText(): Promise<string> {
    return this.getAttribute(this.secondaryBarLocators.viewOrganizationButton, "title");
  }

  async clickViewOrganizationButton(): Promise<void> {
    await this.click(this.secondaryBarLocators.viewOrganizationButton);
  }

  async getCurrentUsername(): Promise<string> {
    return this.getAttribute(this.secondaryBarLocators.accountAvatar, "title");
  }

  async clickSignOut(): Promise<void> {
    await this.clickAndWaitFor(this.secondaryBarLocators.accountDropdown, [
      this.secondaryBarLocators.signOutLink,
    ]);
    await this.click(this.secondaryBarLocators.signOutLink);
  }

  async waitForElements(): Promise<boolean> {
    return this.isVisible([
      this.navigationBarLocators.navigationBarContainer,
      this.secondaryBarLocators.secondaryBarContainer,
    ]);
  }

  async getDropdownOrganizationsList(): Promise<string[]> {
    const organizationsLocator = ":scope > *";
    const menuOptionsContainer = await this.findElement(
      this.dropdownOrganizationLocators.menuOptionsContainer,
    );
    const organizationContainer = await this.findElement(
      this.dropdownOrganizationLocators.organizationsContainer,
      menuOptionsContainer,
    );
    const organizationElements = await this.findElements(
      organizationsLocator,
      organizationContainer,
    );
    const organizationNames = await Promise.all(organizationElements.map((el) => el.getText()));
    return organizationNames;
  }

  getVolatileRegions(): string[] {
    return [
      this.secondaryBarLocators.organizationDropdownContainer,
      this.primaryBarLocators.profileAvatar,
    ];
  }
}
