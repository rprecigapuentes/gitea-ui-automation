import { WebDriver, By, WebElement } from "selenium-webdriver";

export type SearchRoot = WebDriver | WebElement;

const DEFAULT_TIMEOUT_MS = 5000;

export interface Verifiable {
  isVisible(locators: By | By[], root?: SearchRoot, timeoutMs?: number): Promise<boolean>;
}

/**
 * Alternative shape for discussion — not wired into any page/fragment.
 *
 * No `getReadyLocators()`. A fixed, overridable list baked into the component forces every
 * variant ("what's ready depends on isOwner", "depends on pageContext") into branches inside
 * one isVisible method. Instead, isVisible just takes whatever locators the caller hands it —
 * the decision of what "visible" means for a given check lives with the method asking the
 * question, not with a single method trying to answer it for every caller at once. When a
 * component has more than one shape of "visible" (owner vs. member, main vs. organization
 * context), that's two differently-named methods, each building its own list and calling
 * isVisible — not one isVisible with an if inside. See the fragment/page .alt.ts files.
 *
 * Nothing here overrides isVisible anymore, so it's just a plain method every subclass calls
 * directly (this.isVisible(...)) — no more of the super.isVisible() workaround the previous
 * round needed to dodge an overridden isVisible shadowing the base one.
 *
 * findElements: one wait, presence+visibility together, return the list, throw on timeout.
 * timeoutMs=0 is special-cased as "check once, right now" — selenium-webdriver's wait() treats
 * a falsy timeout as *no* timeout (polls forever), so 0 has to mean the opposite here: an
 * instant, single check, for absence assertions where waiting the full default would just be a
 * slow test for a negative that's already true.
 */
export abstract class BaseComponent implements Verifiable {
  constructor(protected driver: WebDriver) {}

  protected async findElements(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    const checkOnce = async (): Promise<WebElement[] | null> => {
      const found = await root.findElements(locator);
      if (found.length === 0) return null;
      const visible = await Promise.all(found.map((element) => element.isDisplayed()));
      return visible.every(Boolean) ? found : null;
    };

    if (timeoutMs === 0) {
      const result = await checkOnce();
      if (result === null) {
        throw new Error(`No visible element(s) for locator "${locator.toString()}"`);
      }
      return result;
    }

    return this.driver.wait(
      checkOnce,
      timeoutMs,
      `No visible element(s) for locator "${locator.toString()}"`,
    ) as Promise<WebElement[]>;
  }

  protected async findElement(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement> {
    const elements = await this.findElements(locator, root, timeoutMs);

    if (elements.length > 1) {
      throw new Error(
        `Expected exactly 1 element for locator "${locator.toString()}", found ${elements.length}`,
      );
    }

    return elements[0];
  }

  async click(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.click();
  }

  async type(
    locator: By,
    text: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.sendKeys(text);
  }

  async getText(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return element.getText();
  }

  async getAttribute(
    locator: By,
    attributeName: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return (await element.getAttribute(attributeName)) ?? "";
  }

  // One locator or a list — every one of them has to resolve. Try each, and if any fails, false.
  async isVisible(
    locators: By | By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    const list = Array.isArray(locators) ? locators : [locators];

    if (list.length === 0) return false;

    const results = await Promise.all(
      list.map((locator) =>
        this.findElement(locator, root, timeoutMs)
          .then(() => true)
          .catch(() => false),
      ),
    );

    return results.every(Boolean);
  }

  protected async actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    await action();
    return Promise.all(readyLocators.map((locator) => this.findElement(locator, root, timeoutMs)));
  }

  protected async clickAndWaitFor(
    clickLocator: By,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    return this.actAndWaitFor(
      () => this.click(clickLocator, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  protected async typeAndWaitFor(
    typeLocator: By,
    text: string,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    return this.actAndWaitFor(
      () => this.type(typeLocator, text, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }
}
