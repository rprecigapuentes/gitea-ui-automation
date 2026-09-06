import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { ProjectColumnFragment } from "./fragments/project-column.fragment";
import { simulateHtml5Drag } from "../../../../core/utils/html5-drag.util";

const WAIT_TIMEOUT_MS = 10000;

export class ProjectBoardPage extends BasePage {
  private readonly locators = {
    board: By.css("#project-board"),
    writableBoard: By.css('#project-board[data-project-board-writable="true"]'),
    columns: By.css("#project-board .project-column"),
    columnTitle: By.css(".project-column-title-text"),
    card: (issueId: number) => By.css(`#project-board .issue-card[data-issue="${issueId}"]`),
    cardInColumn: (columnId: number, issueId: number) =>
      By.css(
        `#project-board .project-column[data-id="${columnId}"] .cards .issue-card[data-issue="${issueId}"]`,
      ),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(organization: string, projectId: number): string {
    return `${baseUrl}/${organization}/-/projects/${projectId}`;
  }

  async getColumnTitles(): Promise<string[]> {
    const columns = await this.findElements(this.locators.columns);

    return Promise.all(
      columns.map(async (column) =>
        (await column.findElement(this.locators.columnTitle)).getText(),
      ),
    );
  }

  /**
   * A column has no identifier a test can know beforehand, so it is looked up once by its title
   * and from then on addressed by the id Gitea gave it.
   */
  async column(title: string): Promise<ProjectColumnFragment> {
    for (const column of await this.findElements(this.locators.columns)) {
      const columnTitle = await (await column.findElement(this.locators.columnTitle)).getText();

      if (columnTitle !== title) continue;

      return new ProjectColumnFragment(this.driver, Number(await column.getAttribute("data-id")));
    }

    throw new Error(`no column titled "${title}" on the board`);
  }

  async isWritable(): Promise<boolean> {
    return (await this.driver.findElements(this.locators.writableBoard)).length > 0;
  }

  /** Reloads first, so the answer is the state Gitea kept and not the DOM the drop rewrote. */
  private async isPersistedIn(columnId: number, issueId: number): Promise<boolean> {
    await this.reload();

    return (
      (await this.driver.findElements(this.locators.cardInColumn(columnId, issueId))).length > 0
    );
  }

  /**
   * The board is a SortableJS list initialised without `forceFallback`, so it runs on the browser's
   * own HTML5 drag events. The pointer gesture is performed first, because that is what a person
   * does: press on the card, cross the drag threshold with short offsets, travel to the target
   * column and release.
   *
   * That gesture completes on Chromium but not on Firefox, where geckodriver moves the card during
   * `dragover` and never emits the `drop` that finishes it: SortableJS never fires `onAdd`, no
   * request leaves the browser, and the card sits in the target column having changed nothing
   * (mozilla/geckodriver#1450). The card being there is therefore not the question; whether Gitea
   * kept it is, which is why the check reloads. When it was not kept, the same drag is dispatched
   * as its event sequence, the workaround the Selenium community settled on for HTML5 drag and
   * drop, which still runs the page's own drag handlers rather than moving the card another way.
   */
  async moveCard(issueId: number, toColumnTitle: string): Promise<void> {
    const targetColumn = await this.column(toColumnTitle);
    const card = await this.findElement(this.locators.card(issueId));
    const target = await this.findElement(targetColumn.getCardsLocator());

    await this.driver
      .actions()
      .move({ origin: card })
      .press()
      .pause(200)
      .move({ origin: card, x: 5, y: 5 })
      .move({ origin: card, x: 20, y: 20 })
      .move({ origin: target })
      .move({ origin: target, x: 0, y: 5 })
      .pause(200)
      .release()
      .perform();

    if (await this.isPersistedIn(targetColumn.columnId, issueId)) return;

    await simulateHtml5Drag(
      this.driver,
      await this.findElement(this.locators.card(issueId)),
      await this.findElement(targetColumn.getCardsLocator()),
    );

    await this.waitForPersistedCard(toColumnTitle, issueId);
  }

  async reload(): Promise<void> {
    await this.driver.navigate().refresh();
    await this.findElement(this.locators.board);
  }

  /**
   * The board is reloaded until the card is where it was dropped, so that everything asserted
   * afterwards is state Gitea persisted rather than the DOM the drop rewrote before its request
   * had even been sent.
   */
  async waitForPersistedCard(columnTitle: string, issueId: number): Promise<void> {
    await this.driver.wait(
      async () => {
        await this.reload();

        return (await (await this.column(columnTitle)).getCardIssueIds()).includes(issueId);
      },
      WAIT_TIMEOUT_MS,
      `the card of issue ${issueId} was never persisted in the column "${columnTitle}"`,
    );
  }
}
