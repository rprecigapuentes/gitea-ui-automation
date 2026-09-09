import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/config/gitea.config";

export class MainPage extends BasePage {
  private readonly locators = {
    dashboardRepoList: By.css("#dashboard-repo-list"),
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async waitUntilLoaded(): Promise<void> {
    await this.findElement(this.locators.dashboardRepoList);
  }
}
