import { test as base } from "./fixture";
import { VisualTester } from "@gitea-automation/core-playwright/visual-tester/visual-tester";

interface VisualFixtures {
  visualTester: VisualTester;
}

export const test = base.extend<VisualFixtures>({
  visualTester: async ({}, use) => {
    await use(new VisualTester());
  },
});

export { expect } from "@playwright/test";
