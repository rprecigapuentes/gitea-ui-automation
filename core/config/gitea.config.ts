import "dotenv/config";

// The instance under test: a local Gitea by default, never the one that hosts this repository.
export const baseUrl = process.env.GITEA_BASE_URL ?? "http://localhost:3000";
