export interface Issue {
  id: number;
  number: number;
  title: string;
}

export interface SeededIssue {
  // The board addresses a card by the issue's internal id, which is not the number the UI shows.
  id: number;
  number: number;
  title: string;
}
