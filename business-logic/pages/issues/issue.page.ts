import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { SidebarComboFragment } from "./fragments/sidebar-combo.fragment";
import { labelIdFromHref } from "./fragments/label-chip.fragment";

const WAIT_TIMEOUT_MS = 10000;
const INSTANT = 0;

export class IssuePage extends BasePage {
  private readonly labelCombo: SidebarComboFragment;
  private readonly milestoneCombo: SidebarComboFragment;
  private readonly assigneeCombo: SidebarComboFragment;
  private readonly projectCombo: SidebarComboFragment;

  private readonly locators = {
    timelineEvents: ".timeline-item.event",
    eventLabels: ".labels-list a.item",
    title: "#issue-title-display h1",
    titleIndex: "#issue-title-display h1 .index",
    stateLabel: ".issue-state-label",
    renderedBody: ".issue-content-comment .render-content.markup",
    dueDate: ".due-date",
    dueDateInput: "form.issue-due-form input[name='deadline']",
    dueDateSubmit: "form.issue-due-form button",
    statusButton: "#status-button",
    statusButtonReopen: "#status-button[value='reopen']",
    // An open issue's button carries no reopen value, which a page mid-reload has no button at all
    // to answer, so this is the presence check the reopen wait needs.
    statusButtonClose: "#status-button:not([value='reopen'])",
  };

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
    this.labelCombo = SidebarComboFragment.onIssue(strategy, "/issues/labels");
    this.milestoneCombo = SidebarComboFragment.byField(strategy, "milestone_id");
    this.assigneeCombo = SidebarComboFragment.byField(strategy, "assignee_ids");
    this.projectCombo = SidebarComboFragment.byField(strategy, "project_ids");
  }

  override getUrl(owner: string, repository: string, issueNumber: number): string {
    return `${baseUrl}/${owner}/${repository}/issues/${issueNumber}`;
  }

  async openFor(owner: string, repository: string, issueNumber: number): Promise<void> {
    await super.open([this.locators.title], owner, repository, issueNumber);
  }

  async assignProject(projectId: number): Promise<void> {
    await this.projectCombo.toggleAndWaitForSelection(projectId);
  }

  async applyLabel(labelId: number): Promise<void> {
    await this.labelCombo.toggle(labelId);
  }

  async getAppliedLabelIds(): Promise<number[]> {
    return this.labelCombo.getSelectedIds();
  }

  async waitForAppliedLabels(expected: number[]): Promise<void> {
    await this.waitFor(
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
    const events = await this.queryAll(this.locators.timelineEvents);
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

  async getTitle(): Promise<string> {
    const heading = await this.findElement(this.locators.title);
    const index = await this.findElement(this.locators.titleIndex, heading);

    return (await heading.getText()).replace(await index.getText(), "").trim();
  }

  async getIssueNumber(): Promise<number> {
    const index = await this.findElement(this.locators.titleIndex);

    return Number((await index.getText()).replace("#", ""));
  }

  async getState(): Promise<string> {
    return (await this.findElement(this.locators.stateLabel)).getText();
  }

  async getRenderedBody(): Promise<string> {
    return (await this.findElement(this.locators.renderedBody)).getText();
  }

  async getMilestoneName(): Promise<string> {
    return (await this.milestoneCombo.getSelectedTexts()).join("");
  }

  async getAssigneeNames(): Promise<string[]> {
    return this.assigneeCombo.getSelectedTexts();
  }

  /**
   * A native date input is typed in the format its browser and OS locale expect, and that order
   * varies: Firefox takes the ISO string, Chromium takes bare digits in the locale's date order,
   * which is month-first on US-locale machines but day-first elsewhere. What every combination
   * agrees on is that the `value` property reads back as ISO, so each spelling is typed and
   * verified rather than assumed. The form carries `form-fetch-action`, so a successful submit
   * reloads the page and the rendered date has to be waited for rather than read straight after
   * the click.
   */
  async setDueDate(date: Date): Promise<void> {
    const pad = (value: number): string => String(value).padStart(2, "0");
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const isoDate = `${year}-${month}-${day}`;
    const monthFirstDigits = `${month}${day}${year}`;
    const dayFirstDigits = `${day}${month}${year}`;
    const input = await this.findElement(this.locators.dueDateInput);
    let accepted = false;

    for (const spelling of [isoDate, monthFirstDigits, dayFirstDigits]) {
      await input.clear();
      await input.sendKeys(spelling);

      if ((await input.getAttribute("value")) === isoDate) {
        accepted = true;
        break;
      }
    }

    if (!accepted) throw new Error(`the due date input never took the date ${isoDate}`);

    await this.click(this.locators.dueDateSubmit);
    await this.waitFor(
      async () => (await this.queryAll(this.locators.dueDate)).length > 0,
      WAIT_TIMEOUT_MS,
      "the due date never appeared on the issue",
    );
  }

  async getDueDate(): Promise<string> {
    return (await this.findElement(this.locators.dueDate)).getText();
  }

  /**
   * The status button posts the comment form and the page comes back rendered for the other state,
   * so each direction waits for the button the new page renders rather than for its own click.
   */
  async close(): Promise<void> {
    await this.clickAndWaitUntil(
      this.locators.statusButton,
      () => this.isVisible(this.locators.statusButtonReopen, undefined, INSTANT),
      undefined,
      WAIT_TIMEOUT_MS,
    );
  }

  async reopen(): Promise<void> {
    await this.clickAndWaitUntil(
      this.locators.statusButtonReopen,
      () => this.isVisible(this.locators.statusButtonClose, undefined, INSTANT),
      undefined,
      WAIT_TIMEOUT_MS,
    );
  }
}
