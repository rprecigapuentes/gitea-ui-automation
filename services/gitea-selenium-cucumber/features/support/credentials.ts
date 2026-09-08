export interface Credentials {
  username: string;
  password: string;
}

export function resolveOwnerCredentials(): Credentials {
  const browser = (process.env.BROWSER ?? "chrome").toUpperCase();
  const username = process.env[`GITEA_OWNER_${browser}`];
  const password = process.env[`GITEA_OWNER_${browser}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing owner credentials for browser "${browser}" (GITEA_OWNER_${browser})`);
  }

  return { username, password };
}
