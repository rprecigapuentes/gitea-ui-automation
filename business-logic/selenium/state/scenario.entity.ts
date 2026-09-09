import { Organization } from "../api/entities/organization.entity";
import { Team } from "../api/entities/team.entity";

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
}
