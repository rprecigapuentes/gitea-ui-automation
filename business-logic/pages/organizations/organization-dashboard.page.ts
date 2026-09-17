import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { Organization } from "../../entities/organization.entity";

export class OrganizationDashboardPage extends BasePage {
  protected organization: Organization | undefined;

  private readonly locators = {
    repositoriesContainer: ".dashboard-repos",
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization?.name}/dashboard`;
  }

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  async waitForElements(organization: Organization): Promise<void> {
    this.organization = organization;
    await this.isVisible(this.locators.repositoriesContainer);
  }
}
