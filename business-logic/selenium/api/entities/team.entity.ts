export type TeamVisibility = "public" | "private";

export interface Team {
  name: string;
  visibility: TeamVisibility;
  createRepositories: boolean;
}
