import { By, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

const INSTANT = 0;

export class ProjectColumnFragment extends BaseComponent {
  private readonly locators: {
    column: By;
    title: By;
    issueCount: By;
    menuTrigger: By;
    editItem: By;
    setDefaultItem: By;
    deleteItem: By;
    card: (issueId: number) => By;
  };

  private constructor(driver: WebDriver, root: string) {
    super(driver);
    this.locators = {
      column: By.css(root),
      title: By.css(`${root} .project-column-title-text`),
      issueCount: By.css(`${root} .project-column-issue-count`),
      menuTrigger: By.css(`${root} .project-column-header .ui.dropdown`),
      editItem: By.css(`${root} .menu a.item.show-project-column-modal-edit`),
      setDefaultItem: By.css(`${root} .menu a.link-action[data-url$="/default"]`),
      // The set-default item beside it is a link-action too; the method is what tells them apart.
      deleteItem: By.css(`${root} .menu a.link-action[data-fetch-method="DELETE"]`),
      card: (issueId: number) => By.css(`${root} .issue-card[data-issue="${issueId}"]`),
    };
  }

  /** A column title is only readable as an attribute of that column's edit item. */
  static byTitle(driver: WebDriver, title: string): ProjectColumnFragment {
    return new ProjectColumnFragment(
      driver,
      `.project-column:has([data-modal-project-column-title-input="${title}"])`,
    );
  }

  /** Only the default column's title carries the tooltip attribute. */
  static default(driver: WebDriver): ProjectColumnFragment {
    return new ProjectColumnFragment(
      driver,
      ".project-column:has(.project-column-title-text[data-tooltip-content])",
    );
  }

  async isVisibleOnBoard(): Promise<boolean> {
    return this.isVisible(this.locators.column);
  }

  /** Instant check, for a caller that has already confirmed the board. */
  async isVisibleOnBoardNow(): Promise<boolean> {
    return this.isVisible(this.locators.column, this.driver, INSTANT);
  }

  async getTitle(): Promise<string> {
    return (await this.getText(this.locators.title)).trim();
  }

  async getIssueCount(): Promise<number> {
    return Number((await this.getText(this.locators.issueCount)).trim());
  }

  async holdsIssue(issueId: number): Promise<boolean> {
    return this.isVisible(this.locators.card(issueId));
  }

  async offersDelete(): Promise<boolean> {
    await this.openMenu();

    return this.isVisible(this.locators.deleteItem, this.driver, INSTANT);
  }

  async clickDelete(): Promise<void> {
    await this.openMenu();
    await this.click(this.locators.deleteItem);
  }

  async clickSetAsDefault(): Promise<void> {
    await this.openMenu();
    await this.click(this.locators.setDefaultItem);
  }

  private async openMenu(): Promise<void> {
    // Clicking the trigger of an open menu would close it.
    if (await this.isVisible(this.locators.editItem, this.driver, INSTANT)) return;

    await this.click(this.locators.menuTrigger);
    await this.findElement(this.locators.editItem);
  }
}
