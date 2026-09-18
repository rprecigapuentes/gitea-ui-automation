import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { ProjectColumnFragment } from "./fragments/project-column.fragment";

const board = "#project-board";
const PERSISTED_TIMEOUT_MS = 10000;

export class ProjectBoardPage extends BasePage {
  private readonly locators = {
    board: board,
    columnTitles: `${board} .project-column-title-text`,
    // Every column edit item carries the same class, so the header is what narrows it.
    newColumnButton: ".project-header button.show-project-column-modal-edit",
    columnModalTitle: "#project-column-title-input",
    columnModalSave: "#project-column-modal-edit .project-column-button-save",
    // Gitea builds this modal on demand for a link-action.
    confirmButton: ".g-modal-confirm.modal .ui.primary.ok.button",
    card: (issueId: number) => `${board} .issue-card[data-issue="${issueId}"]`,
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
    return ProjectColumnFragment.default(this.strategy).getTitle();
  }

  async getDefaultColumnIssueCount(): Promise<number> {
    return ProjectColumnFragment.default(this.strategy).getIssueCount();
  }

  async getColumnIssueCount(title: string): Promise<number> {
    return this.column(title).getIssueCount();
  }

  async getDefaultColumnCardIssueIds(): Promise<number[]> {
    return ProjectColumnFragment.default(this.strategy).getCardIssueIds();
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
    return ProjectColumnFragment.default(this.strategy).holdsIssue(issueId);
  }

  async columnHoldsIssue(title: string, issueId: number): Promise<boolean> {
    return this.column(title).holdsIssue(issueId);
  }

  async addColumn(title: string): Promise<void> {
    await this.click(this.locators.newColumnButton);
    // The modal is shared with column editing, so it can arrive holding another title.
    await this.clearAndType(this.locators.columnModalTitle, title);
    await this.click(this.locators.columnModalSave);
  }

  async makeColumnDefault(title: string): Promise<void> {
    await this.column(title).clickSetAsDefault();
    await this.click(this.locators.confirmButton);
  }

  async deleteColumn(title: string): Promise<void> {
    await this.column(title).clickDelete();
    await this.click(this.locators.confirmButton);
  }

  /**
   * The gesture goes first, as the only path through the browser input stack. On Firefox it
   * completes without reaching the server, so what decides is not where the card sits but whether a
   * reloaded board still holds it.
   */
  async moveCard(issueId: number, toColumnTitle: string): Promise<void> {
    const cards = this.column(toColumnTitle).getCardsLocator();

    await this.dragAndDrop(this.locators.card(issueId), cards);

    if (await this.keptCardIn(toColumnTitle, issueId)) return;

    logger.warn(
      { issueId, column: toColumnTitle },
      "The drag gesture did not reach the server; dispatching the drag as its events",
    );
    await this.actAndWaitUntil(
      () => this.dispatchDragEvents(this.locators.card(issueId), cards),
      () => this.keptCardIn(toColumnTitle, issueId),
      PERSISTED_TIMEOUT_MS,
    );
  }

  /** A single drag, then one re-read of the board — no retry, for a caller whose drag already
   *  lands in one gesture and only wants to know whether the server kept it. */
  async dragCardOnto(issueId: number, toColumnTitle: string): Promise<boolean> {
    const cards = this.column(toColumnTitle).getCardsLocator();

    await this.dragAndDrop(this.locators.card(issueId), cards);
    await this.reload([this.locators.board]);

    return this.column(toColumnTitle).holdsIssueNow(issueId);
  }

  /** Reads the board again, so the answer is the state Gitea kept and not the one the drop left. */
  private async keptCardIn(title: string, issueId: number): Promise<boolean> {
    await this.reload([this.locators.board]);

    return this.column(title).holdsIssueNow(issueId);
  }

  private column(title: string): ProjectColumnFragment {
    return ProjectColumnFragment.byTitle(this.strategy, title);
  }
}
