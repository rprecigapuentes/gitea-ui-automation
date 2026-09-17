import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { IElementHandle } from "@gitea-automation/core-page-objects/element-handle.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export function labelIdFromHref(href: string | null): number | null {
  const labelId = new URL(href ?? "", baseUrl).searchParams.get("labels");

  return labelId === null ? null : Number(labelId);
}

export class LabelChipFragment extends BaseComponent {
  private readonly locators = {
    scope: ".scope-left",
    item: ".scope-right",
  };

  constructor(
    strategy: IInteractionStrategy,
    private readonly root: IElementHandle,
  ) {
    super(strategy);
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
