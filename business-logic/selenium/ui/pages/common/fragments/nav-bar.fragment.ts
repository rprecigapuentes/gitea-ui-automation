import { By, WebDriver } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class NavBarFragment extends BaseComponent {
  private readonly barOptionsLocators = {
    rightOptionsContainer: By.css(".right.menu.tw-flex-wrap.tw-justify-end"),
    organizationDropdown: By.css(".secondary-nav .ui.floating.dropdown.jump:has(img.ui.avatar)"),
    teamsDropdown: By.css(".secondary-nav .ui.floating.dropdown.jump:has(svg.octicon-people)"),
    activitiesOption: By.css(".item.tw-ml-auto"),
    issuesOption: By.css("[aria-controls=_aria_dropdown_menu_16]"),
    pullRequestsOption: By.css("[aria-controls=_aria_dropdown_menu_17]"),
    milestonesOption: By.css("[aria-controls=_aria_dropdown_menu_18]"),
    viewOrganizationButton: By.css(".basic.button"),
  };

  private readonly dropdownOrganizationLocators = {
    organizationAvatar: By.css(".secondary-nav .ui.floating.dropdown.jump span.text img.ui.avatar"),
    organizationName: By.css(".secondary-nav .text span.gt-ellipsis"),
    menuOptions: By.css(".menu.context-user-switch.transition.visible"),
    scrollingMenu: By.css(".scrolling.menu"),
    totalOrganizations: By.css(".ui.avatar.tw-align-middle"),
    newOrganizationOption: By.css("a[href='/org/create']"),
  };

  private readonly baseLocators = [
    this.barOptionsLocators.organizationDropdown,
    this.dropdownOrganizationLocators.organizationAvatar,
  ];

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getCurrentOrganization(): Promise<string> {
    return this.getText(this.dropdownOrganizationLocators.organizationName);
  }

  async clickNewOrganizationOption(): Promise<void> {
    await this.click(
      this.dropdownOrganizationLocators.newOrganizationOption,
      await this.findElement(this.dropdownOrganizationLocators.menuOptions),
    );
  }

  async clickOrganizationsDropdown(): Promise<void> {
    const dropdown = await this.findElement(this.barOptionsLocators.organizationDropdown);
    const isOpen = (await dropdown.getAttribute("aria-expanded")) === "true";

    if (isOpen) {
      await dropdown.click();
      return;
    }

    const readyLocators = [this.dropdownOrganizationLocators.menuOptions];
    await this.clickAndWaitFor(this.barOptionsLocators.organizationDropdown, readyLocators);
  }

  async getTotalOrganizations(): Promise<string[]> {
    const organizationMenu = await this.findElement(this.dropdownOrganizationLocators.menuOptions);
    const scrollingMenu = await this.findElement(
      this.dropdownOrganizationLocators.scrollingMenu,
      organizationMenu,
    );
    const organizations = await this.findElements(
      this.dropdownOrganizationLocators.totalOrganizations,
      scrollingMenu,
    );
    return Promise.all(
      organizations.map(async (organization) => (await organization.getAttribute("title")) ?? ""),
    );
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
      this.isVisible(this.barOptionsLocators.teamsDropdown, this.driver, 0).then((v) => !v),
      this.isVisible(this.barOptionsLocators.rightOptionsContainer, this.driver, 0).then((v) => !v),
    ]);

    const results = { usernameMatches, teamsDropdownAbsent, rightOptionsAbsent };
    logger.info({ pageContext: "main", ...results }, "Navbar expectations");
    return Object.values(results).every(Boolean);
  }

  async isVisibleOnOrganizationPage(organizationName: string): Promise<boolean> {
    if (!(await this.isVisible(this.baseLocators))) {
      logger.info({ pageContext: "organization" }, "Navbar not ready");
      return false;
    }

    const [usernameMatches, teamsDropdownVisible, rightOptionsVisible] = await Promise.all([
      this.getCurrentOrganization().then((text) => text === organizationName),
      this.isVisible(this.barOptionsLocators.teamsDropdown),
      this.isVisible(this.barOptionsLocators.rightOptionsContainer),
    ]);

    const results = { usernameMatches, teamsDropdownVisible, rightOptionsVisible };
    logger.info({ pageContext: "organization", ...results }, "Navbar expectations");
    return Object.values(results).every(Boolean);
  }

  async getViewOrganizationButtonText(): Promise<string> {
    return this.getAttribute(this.barOptionsLocators.viewOrganizationButton, "title");
  }

  async clickViewOrganizationButton(): Promise<void> {
    await this.click(this.barOptionsLocators.viewOrganizationButton);
  }
}
