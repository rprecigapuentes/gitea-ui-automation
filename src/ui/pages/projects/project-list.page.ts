import { By, WebDriver, WebElement, until } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";

const WAIT_TIMEOUT_MS = 10000;

/**
 * The project list reuses the milestone list markup, comment included in Gitea's own template, so
 * a row is read the same way a milestone row is. A project is identified by the id in the link of
 * its row, which is the same id the board URL carries.
 */
export class ProjectListPage extends BasePage {
  private readonly locators = {
    rows: By.css(".milestone-list > .item"),
    rowLink: By.css(".list-item-large-title a"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(organization: string): string {
    return `${baseUrl}/${organization}/-/projects`;
  }

  private async findRowLink(title: string): Promise<WebElement | null> {
    try {
      for (const row of await this.driver.findElements(this.locators.rows)) {
        const link = await row.findElement(this.locators.rowLink);

        if ((await link.getText()) === title) return link;
      }
    } catch {
      return null;
    }

    return null;
  }

  async waitForProject(title: string): Promise<number> {
    await this.driver.wait(
      async () => (await this.findRowLink(title)) !== null,
      WAIT_TIMEOUT_MS,
      `the project "${title}" never appeared in the project list`,
    );

    const link = await this.findRowLink(title);

    if (!link) throw new Error(`the project "${title}" left the list while it was being read`);

    return Number(((await link.getAttribute("href")) ?? "").split("/").at(-1));
  }

  async openProject(title: string): Promise<number> {
    const projectId = await this.waitForProject(title);
    const link = await this.findRowLink(title);

    if (!link) throw new Error(`the project "${title}" left the list while it was being opened`);

    await link.click();
    await this.driver.wait(
      until.urlMatches(new RegExp(`/-/projects/${projectId}$`)),
      WAIT_TIMEOUT_MS,
      `the browser never landed on the board of "${title}"`,
    );

    return projectId;
  }
}
