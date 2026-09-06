import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { SidebarComboFragment } from "./fragments/sidebar-combo.fragment";
import { labelIdFromHref } from "./fragments/label-chip.fragment";

const WAIT_TIMEOUT_MS = 10000;

export class IssuePage extends BasePage {
  private readonly labelCombo: SidebarComboFragment;
  private readonly milestoneCombo: SidebarComboFragment;
  private readonly assigneeCombo: SidebarComboFragment;
  private readonly projectCombo: SidebarComboFragment;

  private readonly locators = {
    timelineEvents: By.css(".timeline-item.event"),
    eventLabels: By.css(".labels-list a.item"),
    title: By.css("#issue-title-display h1"),
    titleIndex: By.css("#issue-title-display h1 .index"),
    stateLabel: By.css(".issue-state-label"),
    renderedBody: By.css(".issue-content-comment .render-content.markup"),
    dueDate: By.css(".due-date"),
    dueDateInput: By.css("form.issue-due-form input[name='deadline']"),
    dueDateSubmit: By.css("form.issue-due-form button"),
    statusButton: By.css("#status-button"),
    statusButtonReopen: By.css("#status-button[value='reopen']"),
    projectCardTitles: By.css(".issue-sidebar-project-cards > .item > a.suppressed .gt-ellipsis"),
    projectColumnName: By.css(".sidebar-project-column-combo .fixed-text .gt-ellipsis"),
  };

  constructor(driver: WebDriver) {
    super(driver);
    this.labelCombo = SidebarComboFragment.onIssue(driver, "/issues/labels");
    this.milestoneCombo = SidebarComboFragment.byField(driver, "milestone_id");
    this.assigneeCombo = SidebarComboFragment.byField(driver, "assignee_ids");
    this.projectCombo = SidebarComboFragment.byField(driver, "project_ids");
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
      WAIT_TIMEOUT_MS,
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

  /**
   * The heading also carries the issue index in its own span, so it is subtracted rather than
   * matched away with a regular expression that a title containing a hash would break.
   */
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
   * A native date input is typed in the format its browser displays and the browsers disagree:
   * Firefox takes the ISO string and ignores bare digits, Chromium takes the digits of the
   * localized order and mangles the ISO string. What both agree on is that the `value` property
   * reads back as ISO, so each spelling is typed and verified rather than assumed. The form
   * carries `form-fetch-action`, so a successful submit reloads the page and the rendered date has
   * to be waited for rather than read straight after the click.
   */
  async setDueDate(date: Date): Promise<void> {
    const pad = (value: number): string => String(value).padStart(2, "0");
    const isoDate = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const localizedDigits = `${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${date.getUTCFullYear()}`;
    const input = await this.findElement(this.locators.dueDateInput);
    let accepted = false;

    for (const spelling of [isoDate, localizedDigits]) {
      await input.clear();
      await input.sendKeys(spelling);

      if ((await input.getAttribute("value")) === isoDate) {
        accepted = true;
        break;
      }
    }

    if (!accepted) throw new Error(`the due date input never took the date ${isoDate}`);

    await this.click(this.locators.dueDateSubmit);
    await this.driver.wait(
      async () => (await this.driver.findElements(this.locators.dueDate)).length > 0,
      WAIT_TIMEOUT_MS,
      "the due date never appeared on the issue",
    );
  }

  async getDueDate(): Promise<string> {
    return (await this.findElement(this.locators.dueDate)).getText();
  }

  /**
   * The project combo applies when the menu closes and the sidebar is then replaced wholesale, so
   * the project card is waited for rather than read straight after the click.
   */
  async attachProject(projectId: number): Promise<void> {
    await this.projectCombo.toggle(projectId);
    await this.driver.wait(
      async () => (await this.driver.findElements(this.locators.projectCardTitles)).length > 0,
      WAIT_TIMEOUT_MS,
      `the issue never carried the project ${projectId}`,
    );
  }

  async getAttachedProjectTitles(): Promise<string[]> {
    const titles = await this.driver.findElements(this.locators.projectCardTitles);

    return Promise.all(titles.map((title) => title.getText()));
  }

  async getProjectColumnName(): Promise<string> {
    return (await this.findElement(this.locators.projectColumnName)).getText();
  }

  /**
   * The close button posts the comment form and the page comes back rendered for a closed issue,
   * so the condition is the button having flipped to reopen rather than the click returning.
   */
  async close(): Promise<void> {
    await this.click(this.locators.statusButton);
    await this.driver.wait(
      async () => (await this.driver.findElements(this.locators.statusButtonReopen)).length > 0,
      WAIT_TIMEOUT_MS,
      "the issue never reached the closed state",
    );
  }
}
