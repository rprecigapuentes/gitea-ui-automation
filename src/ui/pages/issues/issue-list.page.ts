import { By, WebDriver, until } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { labelIdFromHref } from "./fragments/label-chip.fragment";

const WAIT_TIMEOUT_MS = 10000;

/**
 * The milestone filter carries no identifier of its own, so an item is addressed by the query it
 * navigates to. Both forms are needed because Gitea sorts the query parameters: the milestone can
 * be the last one or be followed by another.
 */
const milestoneQuery = (milestoneId: number): string =>
  `a.item[href*="milestone=${milestoneId}&"], a.item[href$="milestone=${milestoneId}"]`;

export class IssueListPage extends BasePage {
  private readonly locators = {
    rows: By.css("#issue-list > .item"),
    rowTitle: By.css("a.list-item-large-title"),
    rowLabels: By.css(".labels-list a.item"),
    filterDropdown: By.css(".label-filter"),
    filterItem: (labelId: number) =>
      By.css(`.label-filter a.item.label-filter-query-item[data-label-id="${labelId}"]`),
    milestoneFilterDropdown: (milestoneId: number) =>
      By.css(`#issue-filters .ui.dropdown:has(${milestoneQuery(milestoneId)})`),
    milestoneFilterItem: (milestoneId: number) =>
      By.css(
        `#issue-filters .ui.dropdown a.item[href*="milestone=${milestoneId}&"], #issue-filters .ui.dropdown a.item[href$="milestone=${milestoneId}"]`,
      ),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/issues`;
  }

  async filterByLabel(labelId: number): Promise<void> {
    await this.click(this.locators.filterDropdown);
    await this.click(this.locators.filterItem(labelId));
    await this.driver.wait(until.urlContains(`labels=${labelId}`), WAIT_TIMEOUT_MS);
  }

  /**
   * Call it on a freshly opened list. Every other filter builds its links from the query already
   * applied, so a milestone that is already active appears in their hrefs too and the item stops
   * being unique.
   */
  async filterByMilestone(milestoneId: number): Promise<void> {
    await this.click(this.locators.milestoneFilterDropdown(milestoneId));
    await this.click(this.locators.milestoneFilterItem(milestoneId));
    await this.driver.wait(
      until.urlMatches(new RegExp(`milestone=${milestoneId}(&|$)`)),
      WAIT_TIMEOUT_MS,
    );
  }

  /** Gitea encodes "issues carrying no milestone at all" as milestone id -1. */
  async filterByNoMilestone(): Promise<void> {
    await this.filterByMilestone(-1);
  }

  async getIssueTitles(): Promise<string[]> {
    const rows = await this.driver.findElements(this.locators.rows);

    return Promise.all(
      rows.map(async (row) => (await row.findElement(this.locators.rowTitle)).getText()),
    );
  }

  async getLabelIdsOf(title: string): Promise<number[]> {
    for (const row of await this.driver.findElements(this.locators.rows)) {
      const rowTitle = await (await row.findElement(this.locators.rowTitle)).getText();

      if (rowTitle !== title) continue;

      const links = await row.findElements(this.locators.rowLabels);
      const hrefs = await Promise.all(links.map((link) => link.getAttribute("href")));

      return hrefs.map(labelIdFromHref).filter((id): id is number => id !== null);
    }

    throw new Error(`no issue titled "${title}" in the list`);
  }
}
