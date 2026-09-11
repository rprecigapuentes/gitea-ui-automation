export interface Issue {
  id: number;
  number: number;
  title: string;
}

export interface SeededIssue {
  // The board addresses a card by this id, not by the issue number.
  id: number;
  number: number;
  title: string;
}
