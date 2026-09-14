import { By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { ProjectColumnFragment } from "./fragments/project-column.fragment";

const board = "#project-board";
const PERSISTED_TIMEOUT_MS = 10000;

export class ProjectBoardPage extends BasePage {
  private readonly locators = {
    board: By.css(board),
    columnTitles: By.css(`${board} .project-column-title-text`),
    // Every column edit item carries the same class, so the header is what narrows it.
    newColumnButton: By.css(".project-header button.show-project-column-modal-edit"),
    columnModalTitle: By.css("#project-column-title-input"),
    columnModalSave: By.css("#project-column-modal-edit .project-column-button-save"),
    // Gitea builds this modal on demand for a link-action.
    confirmButton: By.css(".g-modal-confirm.modal .ui.primary.ok.button"),
    card: (issueId: number) => By.css(`${board} .issue-card[data-issue="${issueId}"]`),
  };

  override getUrl(owner: string, projectId: number): string {
    return `${baseUrl}/${owner}/-/projects/${projectId}`;
  }

  async openFor(owner: string, projectId: number): Promise<void> {
    await super.open([this.locators.board], owner, projectId);
  }

  async isBoardVisible(): Promise<boolean> {
    return this.isVisible(this.locators.board);
  }

  async isColumnVisible(title: string): Promise<boolean> {
    return this.column(title).isVisibleOnBoard();
  }

  async columnOffersDelete(title: string): Promise<boolean> {
    return this.column(title).offersDelete();
  }

  async getColumnTitles(): Promise<string[]> {
    const titles = await this.findElements(this.locators.columnTitles);

    return Promise.all(titles.map(async (title) => (await title.getText()).trim()));
  }

  async getDefaultColumnTitle(): Promise<string> {
    return ProjectColumnFragment.default(this.driver).getTitle();
  }

  async getDefaultColumnIssueCount(): Promise<number> {
    return ProjectColumnFragment.default(this.driver).getIssueCount();
  }

  async getColumnIssueCount(title: string): Promise<number> {
    return this.column(title).getIssueCount();
  }

  async getDefaultColumnCardIssueIds(): Promise<number[]> {
    return ProjectColumnFragment.default(this.driver).getCardIssueIds();
  }

  async getColumnCardIssueIds(title: string): Promise<number[]> {
    return this.column(title).getCardIssueIds();
  }

  // A column that has not rendered looks exactly like one that is gone, so the board comes first.
  async boardHidesColumn(title: string): Promise<boolean> {
    if (!(await this.isBoardVisible())) return false;

    return !(await this.column(title).isVisibleOnBoardNow());
  }

  async defaultColumnHoldsIssue(issueId: number): Promise<boolean> {
    return ProjectColumnFragment.default(this.driver).holdsIssue(issueId);
  }

  async columnHoldsIssue(title: string, issueId: number): Promise<boolean> {
    return this.column(title).holdsIssue(issueId);
  }

  /**
   * The gesture is performed first, because that is what a person does and it is the only path that
   * goes through the browser input stack. It completes on Chromium but not on Firefox, where the
   * card ends up under the target column having changed nothing, so the card being there is not the
   * question: whether Gitea kept it is, and the answer comes from a board read again from the
   * server. When it was not kept, the same drag is dispatched as its event sequence, which still
   * runs the board's own drag handlers rather than moving the card by another route.
   */
  async moveCard(issueId: number, toColumnTitle: string): Promise<void> {
    const cards = this.column(toColumnTitle).getCardsLocator();

    await this.dragAndDrop(this.locators.card(issueId), cards);

    if (await this.keptCardIn(toColumnTitle, issueId)) return;

    logger.warn(
      { issueId, column: toColumnTitle },
      "The drag gesture did not reach the server; dispatching the drag as its events",
    );
    await this.dispatchDragEvents(this.locators.card(issueId), cards);
    await this.waitUntil(
      () => this.keptCardIn(toColumnTitle, issueId),
      `The card of issue ${issueId} never reached the column "${toColumnTitle}"`,
      PERSISTED_TIMEOUT_MS,
    );
  }

  /** Reads the board again, so the answer is the state Gitea kept and not the one the drop left. */
  private async keptCardIn(title: string, issueId: number): Promise<boolean> {
    await this.reload([this.locators.board]);

    return this.column(title).holdsIssueNow(issueId);
  }

  private column(title: string): ProjectColumnFragment {
    return ProjectColumnFragment.byTitle(this.driver, title);
  }
}
