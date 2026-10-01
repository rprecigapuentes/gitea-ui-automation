# @gitea-automation/core-config

> Where the Gitea under test lives.

```ts
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
```

| Export    | Source                                             |
| --------- | -------------------------------------------------- |
| `baseUrl` | `GITEA_BASE_URL`, `http://localhost:3000` if unset |

It points at the **application under test**: a local or disposable Gitea, never the instance that
hosts this repository. Tests create and delete users, repositories and organizations there.
