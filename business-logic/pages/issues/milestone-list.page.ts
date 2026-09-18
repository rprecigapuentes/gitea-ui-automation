import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { IElementHandle } from "@gitea-automation/core-page-objects/element-handle.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { MilestoneRow } from "../../entities/milestone.entity";

const WAIT_TIMEOUT_MS = 10000;

const firstNumberIn = (text: string): number => Number(text.replace(/\D/g, ""));

export class MilestoneListPage extends BasePage {
  private readonly locators = {
    rows: ".milestone-list > .item",
    rowName: ".list-item-large-title a",
    rowProgress: "progress.list-item-title-progress",
    rowCounters: ".list-item-secondary-bar .flex-text-inline",
  };

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/milestones`;
  }

  /** The rows are what a caller waits for, and waitForRow already does that per milestone. */
  async openFor(owner: string, repository: string): Promise<void> {
    await super.open([], owner, repository);
  }

  private async readRow(row: IElementHandle): Promise<MilestoneRow> {
    const progress = await row.findElement(this.locators.rowProgress);
    const counters = await row.findElements(this.locators.rowCounters);
    const [openIssues, closedIssues] = await Promise.all(
      counters.slice(0, 2).map(async (counter) => firstNumberIn(await counter.getText())),
    );

    return {
      name: await (await row.findElement(this.locators.rowName)).getText(),
      completeness: Number(await progress.getAttribute("value")),
      openIssues,
      closedIssues,
    };
  }

  async findRow(name: string): Promise<MilestoneRow | null> {
    try {
      for (const row of await this.queryAll(this.locators.rows)) {
        const read = await this.readRow(row);

        if (read.name === name) return read;
      }
    } catch {
      return null;
    }

    return null;
  }

  async waitForRow(name: string): Promise<MilestoneRow> {
    await this.waitFor(
      async () => (await this.findRow(name)) !== null,
      WAIT_TIMEOUT_MS,
      `the milestone "${name}" never appeared in the milestone list`,
    );

    const row = await this.findRow(name);

    if (!row) throw new Error(`the milestone "${name}" left the list while it was being read`);

    return row;
  }
}
