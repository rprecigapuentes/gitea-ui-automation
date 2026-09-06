import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { SidebarComboFragment } from "./fragments/sidebar-combo.fragment";
import { labelIdFromHref } from "./fragments/label-chip.fragment";

export class IssuePage extends BasePage {
  private readonly labelCombo: SidebarComboFragment;

  private readonly locators = {
    timelineEvents: By.css(".timeline-item.event"),
    eventLabels: By.css(".labels-list a.item"),
  };

  constructor(driver: WebDriver) {
    super(driver);
    this.labelCombo = new SidebarComboFragment(driver, "/issues/labels");
  }

  override getUrl(owner: string, repository: string, issueNumber: number): string {
    return `${baseUrl}/${owner}/${repository}/issues/${issueNumber}`;
  }

  async applyLabel(labelId: number): Promise<void> {
    await this.labelCombo.toggle(labelId);
  }

  async getAppliedLabelIds(): Promise<number[]> {
    return this.labelCombo.getSelectedIds();
  }

  async waitForAppliedLabels(expected: number[]): Promise<void> {
    await this.driver.wait(
      async () => {
        const applied = await this.getAppliedLabelIds();

        return applied.length === expected.length && expected.every((id) => applied.includes(id));
      },
      10000,
      `the issue never carried exactly the labels [${expected.join(", ")}]`,
    );
  }

  async removeLabel(labelId: number): Promise<void> {
    await this.labelCombo.toggle(labelId);
  }

  async getLabelEvents(): Promise<number[][]> {
    const events = await this.driver.findElements(this.locators.timelineEvents);
    const labelEvents: number[][] = [];

    for (const event of events) {
      const links = await event.findElements(this.locators.eventLabels);

      if (links.length === 0) continue;

      const hrefs = await Promise.all(links.map((link) => link.getAttribute("href")));

      labelEvents.push(hrefs.map(labelIdFromHref).filter((id): id is number => id !== null));
    }

    return labelEvents;
  }

  async getLastLabelEvent(): Promise<number[]> {
    return (await this.getLabelEvents()).at(-1) ?? [];
  }
}
