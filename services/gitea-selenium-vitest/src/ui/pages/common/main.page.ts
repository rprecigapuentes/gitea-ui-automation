import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/config/gitea.config";

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

  protected getReadyLocators(): By[] {
    const readyLocators = [this.locators.dashboardRepoList];
    return readyLocators;
  }

  async hasExpectedElementsDisplayed(): Promise<boolean> {
    const root = await this.findElement(this.locators.dashboardRepoList);
    const results = await Promise.all([
      this.getText(this.locators.repositoryOption, root).then((text) => text === "Repository"),
      this.getText(this.locators.organizationOption, root).then((text) => text === "Organization"),
      this.getAttribute(this.locators.repositoryOption, "class", root).then((classValue) =>
        classValue.includes("active"),
      ),
    ]);
    return results.every(Boolean);
  }
}
