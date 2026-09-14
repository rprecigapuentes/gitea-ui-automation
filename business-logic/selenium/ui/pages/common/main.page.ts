import { By, WebDriver } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

const INSTANT = 0;

interface TabExpectations {
  repositoryLabelled: boolean;
  organizationLabelled: boolean;
  repositoryActive: boolean;
}

const NOTHING_READ: TabExpectations = {
  repositoryLabelled: false,
  organizationLabelled: false,
  repositoryActive: false,
};

export class MainPage extends BasePage {
  private readonly locators = {
    dashboardRepoList: By.css("#dashboard-repo-list"),
    repositoryOption: By.css(".ui.two.item.menu a.item:nth-of-type(1)"),
    organizationOption: By.css("#dashboard-repo-list .ui.two.item.menu a.item:nth-of-type(2)"),
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async open(): Promise<void> {
    await super.open([this.locators.dashboardRepoList]);
  }

  // Gitea renders the tab strip into #dashboard-repo-list from a Vue component, so the container
  // is on the page before the labels and the active class are. Reads once per attempt, and lets
  // the caller's wait decide how long the screen gets to settle.
  private async readTabs(): Promise<TabExpectations> {
    try {
      const root = await this.findElement(this.locators.dashboardRepoList, this.driver, INSTANT);
      const [repositoryLabel, organizationLabel, repositoryClass] = await Promise.all([
        this.getText(this.locators.repositoryOption, root, INSTANT),
        this.getText(this.locators.organizationOption, root, INSTANT),
        this.getAttribute(this.locators.repositoryOption, "class", root, INSTANT),
      ]);

      return {
        repositoryLabelled: repositoryLabel === "Repository",
        organizationLabelled: organizationLabel === "Organization",
        repositoryActive: repositoryClass.split(/\s+/).includes("active"),
      };
    } catch {
      return NOTHING_READ;
    }
  }

  async hasExpectedElementsDisplayed(): Promise<boolean> {
    let lastRead = NOTHING_READ;

    const settled = await this.waitUntil(async () => {
      lastRead = await this.readTabs();
      return Object.values(lastRead).every(Boolean);
    });

    if (!settled) {
      logger.warn({ pageContext: "dashboard", ...lastRead }, "Dashboard tabs never settled");
    }

    return settled;
  }
}
