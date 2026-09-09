import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import { Team } from "@gitea-automation/business-logic-selenium/api/entities/team.entity";

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
}
