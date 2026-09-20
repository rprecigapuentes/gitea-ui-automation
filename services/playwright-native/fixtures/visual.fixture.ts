import { test as base } from "./fixture";
import { VisualTester } from "@gitea-automation/core-playwright/visual-tester/visual-tester";

/** Regions every Gitea page renders that change on each load: the footer's render timings. */
const GITEA_VOLATILE_REGIONS = ["footer"];

interface VisualFixtures {
  visualTester: VisualTester;
}

export const test = base.extend<VisualFixtures>({
  visualTester: async ({}, use) => {
    await use(new VisualTester(GITEA_VOLATILE_REGIONS));
  },
});

export { expect } from "@playwright/test";
