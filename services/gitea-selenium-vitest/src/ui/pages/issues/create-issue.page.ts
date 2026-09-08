import { By, WebDriver, until } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core/selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/gitea/config";
import { SidebarComboFragment } from "./fragments/sidebar-combo.fragment";

const form = "#new-issue";
const previewPanel = `${form} [data-tab-panel="markdown-previewer"]`;
const WAIT_TIMEOUT_MS = 10000;

export class CreateIssuePage extends BasePage {
  private readonly labelCombo: SidebarComboFragment;
  private readonly milestoneCombo: SidebarComboFragment;
  private readonly assigneeCombo: SidebarComboFragment;

  private readonly locators = {
    title: By.css(`${form} #issue_title`),
    description: By.css(`${form} .combo-markdown-editor textarea[name="content"]`),
    previewTab: By.css(`${form} a[data-tab-for="markdown-previewer"]`),
    previewContent: By.css(`${previewPanel} *`),
    previewPanel: By.css(previewPanel),
    previewHeadings: By.css(`${previewPanel} h1, ${previewPanel} h2, ${previewPanel} h3`),
    submitButton: By.css(`${form} .issue-content-left button.ui.primary.button`),
  };

  constructor(driver: WebDriver) {
    super(driver);
    this.labelCombo = SidebarComboFragment.byField(driver, "label_ids");
    this.milestoneCombo = SidebarComboFragment.byField(driver, "milestone_id");
    this.assigneeCombo = SidebarComboFragment.byField(driver, "assignee_ids");
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/issues/new`;
  }

  async fillTitle(title: string): Promise<void> {
    await this.type(this.locators.title, title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.type(this.locators.description, description);
  }

  async openPreview(): Promise<void> {
    await this.click(this.locators.previewTab);
    await this.driver.wait(
      async () => (await this.driver.findElements(this.locators.previewContent)).length > 0,
      WAIT_TIMEOUT_MS,
      "the description preview never rendered",
    );
  }

  async getPreviewHeadings(): Promise<string[]> {
    const headings = await this.driver.findElements(this.locators.previewHeadings);

    return Promise.all(headings.map((heading) => heading.getText()));
  }

  async getPreviewText(): Promise<string> {
    return (await this.findElement(this.locators.previewPanel)).getText();
  }

  async selectLabel(labelId: number): Promise<void> {
    await this.labelCombo.toggle(labelId);
  }

  async selectMilestone(milestoneId: number): Promise<void> {
    await this.milestoneCombo.select(milestoneId);
  }

  async selectAssignee(userId: number): Promise<void> {
    await this.assigneeCombo.toggle(userId);
  }

  async getSelectedLabelIds(): Promise<number[]> {
    return this.labelCombo.getSelectedIds();
  }

  async getSelectedMilestoneNames(): Promise<string[]> {
    return this.milestoneCombo.getSelectedTexts();
  }

  async getSelectedAssigneeNames(): Promise<string[]> {
    return this.assigneeCombo.getSelectedTexts();
  }

  async submit(): Promise<void> {
    await this.click(this.locators.submitButton);
    await this.driver.wait(
      until.urlMatches(/\/issues\/\d+$/),
      WAIT_TIMEOUT_MS,
      "the browser never landed on the created issue",
    );
  }
}
