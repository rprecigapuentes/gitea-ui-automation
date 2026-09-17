import { UserClient } from "@gitea-automation/business-logic/clients/user.client";
import { RequestStrategyFactory } from "@gitea-automation/core-api-client/request-strategy.factory";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { resolveAdminToken } from "./credentials";

export interface SeededUser {
  // The assignee menu addresses a user by this id, which the interface never displays.
  id: number;
  username: string;
  password: string;
}

const SEEDED_USER_PASSWORD = "Passw0rd!123";
const SEEDED_USER_COUNT = 2;

let seededUsers: SeededUser[] = [];

function adminClient(): UserClient {
  return new UserClient(
    RequestStrategyFactory.got(process.env.GITEA_BASE_URL!, resolveAdminToken()),
  );
}

function seededUsername(index: number): string {
  return `at-user-${index}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;
}

export async function createSeededUsers(): Promise<void> {
  const client = adminClient();
  const created: SeededUser[] = [];

  for (let index = 1; index <= SEEDED_USER_COUNT; index += 1) {
    const username = seededUsername(index);
    const user = await client.createUser(username, `${username}@example.com`, SEEDED_USER_PASSWORD);
    created.push({ id: user.id, username, password: SEEDED_USER_PASSWORD });
  }

  seededUsers = created;
}

export async function deleteSeededUsers(): Promise<void> {
  const client = adminClient();

  for (const user of seededUsers) {
    try {
      await client.deleteUser(user.username);
    } catch (error) {
      console.error(`Could not delete the seeded user "${user.username}":`, error);
    }
  }

  seededUsers = [];
}

export function getSeededUser(index: number): SeededUser {
  const user = seededUsers[index - 1];

  if (!user) {
    throw new Error(`Seeded user ${index} is not available (createSeededUsers must run first)`);
  }

  return user;
}
