export interface Credentials {
  username: string;
  password: string;
}

/** Projects of a non-functional area are named `<area>-<browser>`; accounts are per browser. */
function browserOf(project: string): string {
  return project.slice(project.lastIndexOf("-") + 1);
}

export function resolveOwnerCredentials(project: string): Credentials {
  const suffix = browserOf(project).toUpperCase();
  const username = process.env[`GITEA_OWNER_${suffix}`];
  const password = process.env[`GITEA_OWNER_${suffix}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing owner credentials for browser "${suffix}" (GITEA_OWNER_${suffix})`);
  }

  return { username, password };
}

export function resolveOwnerToken(project: string): string {
  const suffix = browserOf(project).toUpperCase();
  const token = process.env[`GITEA_TOKEN_${suffix}`];

  if (!token) {
    throw new Error(`Missing API token for browser "${suffix}" (GITEA_TOKEN_${suffix})`);
  }

  return token;
}
