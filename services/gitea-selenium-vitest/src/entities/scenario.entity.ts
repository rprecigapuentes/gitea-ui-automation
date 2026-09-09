import { Organization } from "@gitea-automation/core/api/entities/organization.entity";
import { Team } from "@gitea-automation/core/api/entities/team.entity";

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
}
