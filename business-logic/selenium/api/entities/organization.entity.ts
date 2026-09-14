// src/entities/organization.entity.ts
import { Team } from "./team.entity";

export type OrganizationVisibility = "public" | "private" | "limited";

export interface Organization {
  name: string;
  visibility: OrganizationVisibility;
  permissions?: string;
  teams?: Team[];
}
