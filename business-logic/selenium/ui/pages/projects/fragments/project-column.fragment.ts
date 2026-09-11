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
      // The set-default item beside it is a link-action too; the HTTP method is what tells the
      // two apart without reading their translated text.
      deleteItem: By.css(`${root} .menu a.link-action[data-fetch-method="DELETE"]`),
      card: (issueId: number) => By.css(`${root} .issue-card[data-issue="${issueId}"]`),
    };
  }

  /**
   * A column carries its own title as an attribute of its edit item, which is the only place the
   * title is readable without depending on rendered text.
   */
  static byTitle(driver: WebDriver, title: string): ProjectColumnFragment {
    return new ProjectColumnFragment(
      driver,
      `.project-column:has([data-modal-project-column-title-input="${title}"])`,
    );
  }

  /** Only the default column's title carries the tooltip attribute that explains what it is. */
  static default(driver: WebDriver): ProjectColumnFragment {
    return new ProjectColumnFragment(
      driver,
      ".project-column:has(.project-column-title-text[data-tooltip-content])",
    );
  }

  async isVisibleOnBoard(): Promise<boolean> {
    return this.isVisible(this.locators.column);
  }

  /** For a caller that has already confirmed the board and is asking whether the column is gone. */
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

  async openMenu(): Promise<void> {
    // Clicking the trigger of an open menu closes it, so an already-open menu is left alone.
    if (await this.isVisible(this.locators.editItem, this.driver, INSTANT)) return;

    await this.click(this.locators.menuTrigger);
    // Every column offers editing, so its edit item is what says the menu finished opening.
    await this.findElement(this.locators.editItem);
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
}
