export interface Label {
  id: number;
  name: string;
  exclusive: boolean;
}

export interface NewLabel {
  name: string;
  color: string;
  exclusive: boolean;
}

export interface ScopedLabels {
  priorityHigh: number;
  priorityLow: number;
  kindBug: number;
}
