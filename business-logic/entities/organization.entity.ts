import { Team } from "./team.entity";
import { Repository } from "./repository.entity";

export type OrganizationVisibility = "public" | "private" | "limited";

export interface Organization {
  name: string;
  visibility: OrganizationVisibility;
  permissions?: string;
  teams?: Team[];
  repositories?: Repository[];
}
