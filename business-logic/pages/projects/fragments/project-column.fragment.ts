import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";

// A timeout of 0 checks once, now, instead of waiting for the element.
const INSTANT = 0;
const MENU_TIMEOUT_MS = 5000;

export class ProjectColumnFragment extends BaseComponent {
  private readonly locators: {
    column: string;
    title: string;
    defaultTitle: string;
    issueCount: string;
    menuTrigger: string;
    editItem: string;
    setDefaultItem: string;
    deleteItem: string;
    cards: string;
    card: (issueId: number) => string;
    anyCard: string;
  };

  private constructor(strategy: IInteractionStrategy, root: string) {
    super(strategy);
    this.locators = {
      column: root,
      title: `${root} .project-column-title-text`,
      defaultTitle: `${root} .project-column-title-text[data-tooltip-content]`,
      issueCount: `${root} .project-column-issue-count`,
      menuTrigger: `${root} .project-column-header .ui.dropdown`,
      editItem: `${root} .menu a.item.show-project-column-modal-edit`,
      setDefaultItem: `${root} .menu a.link-action[data-url$="/default"]`,
      // The set-default item beside it is a link-action too; the method is what tells them apart.
      deleteItem: `${root} .menu a.link-action[data-fetch-method="DELETE"]`,
      // A card is dropped into the list, not onto the column: the column root is outside it.
      cards: `${root} .cards`,
      card: (issueId: number) => `${root} .issue-card[data-issue="${issueId}"]`,
      anyCard: `${root} .cards .issue-card`,
    };
  }

  /** A column title is only readable as an attribute of that column's edit item. */
  static byTitle(strategy: IInteractionStrategy, title: string): ProjectColumnFragment {
    return new ProjectColumnFragment(
      strategy,
      `.project-column:has([data-modal-project-column-title-input="${title}"])`,
    );
  }

  /** Only the default column's title carries the tooltip attribute. */
  static default(strategy: IInteractionStrategy): ProjectColumnFragment {
    return new ProjectColumnFragment(
      strategy,
      ".project-column:has(.project-column-title-text[data-tooltip-content])",
    );
  }

  async isVisibleOnBoard(): Promise<boolean> {
    return this.isVisible(this.locators.column);
  }

  /** Instant check, for a caller that has already confirmed the board. */
  async isVisibleOnBoardNow(): Promise<boolean> {
    return this.isVisible(this.locators.column, undefined, INSTANT);
  }

  /** Instant check, for a caller waiting on a board that is reloading itself. */
  async isDefaultNow(): Promise<boolean> {
    return this.isVisible(this.locators.defaultTitle, undefined, INSTANT);
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
    return this.isVisible(this.locators.card(issueId), undefined, INSTANT);
  }

  /** The drop target of a drag, handed out as a locator so the drag resolves it when it runs. */
  getCardsLocator(): string {
    return this.locators.cards;
  }

  async getCardIssueIds(): Promise<number[]> {
    // An empty column has no card to find, which is an answer rather than a failure.
    const cards = await this.findElements(this.locators.anyCard, undefined, INSTANT).catch(
      () => [],
    );

    return Promise.all(cards.map(async (card) => Number(await card.getAttribute("data-issue"))));
  }

  async offersDelete(): Promise<boolean> {
    await this.openMenu();

    return this.isVisible(this.locators.deleteItem, undefined, INSTANT);
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
    if (await this.isVisible(this.locators.editItem, undefined, INSTANT)) return;

    // A column the board had to scroll into view swallows the first click on its trigger: the menu
    // stays closed while its items stay in the DOM without a box, so a later click on one waits on
    // an invisible element instead of failing. The menu being open is what says the click landed.
    await this.waitFor(
      async () => {
        await this.click(this.locators.menuTrigger);
        return this.isVisible(this.locators.editItem, undefined, INSTANT);
      },
      MENU_TIMEOUT_MS,
      "The column menu never opened",
    );
  }
}
