import { WebDriver, WebElement } from "selenium-webdriver";

/** Renames one class on each element, leaving everything else about it in place. */
const RENAME_CLASS = `
const [elements, from, to] = arguments;
for (const element of elements) element.classList.replace(from, to);
`;

export async function renameClass(
  driver: WebDriver,
  elements: WebElement[],
  from: string,
  to: string,
): Promise<void> {
  await driver.executeScript(RENAME_CLASS, elements, from, to);
}
