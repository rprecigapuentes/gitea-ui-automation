import { By, WebDriver } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class NavBarFragment extends BaseComponent {
  private readonly navigationBarLocators = {
    // container for the main navigation bar
    navigationBarContainer: By.css("#navbar"),
  };

  private readonly secondaryBarLocators = {
    // container for the secondary navigation bar
    secondaryBarContainer: By.css(".ui.secondary.stackable.menu"),
    rightOptionsContainer: By.css(".right.menu.tw-flex-wrap.tw-justify-end"),
    // elements within the secondary navigation bar
    organizationDropdown: By.css(".text [class=gt-ellipsis]"),
    teamsDropdown: By.css("div.ui.floating.dropdown.jump:nth-of-type(2)"),
    activitiesOption: By.css(".item.tw-ml-auto"),
    issuesOption: By.css(".ui.secondary.stackable.menu a[href$='/issues']"),
    pullRequestsOption: By.css(".ui.secondary.stackable.menu a[href$='/pulls']"),
    milestonesOption: By.css(".ui.secondary.stackable.menu a[href$='/milestones']"),
    viewOrganizationButton: By.css(".basic.button"),
    accountDropdown: By.css("[data-tooltip-content='Profile and Settings…']"),
    accountAvatar: By.css("[data-tooltip-content='Profile and Settings…'] img.ui.avatar"),
    signOutLink: By.css("a[href='/user/logout']"),
  };

  private readonly dropdownOrganizationLocators = {
    // container for the options within the organization dropdown
    menuOptionsContainer: By.css(".menu.context-user-switch.transition"),
    // List of organizations within the dropdown
    organizationsContainer: By.css(".scrolling.menu"),
    // options within the organization dropdown
    newOrganizationOption: By.css(".tw-ml-1.tw-mr-5.svg.octicon-plus"),
    organizationAvatar: By.css(".secondary-nav .ui.floating.dropdown.jump span.text img.ui.avatar"),
    organizationName: By.css(".secondary-nav .text span.gt-ellipsis"),
  };

  private readonly baseLocators = [
    this.secondaryBarLocators.organizationDropdown,
    this.dropdownOrganizationLocators.organizationAvatar,
  ];

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getCurrentOrganization(): Promise<string> {
    return this.getText(this.secondaryBarLocators.organizationDropdown);
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

    const [usernameMatches, teamsDropdownAbsent, rightOptionsAbsent] = await Promise.all([
      this.getCurrentOrganization().then((text) => text === username),
      this.isVisible(this.secondaryBarLocators.teamsDropdown, this.driver, 0).then((v) => !v),
      this.isVisible(this.secondaryBarLocators.rightOptionsContainer, this.driver, 0).then(
        (v) => !v,
      ),
    ]);

    const results = { usernameMatches, teamsDropdownAbsent, rightOptionsAbsent };
    logger.info({ pageContext: "main", ...results }, "Navbar expectations");
    return Object.values(results).every(Boolean);
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

  async waitForElements(): Promise<void> {
    await this.isVisible(this.navigationBarLocators.navigationBarContainer);
    await this.isVisible(this.secondaryBarLocators.secondaryBarContainer);
  }

  async getDropdownOrganizationsList(): Promise<string[]> {
    const organizationsLocator: By = By.css(":scope > *");
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
}
