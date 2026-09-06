import { WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { SidebarComboFragment } from "./fragments/sidebar-combo.fragment";

export class IssuePage extends BasePage {
  private readonly labelCombo: SidebarComboFragment;

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
}
