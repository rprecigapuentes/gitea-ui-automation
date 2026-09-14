import { By, WebDriver } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

const INSTANT = 0;
// Same budget reason as MainPage: a missed INSTANT read costs the 3s implicit wait, and the CI
// grid renders the bar later than local, so the settle wait needs room for several attempts.
const SETTLE_TIMEOUT_MS = 20000;

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

  async getCurrentOrganization(timeoutMs?: number): Promise<string> {
    return this.getText(this.secondaryBarLocators.organizationDropdown, this.driver, timeoutMs);
  }

  async clickNewOrganizationDropdownOption(): Promise<void> {
    await this.click(this.dropdownOrganizationLocators.newOrganizationOption);
  }

  async clickOrganizationsDropdown(): Promise<void> {
    const readyLocators = [this.dropdownOrganizationLocators.menuOptionsContainer];
    await this.clickAndWaitFor(this.secondaryBarLocators.organizationDropdown, readyLocators);
  }

  // The base pair has to resolve before the username read is safe (it reads a locator that only
  // renders once the bar itself is up), so it short-circuits rather than joining the rest.
  private async readMainPageExpectations(username: string): Promise<Record<string, boolean>> {
    if (!(await this.isVisible(this.baseLocators, this.driver, INSTANT))) {
      return {
        navbarReady: false,
        usernameMatches: false,
        teamsDropdownAbsent: false,
        rightOptionsAbsent: false,
      };
    }

    const usernameMatches = await this.getCurrentOrganization(INSTANT)
      .then((text) => text === username)
      .catch(() => false);

    return {
      navbarReady: true,
      usernameMatches,
      teamsDropdownAbsent: !(await this.isVisible(
        this.secondaryBarLocators.teamsDropdown,
        this.driver,
        INSTANT,
      )),
      rightOptionsAbsent: !(await this.isVisible(
        this.secondaryBarLocators.rightOptionsContainer,
        this.driver,
        INSTANT,
      )),
    };
  }

  async isVisibleOnMainPage(username: string): Promise<boolean> {
    let results: Record<string, boolean> = {};

    const settled = await this.waitUntil(async () => {
      results = await this.readMainPageExpectations(username);
      return Object.values(results).every(Boolean);
    }, SETTLE_TIMEOUT_MS);

    logger.info({ pageContext: "main", ...results }, "Navbar expectations");
    return settled;
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

  async waitForElements(): Promise<boolean> {
    return this.isVisible([
      this.navigationBarLocators.navigationBarContainer,
      this.secondaryBarLocators.secondaryBarContainer,
    ]);
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
