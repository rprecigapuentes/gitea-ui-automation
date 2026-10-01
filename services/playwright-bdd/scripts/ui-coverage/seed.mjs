// Creates the data the crawl needs (repository, issue and organization through the API, the
// project through the page) and deletes it afterwards, so other runs' leftovers never count.
const BASE = new URL(process.env.GITEA_BASE_URL ?? "http://localhost:3000");
const OWNER = process.env.GITEA_OWNER_CHROME;
const TOKEN = process.env.GITEA_TOKEN_CHROME;
const TEAM = "coverage-team";

async function api(method, endpoint, body) {
  const response = await fetch(`${BASE.origin}/api/v1${endpoint}`, {
    method,
    headers: { Authorization: `token ${TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`${method} ${endpoint} answered ${response.status}`);
  return response.status === 204 ? undefined : response.json();
}

async function createProject(page, org) {
  await page.goto(`${BASE.origin}/${org}/-/projects/new`);
  await page.fill('form input[name="title"]', "Coverage project");
  await page.click("form button.ui.primary.button");
  await page.waitForURL(/\/-\/projects$/);

  const href = await page.getAttribute('a[href*="/-/projects/"]:not([href$="/new"])', "href");
  return href.match(/\/(\d+)/)[1];
}

export async function seed(page) {
  const suffix = Date.now().toString(36);
  const repo = `ui-cov-${suffix}`;
  const org = `ui-cov-org-${suffix}`;

  await api("POST", "/user/repos", { name: repo, auto_init: true, default_branch: "main" });
  const issue = await api("POST", `/repos/${OWNER}/${repo}/issues`, { title: "Coverage issue" });
  await api("POST", "/orgs", { username: org });
  await api("POST", `/orgs/${org}/teams`, {
    name: TEAM,
    permission: "read",
    units: ["repo.code"],
  });
  const project = await createProject(page, org);

  const prefixes = [`/${OWNER}/${repo}`, `/${OWNER}/-/`, `/${org}`, `/org/${org}`];

  return {
    owner: OWNER,
    repo,
    org,
    entries: [
      `/${OWNER}/${repo}`,
      `/${OWNER}/${repo}/issues/${issue.number}`,
      `/org/${org}/dashboard`,
      `/org/${org}/teams/${TEAM}`,
      `/${org}/-/projects/${project}`,
    ],
    owns: (pathname) => pathname === `/${OWNER}` || prefixes.some((p) => pathname.startsWith(p)),
  };
}

export async function unseed({ owner, repo, org }) {
  await api("DELETE", `/repos/${owner}/${repo}`);
  await api("DELETE", `/orgs/${org}`);
}
