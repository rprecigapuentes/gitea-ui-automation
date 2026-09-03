import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";

const labelWidget = '.issue-sidebar-combo[data-update-url*="/issues/labels"]';

export class IssuePage extends BasePage {
  private readonly locators = {
    labelDropdown: By.css(`${labelWidget} .ui.dropdown a.fixed-text`),
    labelMenuItem: (labelId: number) =>
      By.css(`${labelWidget} .menu a.item[data-value="${labelId}"]`),
    appliedLabels: By.css(`${labelWidget} .labels-list a.item`),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string, issueNumber: number): string {
    return `${baseUrl}/${owner}/${repository}/issues/${issueNumber}`;
  }

  async applyLabel(labelId: number): Promise<void> {
    await this.click(this.locators.labelDropdown);
    await this.click(this.locators.labelMenuItem(labelId));
    await this.click(this.locators.labelDropdown);
  }

  async getAppliedLabelIds(): Promise<number[]> {
    try {
      const links = await this.driver.findElements(this.locators.appliedLabels);
      const hrefs = await Promise.all(links.map((link) => link.getAttribute("href")));

      return hrefs
        .map((href) => new URL(href ?? "", baseUrl).searchParams.get("labels"))
        .filter((labelId): labelId is string => labelId !== null)
        .map(Number);
    } catch {
      return [];
    }
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
