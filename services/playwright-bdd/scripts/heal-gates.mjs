import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** What a repair has to pass before it is proposed. Each gate is checked from the repository rather
 *  than asked of the agent, because an agent that reports on itself reports what it intended. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY = path.resolve(HERE, "..", "..", "..");
const PAGES = path.join("business-logic", "pages");

function git(...args) {
  const { status, stdout, stderr } = spawnSync("git", args, {
    cwd: REPOSITORY,
    encoding: "utf8",
  });
  if (status !== 0) throw new Error(`git ${args[0]} failed: ${stderr.trim()}`);
  return stdout;
}

/* The block a page object declares its selectors in, as line numbers. Nothing outside it may move:
   a method body in the same file is as much a rejection as a step definition in another. */
function locatorLines(file) {
  const lines = readFileSync(path.join(REPOSITORY, file), "utf8").split("\n");
  const start = lines.findIndex((line) => /locators\s*=\s*\{/.test(line));
  if (start === -1) return undefined;

  for (let at = start + 1; at < lines.length; at += 1) {
    if (/^\s*\};?\s*$/.test(lines[at])) return { from: start + 2, to: at };
  }
  return undefined;
}

const HUNK = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))?/;

/** The lines the working tree added or changed in a file, as the new file numbers them. A deletion
 *  reports the line it was deleted before, which is what the enclosing block has to contain too. */
function changedLines(file) {
  /* Against HEAD rather than the index: an agent that staged its change leaves `git diff` empty,
     and a gate that reads an empty diff waves it through. */
  const diff = git("diff", "HEAD", "-U0", "--", file).split("\n");
  const changed = [];

  for (const line of diff) {
    const hunk = HUNK.exec(line);
    if (!hunk) continue;
    const from = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    for (let at = from; at < from + Math.max(count, 1); at += 1) changed.push(at);
  }

  return changed;
}

/** Gate two: the change is confined to the locators a page object declares. */
export function confined() {
  /* `status --porcelain` rather than `diff --name-only`, which does not see a file the agent
     created. */
  /* Split before trimming: porcelain writes an unstaged change as " M path", and trimming the whole
     output eats that leading space and with it the first character of the first path. */
  const touched = git("status", "--porcelain")
    .split("\n")
    .filter((line) => line.length > 3)
    .map((line) => ({ state: line.slice(0, 2).trim(), file: line.slice(3).trim() }));

  const untracked = touched.find((entry) => entry.state === "??");
  if (untracked) return { ok: false, why: `${untracked.file} was created, and nothing may be` };

  const files = touched.map((entry) => entry.file);
  if (files.length === 0) return { ok: false, why: "nothing was changed" };

  for (const file of files) {
    if (!file.startsWith(`${PAGES}/`)) {
      return { ok: false, why: `${file} is not a page object` };
    }

    const block = locatorLines(file);
    if (!block) return { ok: false, why: `${file} declares no locators object` };

    const outside = changedLines(file).filter((at) => at < block.from || at > block.to);
    if (outside.length > 0) {
      return {
        ok: false,
        why: `${file} changed at line ${outside[0]}, outside its locators object (lines ${block.from}-${block.to})`,
      };
    }
  }

  return { ok: true, files };
}

/** Gates one and three: the scenario that failed passes, and the suite still passes with it. */
export function passes(command, environment = {}) {
  const { status } = spawnSync("npm", ["run", ...command], {
    cwd: path.join(REPOSITORY, "services", "playwright-bdd"),
    env: { ...process.env, ...environment },
    encoding: "utf8",
    stdio: "inherit",
  });
  return status === 0;
}

/** The change itself, kept because the tree is about to be put back and the patch is what a reader
 *  applies. */
export function diff() {
  return git("diff", "HEAD", "--", PAGES);
}

/** Whatever the outcome, the run leaves the tree as it found it: nothing is applied on anyone's
 *  behalf, which is the whole distance between this and the proxy it replaces. */
export function restore() {
  git("reset", "--quiet", "--", PAGES);
  git("checkout", "--", PAGES);
  git("clean", "-fd", "--", ".");
}
