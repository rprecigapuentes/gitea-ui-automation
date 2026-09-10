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

  protected override getReadyLocators(): By[] {
    return [
      this.barOptionsLocators.organizationDropdown,
      this.dropdownOrganizationLocators.organizationAvatar,
    ];
  }

  override async isVisible(
    username: string,
    pageContext: "main" | "organization" = "main",
  ): Promise<boolean> {
    // The main-page branch asserts absence, and an element that has not rendered yet is absent
    // too, so the bar has to be confirmed present before that branch is allowed to run.
    const readyElementsExist = await super.isVisible();

    if (!readyElementsExist) {
      logger.info({ pageContext, readyElementsExist }, "Navbar expectations");
      return false;
    }

    const [usernameMatches, [teamsDropdownMatchesContext, rightOptionsContainerMatchesContext]] =
      await Promise.all([
        this.getCurrentOrganization().then((text) => text === username),
        pageContext === "main"
          ? Promise.all([
              this.doesNotExist(this.barOptionsLocators.teamsDropdown),
              this.doesNotExist(this.barOptionsLocators.rightOptionsContainer),
            ])
          : Promise.all([
              this.exists(this.barOptionsLocators.teamsDropdown),
              this.exists(this.barOptionsLocators.rightOptionsContainer),
            ]),
      ]);

    const results = {
      readyElementsExist,
      usernameMatches,
      teamsDropdownMatchesContext,
      rightOptionsContainerMatchesContext,
    };
    logger.info({ pageContext, ...results }, "Navbar expectations");

    return Object.values(results).every(Boolean);
  }

  async getViewOrganizationButtonText(): Promise<string> {
    return this.getAttribute(this.barOptionsLocators.viewOrganizationButton, "title");
  }

  async clickViewOrganizationButton(): Promise<void> {
    await this.click(this.barOptionsLocators.viewOrganizationButton);
  }
}
