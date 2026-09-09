// src/entities/organization.entity.ts
export type OrganizationVisibility = "public" | "private" | "limited";

export interface Organization {
  name: string;
  visibility: OrganizationVisibility;
  permissions: string;
}
