// Reduces a pathname to its route template, so /alice/app/issues/4 and /bob/lib/issues/9 are one
// URL: /{owner}/{repo}/issues/{n}.
const ROOTS = new Set([
  "user",
  "explore",
  "admin",
  "notifications",
  "issues",
  "pulls",
  "repo",
  "-",
]);
const REFS = new Set([
  "src",
  "raw",
  "commits",
  "commit",
  "compare",
  "_edit",
  "_new",
  "_upload",
  "_diffpatch",
  "blame",
  "rss",
]);

const number = (part) => (/^\d+$/.test(part) ? "{n}" : part);
const join = (parts) => `/${parts.join("/")}`;

const TEAM_SECTIONS = new Set(["teams", "dashboard", "issues", "pulls", "milestones"]);

const orgTail = ([section, name, ...more]) =>
  TEAM_SECTIONS.has(section) && name !== undefined && name !== "new"
    ? [section, "{team}", ...more.map(number)]
    : [section, name, ...more].filter((part) => part !== undefined).map(number);

export function routeTemplate(pathname) {
  const [head, ...rest] = pathname.split("/").filter(Boolean);

  if (head === undefined) return "/";
  if (head === "org" && rest[0] === "create") return "/org/create";
  if (head === "org") return join(["org", "{org}", ...orgTail(rest.slice(1))]);
  if (ROOTS.has(head)) return join([head, ...rest.map(number)]);

  const [repo, ...tail] = rest;
  if (repo === undefined) return "/{owner}";
  if (repo === "-") return join(["{owner}", "-", ...tail.map(number)]);
  if (REFS.has(tail[0])) return join(["{owner}", "{repo}", tail[0], "*"]);

  return join(["{owner}", "{repo}", ...tail.map(number)]);
}
