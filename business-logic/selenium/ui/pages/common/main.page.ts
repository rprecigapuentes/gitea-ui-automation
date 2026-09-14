import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export class MainPage extends BasePage {
  private readonly locators = {
    dashboardRepoList: By.css("#dashboard-repo-list"),
    repositoryOption: By.css(".ui.two.item.menu a.item:nth-of-type(1)"),
    organizationOption: By.css("#dashboard-repo-list .ui.two.item.menu a.item:nth-of-type(2)"),
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async open(): Promise<void> {
    await super.open([this.locators.dashboardRepoList]);
  }

  async hasExpectedElementsDisplayed(): Promise<boolean> {
    if (!(await this.isVisible(this.locators.dashboardRepoList))) {
      return false;
    }

    try {
      await this.actAndWaitUntil(
        async () => {
          await this.findElement(this.locators.dashboardRepoList);
        },
        () => this.tabsSettled(),
      );
    } catch {
      return false;
    }

    return true;
  }

  // The dashboard's Repository/Organization toggle is a Vue component (data-v-* attributes);
  // its active class and label text can still be mid-hydration a moment after the outer
  // container itself is already visible, so read it through a poll, not a single snapshot.
  private async tabsSettled(): Promise<boolean> {
    const root = await this.findElement(this.locators.dashboardRepoList);
    const [repositoryLabel, organizationLabel, repositoryClass] = await Promise.all([
      this.getText(this.locators.repositoryOption, root),
      this.getText(this.locators.organizationOption, root),
      this.getAttribute(this.locators.repositoryOption, "class", root),
    ]);
    return (
      repositoryLabel === "Repository" &&
      organizationLabel === "Organization" &&
      repositoryClass.includes("active")
    );
  }
}
