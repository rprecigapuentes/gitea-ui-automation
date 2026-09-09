import { By, WebDriver, WebElement } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { MilestoneRow } from "../../../api/entities/milestone.entity";

const WAIT_TIMEOUT_MS = 10000;

const firstNumberIn = (text: string): number => Number(text.replace(/\D/g, ""));

export class MilestoneListPage extends BasePage {
  private readonly locators = {
    rows: By.css(".milestone-list > .item"),
    rowName: By.css(".list-item-large-title a"),
    rowProgress: By.css("progress.list-item-title-progress"),
    rowCounters: By.css(".list-item-secondary-bar .flex-text-inline"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/milestones`;
  }

  private async readRow(row: WebElement): Promise<MilestoneRow> {
    const progress = await row.findElement(this.locators.rowProgress);
    const counters = await row.findElements(this.locators.rowCounters);
    const [openIssues, closedIssues] = await Promise.all(
      counters.slice(0, 2).map(async (counter) => firstNumberIn(await counter.getText())),
    );

    return {
      name: await (await row.findElement(this.locators.rowName)).getText(),
      completeness: Number(await progress.getAttribute("value")),
      openIssues,
      closedIssues,
    };
  }

  async findRow(name: string): Promise<MilestoneRow | null> {
    try {
      for (const row of await this.driver.findElements(this.locators.rows)) {
        const read = await this.readRow(row);

        if (read.name === name) return read;
      }
    } catch {
      return null;
    }

    return null;
  }

  async waitForRow(name: string): Promise<MilestoneRow> {
    await this.driver.wait(
      async () => (await this.findRow(name)) !== null,
      WAIT_TIMEOUT_MS,
      `the milestone "${name}" never appeared in the milestone list`,
    );

    const row = await this.findRow(name);

    if (!row) throw new Error(`the milestone "${name}" left the list while it was being read`);

    return row;
  }
}
