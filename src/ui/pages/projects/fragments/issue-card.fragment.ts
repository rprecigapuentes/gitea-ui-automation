import { By, WebDriver, WebElement } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";

/**
 * A card only means anything inside the column that holds it, so the fragment takes its root
 * element and is constructed per read, the same way the label chip is.
 */
export class IssueCardFragment extends BaseComponent {
  private readonly locators = {
    title: By.css("a.issue-card-title"),
    meta: By.css(".meta"),
  };

  constructor(
    driver: WebDriver,
    private readonly root: WebElement,
  ) {
    super(driver);
  }

  async getIssueId(): Promise<number> {
    return Number(await this.root.getAttribute("data-issue"));
  }

  async getTitle(): Promise<string> {
    return (await this.findElement(this.locators.title, this.root)).getText();
  }

  /**
   * Gitea prints the full name of the repository before the index only when the board is not
   * scoped to one repository, so this string is what tells an organization project apart from a
   * repository project.
   */
  async getRepositoryRef(): Promise<string> {
    const meta = await this.findElement(this.locators.meta, this.root);

    return (await meta.getText()).split(/\s+/)[0].split("#")[0];
  }
}
