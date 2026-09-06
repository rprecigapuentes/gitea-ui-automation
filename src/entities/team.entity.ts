export interface Team {
  id: number;
  name: string;
}

export interface NewTeam {
  name: string;
  description: string;
  permission: "read" | "write" | "admin";
  units: string[];
  includes_all_repositories: boolean;
}
