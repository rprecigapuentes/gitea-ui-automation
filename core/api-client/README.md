# @gitea-automation/core-api-client

> The HTTP half of the framework: one base class for every Gitea API client, two ways to send the
> request.

Tests create and remove their data through the API, never through the screen they are not testing.
This package is what makes that possible from any suite: a client extends `GiteaApiClient`, calls
`get` / `post` / `put` / `delete`, and never knows which library sends the request.

## Usage

```ts
export class IssueClient extends GiteaApiClient {
  createIssue(owner: string, repository: string, title: string): Promise<Issue> {
    return this.post<Issue>(`repos/${owner}/${repository}/issues`, { title });
  }
}

// Whoever builds the client picks the tool:
new IssueClient(RequestStrategyFactory.got(baseUrl, token)); // the Selenium suites
new IssueClient(RequestStrategyFactory.playwright(baseUrl, token)); // the Playwright suites
```

Endpoints are relative to `/api/v1`; the strategy adds the base URL and the `Authorization` header.

## Structure

```
core/api-client/
├── request-strategy.interface.ts    IRequestStrategy: get, post, put, delete
├── gitea-api-client.ts              GiteaApiClient: the base every client extends
├── request-strategy.factory.ts      RequestStrategyFactory
└── strategies/
    ├── got-request-strategy.ts
    └── playwright-request-strategy.ts
```

## The two strategies

|                       | `GotRequestStrategy`          | `PlaywrightRequestStrategy`               |
| --------------------- | ----------------------------- | ----------------------------------------- |
| Used by               | Vitest and Cucumber           | Playwright native and BDD                 |
| A 4xx or 5xx response | **throws**                    | returned as the body, **does not throw**  |
| Connection            | a `got` instance per strategy | one request context, created on first use |

The second row matters when a setup call fails: under `got` the test stops at the call, under
Playwright it stops later, at the first step that needed what was never created.
