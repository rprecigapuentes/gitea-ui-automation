export interface Credentials {
  username: string;
  password: string;
}

export function resolveOwnerCredentials(project: string): Credentials {
  const suffix = project.toUpperCase();
  const username = process.env[`GITEA_OWNER_${suffix}`];
  const password = process.env[`GITEA_OWNER_${suffix}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing owner credentials for browser "${suffix}" (GITEA_OWNER_${suffix})`);
  }

  return { username, password };
}

export function resolveOwnerToken(project: string): string {
  const suffix = project.toUpperCase();
  const token = process.env[`GITEA_TOKEN_${suffix}`];

  if (!token) {
    throw new Error(`Missing API token for browser "${suffix}" (GITEA_TOKEN_${suffix})`);
  }

  return token;
}
