import "dotenv/config";

export const baseUrl = process.env.GITEA_BASE_URL ?? "http://localhost:3000";
