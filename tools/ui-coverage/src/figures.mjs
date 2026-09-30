import { coveredStates } from "./match.mjs";
import { reachedUrls } from "./page-objects.mjs";
import { usedSelectors } from "./usage.mjs";

const sum = (values) => values.reduce((total, value) => total + value, 0);

export async function measure(inventory) {
  const reached = reachedUrls();
  const crawled = Object.keys(inventory.urls);
  const covered = await coveredStates(usedSelectors(), crawled, reached);

  const perUrl = crawled.map((url) => {
    const elements = inventory.urls[url].elements;
    const touched = [...covered.get(url)];

    return {
      url,
      reached: reached.has(url),
      elements: { covered: touched.length, total: elements.length },
      states: {
        covered: sum(
          touched.map(
            ([id, states]) => elements[id].states.filter((state) => states.has(state)).length,
          ),
        ),
        total: sum(elements.map((element) => element.states.length)),
      },
    };
  });

  const level = (pick) => ({
    covered: sum(perUrl.map((row) => pick(row).covered)),
    total: sum(perUrl.map((row) => pick(row).total)),
  });

  return {
    gitea: inventory.gitea,
    urls: { covered: perUrl.filter((row) => row.reached).length, total: crawled.length },
    elements: level((row) => row.elements),
    states: level((row) => row.states),
    unseen: [...reached].filter((url) => !crawled.includes(url)),
    perUrl,
  };
}
