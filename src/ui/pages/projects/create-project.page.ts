import { By, WebDriver, until } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { NewProject, ProjectTemplateType } from "../../../entities/project.entity";

const form = "form.ui.form";
const WAIT_TIMEOUT_MS = 10000;

export class CreateProjectPage extends BasePage {
  private readonly locators = {
    title: By.css(`${form} input[name="title"]`),
    description: By.css(`${form} .combo-markdown-editor textarea[name="content"]`),
    templateDropdown: By.css(`${form} .ui.selection.dropdown:has(input[name="template_type"])`),
    templateItem: (template: ProjectTemplateType) =>
      By.css(
        `${form} .ui.selection.dropdown:has(input[name="template_type"]) .menu .item[data-value="${template}"]`,
      ),
    submitButton: By.css(`${form} button.ui.primary.button`),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(organization: string): string {
    return `${baseUrl}/${organization}/-/projects/new`;
  }

  async fillTitle(title: string): Promise<void> {
    await this.type(this.locators.title, title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.type(this.locators.description, description);
  }

  /** A Fomantic selection dropdown, so the interaction is click to open then click the item. */
  async selectTemplate(template: ProjectTemplateType): Promise<void> {
    await this.click(this.locators.templateDropdown);
    await this.click(this.locators.templateItem(template));
  }

  async submit(): Promise<void> {
    await this.click(this.locators.submitButton);
    await this.driver.wait(
      until.urlMatches(/\/-\/projects(\?.*)?$/),
      WAIT_TIMEOUT_MS,
      "the browser never landed back on the project list",
    );
  }

  async createProject(project: NewProject): Promise<void> {
    await this.fillTitle(project.title);
    await this.fillDescription(project.description);
    await this.selectTemplate(project.template);
    await this.submit();
  }
}
