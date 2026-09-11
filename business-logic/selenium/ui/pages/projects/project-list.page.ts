import { By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export function projectIdFromHref(href: string | null): number | null {
  const [, projectId] = new URL(href ?? "", baseUrl).pathname.match(/\/-\/projects\/(\d+)$/) ?? [];

  return projectId === undefined ? null : Number(projectId);
}

export class ProjectListPage extends BasePage {
  private readonly locators = {
    projectLink: By.css(".milestone-list .list-item-large-title a.muted"),
  };

  override getUrl(owner: string): string {
    return `${baseUrl}/${owner}/-/projects`;
  }

  async openFor(owner: string): Promise<void> {
    await super.open([this.locators.projectLink], owner);
  }

  /**
   * A seeded organization holds exactly one project, and findElement is what enforces that: it
   * throws if a second one ever shows up instead of silently reading the first.
   */
  async getOnlyProjectId(): Promise<number> {
    const link = await this.findElement(this.locators.projectLink);
    const projectId = projectIdFromHref(await link.getAttribute("href"));

    if (projectId === null) {
      throw new Error("the project entry does not link to a project");
    }

    return projectId;
  }
}
