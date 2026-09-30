const sum = (values) => values.reduce((total, value) => total + value, 0);

function totals(inventory) {
  const pages = Object.values(inventory.urls);

  return {
    urls: pages.length,
    elements: sum(pages.map((page) => page.elements.length)),
    states: sum(pages.flatMap((page) => page.elements.map((element) => element.states.length))),
  };
}

export function delta(before, after) {
  const was = Object.keys(before.urls);
  const is = Object.keys(after.urls);

  return {
    added: is.filter((url) => !was.includes(url)),
    removed: was.filter((url) => !is.includes(url)),
    before: totals(before),
    after: totals(after),
  };
}
