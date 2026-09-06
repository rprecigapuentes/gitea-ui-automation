export interface User {
  id: number;
  login: string;
  full_name: string;
  email: string;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface SeededUser {
  username: string;
  password: string;
}
