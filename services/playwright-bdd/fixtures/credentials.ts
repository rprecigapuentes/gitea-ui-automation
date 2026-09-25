export interface Credentials {
  username: string;
  password: string;
}

/** Projects are named after their browser, and accounts are per browser. */
export function resolveOwnerCredentials(project: string): Credentials {
  const suffix = project.toUpperCase();
  const username = process.env[`GITEA_OWNER_${suffix}`];
  const password = process.env[`GITEA_OWNER_${suffix}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing owner credentials for browser "${suffix}" (GITEA_OWNER_${suffix})`);
  }

  return { username, password };
}
