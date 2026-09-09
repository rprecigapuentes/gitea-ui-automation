import { Organization } from "@gitea-automation/business-logic/api/entities/organization.entity";
import { Team } from "@gitea-automation/business-logic/api/entities/team.entity";

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
}
