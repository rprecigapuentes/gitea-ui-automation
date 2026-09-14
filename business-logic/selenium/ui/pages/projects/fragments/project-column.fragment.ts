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
    cards: By;
    card: (issueId: number) => By;
    anyCard: By;
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
      // A card is dropped into the list, not onto the column: the column root is outside it.
      cards: By.css(`${root} .cards`),
      card: (issueId: number) => By.css(`${root} .issue-card[data-issue="${issueId}"]`),
      anyCard: By.css(`${root} .cards .issue-card`),
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

  /** Instant check, for a caller reading a board it has just re-read. */
  async holdsIssueNow(issueId: number): Promise<boolean> {
    return this.isVisible(this.locators.card(issueId), this.driver, INSTANT);
  }

  /** The drop target of a drag, handed out as a locator so the drag resolves it when it runs. */
  getCardsLocator(): By {
    return this.locators.cards;
  }

  async getCardIssueIds(): Promise<number[]> {
    // An empty column has no card to find, which is an answer rather than a failure.
    const cards = await this.findElements(this.locators.anyCard, this.driver, INSTANT).catch(
      () => [],
    );

    return Promise.all(cards.map(async (card) => Number(await card.getAttribute("data-issue"))));
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
