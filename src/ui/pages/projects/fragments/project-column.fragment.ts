import { By, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { IssueCardFragment } from "./issue-card.fragment";

/**
 * The fragment holds the column id rather than its root element, so it re-locates on every call
 * and survives the board being reloaded, which every assertion here does on purpose.
 */
export class ProjectColumnFragment extends BaseComponent {
  private readonly root: string;

  private readonly locators: {
    title: By;
    issueCount: By;
    cards: By;
    card: By;
  };

  constructor(
    driver: WebDriver,
    readonly columnId: number,
  ) {
    super(driver);
    this.root = `#project-board .project-column[data-id="${columnId}"]`;
    this.locators = {
      title: By.css(`${this.root} .project-column-title-text`),
      issueCount: By.css(`${this.root} .project-column-issue-count`),
      cards: By.css(`${this.root} .cards`),
      card: By.css(`${this.root} .cards .issue-card`),
    };
  }

  getCardsLocator(): By {
    return this.locators.cards;
  }

  async getTitle(): Promise<string> {
    return (await this.findElement(this.locators.title)).getText();
  }

  async getIssueCount(): Promise<number> {
    return Number(await (await this.findElement(this.locators.issueCount)).getText());
  }

  async getCardIssueIds(): Promise<number[]> {
    const cards = await this.driver.findElements(this.locators.card);

    return Promise.all(cards.map(async (card) => Number(await card.getAttribute("data-issue"))));
  }

  async getCards(): Promise<IssueCardFragment[]> {
    const cards = await this.driver.findElements(this.locators.card);

    return cards.map((card) => new IssueCardFragment(this.driver, card));
  }
}
