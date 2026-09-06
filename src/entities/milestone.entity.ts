export interface Milestone {
  id: number;
  title: string;
  description: string;
  due_on: string;
}

export interface NewMilestone {
  title: string;
  description: string;
  due_on: string;
}

export interface SeededMilestone {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
}

export interface MilestoneRow {
  name: string;
  completeness: number;
  openIssues: number;
  closedIssues: number;
}
