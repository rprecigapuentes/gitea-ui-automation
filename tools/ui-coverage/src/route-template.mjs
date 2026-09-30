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
const REFS = new Set(["src", "raw", "commits", "commit", "compare"]);

const number = (part) => (/^\d+$/.test(part) ? "{n}" : part);
const join = (parts) => `/${parts.join("/")}`;

export function routeTemplate(pathname) {
  const [head, ...rest] = pathname.split("/").filter(Boolean);

  if (head === undefined) return "/";
  if (head === "org" && rest[0] === "create") return "/org/create";
  if (head === "org") return join(["org", "{org}", ...rest.slice(1).map(number)]);
  if (ROOTS.has(head)) return join([head, ...rest.map(number)]);

  const [repo, ...tail] = rest;
  if (repo === undefined) return "/{owner}";
  if (repo === "-") return join(["{owner}", "-", ...tail.map(number)]);
  if (REFS.has(tail[0])) return join(["{owner}", "{repo}", tail[0], "*"]);

  return join(["{owner}", "{repo}", ...tail.map(number)]);
}
