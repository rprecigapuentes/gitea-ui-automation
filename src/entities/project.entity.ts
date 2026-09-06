/** Mirrors `models/project/template.go`: the value the creation form posts as `template_type`. */
export const ProjectTemplate = {
  None: 0,
  BasicKanban: 1,
  BugTriage: 2,
} as const;

export type ProjectTemplateType = (typeof ProjectTemplate)[keyof typeof ProjectTemplate];

export interface NewProject {
  title: string;
  description: string;
  template: ProjectTemplateType;
}

/** The columns `TemplateTypeBasicKanban` creates, the default one first. */
export const BASIC_KANBAN_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"] as const;
