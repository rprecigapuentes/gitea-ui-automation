import { Organization } from "../api/entities/organization.entity";
import { SeededIssue } from "../api/entities/issue.entity";
import { Team } from "../api/entities/team.entity";

export interface SeededRepository {
  name: string;
  issue: SeededIssue;
}

export interface SeededProject {
  id: number;
  title: string;
}

export interface ScenarioState {
  organization?: Organization;
  team1?: Team;
  team2?: Team;
  repositories?: SeededRepository[];
  project?: SeededProject;
}
