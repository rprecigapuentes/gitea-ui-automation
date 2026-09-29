import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export class MainPage extends BasePage {
  private readonly locators = {
    dashboardRepoList: "#dashboard-repo-list",
    renderedPanel: "#dashboard-repo-list .dashboard-repos",
    repositoryOption: ".ui.two.item.menu a.item:nth-of-type(1)",
    organizationOption: ".ui.two.item.menu a.item:nth-of-type(2)",
    heatmapMonths: "g.heatmap-month-labels",
    heatmapDays: "g.heatmap-day-labels",
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  async open(): Promise<void> {
    await super.open([this.locators.renderedPanel]);
  }

  async hasExpectedElementsDisplayed(): Promise<boolean> {
    if (!(await this.isVisible(this.locators.renderedPanel))) return false;

    try {
      const root = await this.findElement(this.locators.dashboardRepoList);
      const [repositoryLabel, organizationLabel, repositoryClass] = await Promise.all([
        this.getText(this.locators.repositoryOption, root),
        this.getText(this.locators.organizationOption, root),
        this.getAttribute(this.locators.repositoryOption, "class", root),
      ]);

      const results = {
        repositoryLabelled: repositoryLabel === "Repository",
        organizationLabelled: organizationLabel === "Organization",
        repositoryActive: repositoryClass.split(/\s+/).includes("active"),
      };

      if (!Object.values(results).every(Boolean)) {
        logger.warn(
          { pageContext: "dashboard", repositoryLabel, organizationLabel, repositoryClass },
          "Dashboard tabs read something else",
        );
      }

      return Object.values(results).every(Boolean);
    } catch (thrown) {
      // A bare false here reads as "the tabs said no" when it can also mean "a read threw and the
      // reason was discarded", which is what made this failure unreadable in CI for three runs.
      logger.warn(
        {
          pageContext: "dashboard",
          url: await this.getCurrentUrl().catch(() => "unknown"),
          reason: String(thrown),
        },
        "Dashboard tabs could not be read",
      );
      return false;
    }
  }

  getVolatileRegions(): string[] {
    return [this.locators.heatmapDays, this.locators.heatmapMonths];
  }

  // The contribution heatmap's last column is the week in progress, so its cell count follows
  // the calendar rather than the markup.
  getScanExclusions(): string[] {
    return [".heatmap-day"];
  }
}
