import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export class MainPage extends BasePage {
  private readonly locators = {
    // Server-rendered: it is on the page before Vue mounts anything into it, so waiting for it
    // proves nothing about the tab strip.
    dashboardRepoList: "#dashboard-repo-list",
    // Rendered by the same Vue component as the tab strip, in the same patch, and asserted on by
    // nobody. Waiting for this is what says the tabs carry their labels and their active class.
    renderedPanel: "#dashboard-repo-list .dashboard-repos",
    repositoryOption: ".ui.two.item.menu a.item:nth-of-type(1)",
    organizationOption: ".ui.two.item.menu a.item:nth-of-type(2)",
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

  // Reading the tabs before Vue has rendered them is what asked the healing proxy to repair a
  // timing problem: it answered with the most similar node, and two identical tab anchors are each
  // other's most similar node. Nothing here is read until the panel that carries them exists.
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
    return [
      ".secondary-nav .ui.floating.dropdown.jump span.text img.ui.avatar",
      ".secondary-nav .text span.gt-ellipsis",
      "[data-tooltip-content='Profile and Settings…'] img.ui.avatar",
    ];
  }

  // The contribution heatmap's last column is the week in progress, so its cell count follows
  // the calendar rather than the markup.
  getScanExclusions(): string[] {
    return [".heatmap-day"];
  }
}
