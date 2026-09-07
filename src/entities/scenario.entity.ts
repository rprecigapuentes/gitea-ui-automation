import { Organization } from "../entities/organization.entity";
import { Team } from "../entities/team.entity";

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
}
