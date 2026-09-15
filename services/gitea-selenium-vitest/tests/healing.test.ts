import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";
import { resolveOwnerCredentials } from "../src/utils/session-credentials.util";

// Only the healing proxy can answer a lookup whose class the page no longer has.
const throughProxy = Boolean(process.env.SELENIUM_REMOTE_URL);

describe("Self-healing locators", () => {
  it.skipIf(!throughProxy)(
    "AT-HEAL-01 Verify that a label row is still read after the application renames the class its edit button is located by",
    async ({ driver, repository, classificationLabel, labelListPage }) => {
      const { username: owner } = resolveOwnerCredentials();

      await driver.get(labelListPage.getUrl(owner, repository));
      await labelListPage.waitForLabel(classificationLabel.name);

      await labelListPage.driftEditButtons();

      const row = await labelListPage.waitForLabel(classificationLabel.name);
      expect(row.name).toBe(classificationLabel.name);
      expect(row.id).toBe(classificationLabel.id);
    },
  );
});
