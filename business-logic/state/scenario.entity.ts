import { Organization } from "../entities/organization.entity";
import { SeededIssue } from "../entities/issue.entity";
import { SeededLabel } from "../entities/label.entity";
import { SeededMilestone } from "../entities/milestone.entity";
import { Team } from "../entities/team.entity";

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
  // A scenario that creates several labels through the browser finds each one again by the name it
  // gave it: the id is Gitea's, and is known only once the row has been read back.
  createdLabels?: Record<string, SeededLabel>;
  // An issue created through the form is known by what its page shows: its title and its
  // description from the moment they are typed, its number only once the form has been submitted.
  createdIssue?: { number?: number; title: string; description?: string };
}
