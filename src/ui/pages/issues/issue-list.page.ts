import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";

export class IssueListPage extends BasePage {
  private readonly locators = {
    issueTitles: By.css("#issue-list a.list-item-large-title"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string, labelId?: number): string {
    const issues = `${baseUrl}/${owner}/${repository}/issues`;

    return labelId === undefined ? issues : `${issues}?labels=${labelId}`;
  }

  async getIssueTitles(): Promise<string[]> {
    const titles = await this.driver.findElements(this.locators.issueTitles);

    return Promise.all(titles.map((title) => title.getText()));
  }
}
