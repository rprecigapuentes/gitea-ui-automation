// The coverage figure per level (URLs, elements, states, actions), from the inventory and matches.
import { possibleActions } from "./actions.mjs";
import { readFileSync } from "node:fs";
import { coveredStates } from "./match.mjs";
import { keyOf } from "./elements.mjs";
import { idsFile } from "./paths.mjs";
import { reachedUrls } from "./page-objects.mjs";
import { usedSelectors } from "./usage.mjs";

const sum = (values) => values.reduce((total, value) => total + value, 0);
const count = (detail, pick) => sum(detail.map((element) => pick(element).length));

function detailOf(elements, ids, hits) {
  const idOf = new Map(ids.map((key, id) => [key, id]));

  return elements.map((element) => {
    const hit = hits.get(idOf.get(keyOf(element)));
    const actions = possibleActions(element.type);

    return {
      type: element.type,
      name: element.name,
      target: element.target,
      states: element.states,
      actions,
      coveredStates: element.states.filter((state) => hit?.states.has(state)),
      coveredActions: actions.filter((action) => hit?.actions.has(action)),
      touched: hit !== undefined,
      tests: [...(hit?.tests ?? [])].sort(),
    };
  });
}

function rowOf(url, reached, tests, elements, hits) {
  const ids = JSON.parse(readFileSync(idsFile(url), "utf8"));
  const detail = detailOf(elements, ids, hits);

  return {
    url,
    reached,
    tests: [...(tests ?? [])].sort(),
    elements: { covered: hits.size, total: elements.length },
    states: {
      covered: count(detail, (e) => e.coveredStates),
      total: count(detail, (e) => e.states),
    },
    actions: {
      covered: count(detail, (e) => e.coveredActions),
      total: count(detail, (e) => e.actions),
    },
    detail,
  };
}

function withFragments(declared, viaFragments) {
  const reached = new Map([...declared].map(([url, tests]) => [url, new Set(tests)]));

  for (const [url, tests] of viaFragments) {
    const found = reached.get(url) ?? new Set();
    tests.forEach((test) => found.add(test));
    reached.set(url, found);
  }

  return reached;
}

export async function measure(inventory) {
  const declared = reachedUrls();
  const crawled = Object.keys(inventory.urls);
  const { covered, viaFragments } = await coveredStates(usedSelectors(), crawled, declared);
  const reached = withFragments(declared, viaFragments);

  const perUrl = crawled.map((url) =>
    rowOf(url, reached.has(url), reached.get(url), inventory.urls[url].elements, covered.get(url)),
  );

  const level = (pick) => ({
    covered: sum(perUrl.map((row) => pick(row).covered)),
    total: sum(perUrl.map((row) => pick(row).total)),
  });

  return {
    gitea: inventory.gitea,
    urls: { covered: perUrl.filter((row) => row.reached).length, total: crawled.length },
    elements: level((row) => row.elements),
    states: level((row) => row.states),
    actions: level((row) => row.actions),
    unseen: [...declared.keys()].filter((url) => !crawled.includes(url)),
    perUrl,
  };
}
