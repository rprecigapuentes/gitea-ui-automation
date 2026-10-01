export interface Credentials {
  username: string;
  password: string;
}

// Accounts and tokens are per browser (GITEA_OWNER_CHROME, ...), so parallel browsers never act as
// the same user.
function currentBrowserSuffix(): string {
  return (process.env.BROWSER ?? "chrome").toUpperCase();
}

export function resolveOwnerCredentials(): Credentials {
  const browser = currentBrowserSuffix();
  const username = process.env[`GITEA_OWNER_${browser}`];
  const password = process.env[`GITEA_OWNER_${browser}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing owner credentials for browser "${browser}" (GITEA_OWNER_${browser})`);
  }

  return { username, password };
}

export function resolveInvitedCredentials(): Credentials {
  const browser = currentBrowserSuffix();
  const username = process.env[`GITEA_INV_${browser}`];
  const password = process.env[`GITEA_INV_${browser}_PASSWORD`];

  if (!username || !password) {
    throw new Error(
      `Missing invited user credentials for browser "${browser}" (GITEA_INV_${browser})`,
    );
  }

  return { username, password };
}

export function resolveOwnerToken(): string {
  const browser = currentBrowserSuffix();
  const token = process.env[`GITEA_TOKEN_${browser}`];

  if (!token) {
    throw new Error(`Missing API token for browser "${browser}" (GITEA_TOKEN_${browser})`);
  }

  return token;
}
