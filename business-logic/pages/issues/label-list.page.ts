import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { IElementHandle } from "@gitea-automation/core-page-objects/element-handle.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { LabelRow, NewScopedLabel } from "../../entities/label.entity";
import { LabelChipFragment } from "./fragments/label-chip.fragment";

const modal = "#issue-label-edit-modal";
// The modal's fade-in animation can outlast 10s when the machine is busy running the other
// browsers in parallel, so it gets the same generous budget as the other Fomantic UI modals.
const WAIT_TIMEOUT_MS = 15000;

export class LabelListPage extends BasePage {
  private readonly locators = {
    newLabelButton: ".ui.button.new-label",
    modal: modal,
    nameInput: `${modal} .label-name-input`,
    descriptionInput: `${modal} .label-desc-input`,
    colorInput: `${modal} .color-picker-combo input[name="color"]`,
    exclusiveField: `${modal} .label-exclusive-input-field`,
    exclusiveCheckbox: `${modal} .label-exclusive-input-field .ui.checkbox label`,
    submitButton: `${modal} .ui.primary.approve.button`,
    rows: "ul.issue-label-list > li.item",
    editButton: ".edit-label-button",
    chip: ".label-title .ui.label",
  };

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/labels`;
  }

  async openFor(owner: string, repository: string): Promise<void> {
    await super.open([this.locators.newLabelButton], owner, repository);
  }

  async openNewLabelForm(): Promise<void> {
    await this.click(this.locators.newLabelButton);

    // Chrome's WebElement.isDisplayed() can report false for this modal even while Fomantic UI
    // has genuinely opened it (its dimmer already intercepts clicks), so the real DOM/CSS state
    // is checked directly instead of trusting Selenium's visibility atom.
    await this.waitFor(
      async () => {
        return this.executeScript<boolean>((selector) => {
          const el = document.querySelector(selector as string);
          return !!el && el.classList.contains("active") && getComputedStyle(el).display !== "none";
        }, modal);
      },
      WAIT_TIMEOUT_MS,
      "the new label modal never became active",
    );
  }

  async isExclusiveFieldEnabled(): Promise<boolean> {
    const field = await this.findElement(this.locators.exclusiveField, undefined, WAIT_TIMEOUT_MS);
    const classes = (await field.getAttribute("class")) ?? "";

    return !classes.split(/\s+/).includes("disabled");
  }

  async fillName(name: string): Promise<void> {
    await this.type(this.locators.nameInput, name, undefined, WAIT_TIMEOUT_MS);
  }

  async markExclusive(): Promise<void> {
    await this.click(this.locators.exclusiveCheckbox, undefined, WAIT_TIMEOUT_MS);
  }

  async fillDescription(description: string): Promise<void> {
    await this.type(this.locators.descriptionInput, description, undefined, WAIT_TIMEOUT_MS);
  }

  async fillColor(color: string): Promise<void> {
    const input = await this.findElement(this.locators.colorInput, undefined, WAIT_TIMEOUT_MS);
    await input.clear();
    await input.sendKeys(color);
  }

  async submitLabelForm(): Promise<void> {
    await this.click(this.locators.submitButton, undefined, WAIT_TIMEOUT_MS);
  }

  async createScopedLabel(label: NewScopedLabel): Promise<LabelRow> {
    await this.openNewLabelForm();
    await this.fillName(label.name);
    await this.markExclusive();
    await this.fillDescription(label.description);
    await this.fillColor(label.color);
    await this.submitLabelForm();

    return this.waitForLabel(label.name);
  }

  private async readRow(row: IElementHandle): Promise<LabelRow> {
    const button = await row.findElement(this.locators.editButton);
    const attribute = async (name: string): Promise<string> =>
      (await button.getAttribute(name)) ?? "";

    return {
      id: Number(await attribute("data-label-id")),
      name: await attribute("data-label-name"),
      color: (await attribute("data-label-color")).replace("#", "").toLowerCase(),
      description: await attribute("data-label-description"),
      exclusive: (await attribute("data-label-exclusive")) === "true",
      issueCount: Number(await attribute("data-label-num-issues")),
    };
  }

  async findRow(name: string): Promise<LabelRow | null> {
    try {
      for (const row of await this.queryAll(this.locators.rows)) {
        const read = await this.readRow(row);

        if (read.name === name) return read;
      }
    } catch {
      return null;
    }

    return null;
  }

  async waitForLabel(name: string): Promise<LabelRow> {
    await this.waitFor(
      async () => (await this.findRow(name)) !== null,
      WAIT_TIMEOUT_MS,
      `the label "${name}" never appeared in the label list`,
    );

    const row = await this.findRow(name);

    if (!row) throw new Error(`the label "${name}" left the list while it was being read`);

    return row;
  }

  async getChip(name: string): Promise<LabelChipFragment> {
    for (const row of await this.queryAll(this.locators.rows)) {
      if ((await this.readRow(row)).name === name) {
        return new LabelChipFragment(this.strategy, await row.findElement(this.locators.chip));
      }
    }

    throw new Error(`no label named "${name}" in the label list`);
  }
}
