// Joins the numerator's two halves: step, then page object, then the selectors its methods read.
import { parsePageObjects, selectorsReachedBy } from "./locators.mjs";
import { factoryClasses, urlTemplate } from "./page-objects.mjs";
import { activeDefinitions } from "./steps.mjs";

export function usedSelectors() {
  const classes = parsePageObjects();
  const factory = factoryClasses();
  const used = new Map();

  for (const { calls, tests } of activeDefinitions()) {
    for (const [getter, member] of calls) {
      const target = factory.get(getter);
      if (!target) continue;

      const template = urlTemplate(target.file) ?? null;
      for (const { selector, action } of selectorsReachedBy(
        classes,
        target.name,
        member,
      ).values()) {
        const key = `${template}|${selector}|${action}`;
        const entry = used.get(key) ?? { selector, action, template, tests: new Set() };

        tests.forEach((test) => entry.tests.add(test));
        used.set(key, entry);
      }
    }
  }

  return [...used.values()];
}
