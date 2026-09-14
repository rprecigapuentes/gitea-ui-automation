import { Organization } from "../api/entities/organization.entity";
import { SeededIssue } from "../api/entities/issue.entity";
import { SeededLabel } from "../api/entities/label.entity";
import { SeededMilestone } from "../api/entities/milestone.entity";
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
  milestone?: SeededMilestone;
  label?: SeededLabel;
  // An issue created through the form is known by what its page shows: its title from the moment
  // it is typed, its number only once the form has been submitted.
  createdIssue?: { number?: number; title: string };
}
