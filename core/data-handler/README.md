# @gitea-automation/core-data-handler

> Names for the data a test creates, unique under parallel runs and traceable back to the test.

```ts
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

testDataName("ISS-01", "Label");
// AT-ISS-01-Label-20261001-143005-chrome-1a2b3c4d
```

| Part      | Example           | Why                                          |
| --------- | ----------------- | -------------------------------------------- |
| `AT-`     | `AT-`             | marks it as automation data                  |
| Test case | `ISS-01`          | which case created it                        |
| Object    | `Label`           | what it is                                   |
| UTC time  | `20261001-143005` | when                                         |
| Browser   | `chrome`          | from `BROWSER`; three browsers never collide |
| Suffix    | `1a2b3c4d`        | `uniqueSuffix()`, eight random characters    |
