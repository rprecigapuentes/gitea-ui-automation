const percent = ({ covered, total }) => `${((covered / total) * 100).toFixed(1)}%`;
const row = (name, level) => `| ${name} | ${level.covered} | ${level.total} | ${percent(level)} |`;
const list = (urls) => (urls.length > 0 ? urls.join(", ") : "none");

function surface({ before, after, added, removed }) {
  return [
    "### Change of the crawled surface",
    "",
    `URLs ${before.urls} to ${after.urls}, elements ${before.elements} to ${after.elements}, states ${before.states} to ${after.states}.`,
    `Added: ${list(added)}. Removed: ${list(removed)}.`,
    "",
  ];
}

export function markdown(figures, change) {
  const touched = figures.perUrl.filter((entry) => entry.elements.covered > 0);

  return [
    `## UI coverage (Gitea ${figures.gitea})`,
    "",
    "| Level | Covered | Observed | Coverage |",
    "| --- | --- | --- | --- |",
    row("URLs", figures.urls),
    row("Elements", figures.elements),
    row("States", figures.states),
    row("Actions", figures.actions),
    "",
    ...(change ? surface(change) : []),
    "### Per URL with coverage",
    "",
    "| URL | Elements | States | Actions |",
    "| --- | --- | --- | --- |",
    ...touched.map(
      ({ url, elements, states, actions }) =>
        `| ${url} | ${elements.covered} / ${elements.total} | ${states.covered} / ${states.total} | ${actions.covered} / ${actions.total} |`,
    ),
    "",
    `Reached by a step but not crawled: ${list(figures.unseen)}.`,
    "",
    "The inventory of elements, with their locators and tests, is in `coverage.html`, the `ui-coverage-report` artifact of this run.",
    "",
  ].join("\n");
}
