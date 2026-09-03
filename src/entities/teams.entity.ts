export type TeamVisibility = "public" | "private" | "limited";

export interface Team {
  name: string;
  description: string;
  visibility: TeamVisibility;
  permission: string;
  includes_all_repositories: boolean;
  can_create_org_repo: boolean;
}
