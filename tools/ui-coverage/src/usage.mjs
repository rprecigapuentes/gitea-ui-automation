import { parsePageObjects, selectorsReachedBy } from "./locators.mjs";
import { factoryClasses, stepCalls, urlTemplate } from "./page-objects.mjs";

export function usedSelectors() {
  const classes = parsePageObjects();
  const factory = factoryClasses();
  const used = new Map();

  for (const [getter, member] of stepCalls()) {
    const target = factory.get(getter);
    if (!target) continue;

    const template = urlTemplate(target.file) ?? null;
    for (const { selector, action } of selectorsReachedBy(classes, target.name, member).values()) {
      used.set(`${template}|${selector}|${action}`, { selector, action, template });
    }
  }

  return [...used.values()];
}
