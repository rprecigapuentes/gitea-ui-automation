import { baseUrl } from "../../core/config/config";
import { Team } from "../entities/teams.entity";
import { OrganizationBasePage } from "./organization-base.page";
import type { WebDriver } from "selenium-webdriver";
import type { Organization } from "../entities/organization.entity";

export class SpecificTeamPage extends OrganizationBasePage {
  protected readonly team: Team;

  constructor(driver: WebDriver, organization: Organization, team: Team) {
    super(driver, organization);
    this.team = team;
  }

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/teams/${this.team.name}`;
  }
}
