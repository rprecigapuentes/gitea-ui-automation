export interface BrowserSession {
  loginAs(username: string, password: string): Promise<void>;
}
