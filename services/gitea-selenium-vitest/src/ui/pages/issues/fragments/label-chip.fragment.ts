import { By, WebDriver, WebElement } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core/ui/base-pages/base-component";
import { baseUrl } from "@gitea-automation/core/config/gitea.config";

export function labelIdFromHref(href: string | null): number | null {
  const labelId = new URL(href ?? "", baseUrl).searchParams.get("labels");

  return labelId === null ? null : Number(labelId);
}

export class LabelChipFragment extends BaseComponent {
  private readonly locators = {
    scope: By.css(".scope-left"),
    item: By.css(".scope-right"),
  };

  constructor(
    driver: WebDriver,
    private readonly root: WebElement,
  ) {
    super(driver);
  }

  async isScoped(): Promise<boolean> {
    return (await this.root.findElements(this.locators.scope)).length > 0;
  }

  async getScopeAndItem(): Promise<[string, string]> {
    const scope = await this.findElement(this.locators.scope, this.root);
    const item = await this.findElement(this.locators.item, this.root);

    return [await scope.getText(), await item.getText()];
  }

  async getName(): Promise<string> {
    if (!(await this.isScoped())) {
      return this.root.getText();
    }

    const [scope, item] = await this.getScopeAndItem();

    return `${scope}/${item}`;
  }

  async getDescription(): Promise<string> {
    return (await this.root.getAttribute("title")) ?? "";
  }
}
