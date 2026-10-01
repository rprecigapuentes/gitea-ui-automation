// Per entity: `X` is what the API returns, `NewX` what is sent to create one, `XRow` what its list
// page shows, and `SeededX` the id and name a scenario keeps to find it again.
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

export interface NewScopedLabel {
  name: string;
  description: string;
  color: string;
}

export interface LabelRow {
  id: number;
  name: string;
  color: string;
  description: string;
  exclusive: boolean;
  issueCount: number;
}

export interface SeededLabel {
  id: number;
  name: string;
}
