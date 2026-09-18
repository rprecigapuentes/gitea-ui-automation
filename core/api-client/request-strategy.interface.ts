export interface IRequestStrategy {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, body?: unknown): Promise<T>;
  put<T>(endpoint: string, body?: unknown): Promise<T>;
  delete<T = void>(endpoint: string): Promise<T>;
}
