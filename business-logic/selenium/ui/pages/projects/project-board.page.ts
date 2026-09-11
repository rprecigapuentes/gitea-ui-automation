import { By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { ProjectColumnFragment } from "./fragments/project-column.fragment";

const board = "#project-board";

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
    const titles = await this.driver.findElements(this.locators.columnTitles);

    return Promise.all(titles.map(async (title) => (await title.getText()).trim()));
  }

  async getDefaultColumnTitle(): Promise<string> {
    return ProjectColumnFragment.default(this.driver).getTitle();
  }

  async getDefaultColumnIssueCount(): Promise<number> {
    return ProjectColumnFragment.default(this.driver).getIssueCount();
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

  async addColumn(title: string): Promise<void> {
    await this.click(this.locators.newColumnButton);
    // The modal is shared with column editing, so it can arrive holding another title.
    const titleInput = await this.findElement(this.locators.columnModalTitle);
    await titleInput.clear();
    await titleInput.sendKeys(title);
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

  private column(title: string): ProjectColumnFragment {
    return ProjectColumnFragment.byTitle(this.driver, title);
  }
}
