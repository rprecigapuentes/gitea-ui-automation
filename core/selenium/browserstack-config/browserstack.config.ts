import type { WebDriver } from "selenium-webdriver";

export const isBrowserStack = process.env.BROWSERSTACK === "true";

export const hubUrl = "https://hub.browserstack.com/wd/hub";

export const localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER ?? "gitea-ui-local";

export function credentials(): { userName: string; accessKey: string } {
  const userName = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;

  if (!userName || !accessKey) {
    throw new Error(
      "BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY are required by the browserstack project",
    );
  }

  return { userName, accessKey };
}

export function bstackOptions(): Record<string, unknown> {
  return {
    ...credentials(),
    local: true,
    localIdentifier,
    os: process.env.BROWSERSTACK_OS ?? "Windows",
    osVersion: process.env.BROWSERSTACK_OS_VERSION ?? "11",
    projectName: "Gitea UI Automation",
    buildName: process.env.BROWSERSTACK_BUILD_NAME ?? "local",
    networkLogs: true,
  };
}

export async function setSessionStatus(
  driver: WebDriver,
  status: "passed" | "failed",
  reason: string,
): Promise<void> {
  await driver.executeScript(
    `browserstack_executor: ${JSON.stringify({ action: "setSessionStatus", arguments: { status, reason } })}`,
  );
}
