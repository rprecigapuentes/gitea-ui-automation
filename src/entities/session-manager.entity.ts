export interface SessionManager {
  loginAs: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsOwner: () => Promise<void>;
  loginAsUser2: () => Promise<void>;
}
