// Fails when a change adds a standard or changes its scope without updating,
// in the same change, its entry in the README's index and its cases.
//
//   node evals/index/scope-changes.ts <base>
//
// <base> is the revision the change is compared against: in the merge queue,
// the queue's base. The working tree is the change. Nothing in a standard's
// text says whether its scope changed on purpose, so the rule is mechanical:
// a different «What Counts as» section is a different scope.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readCorpus, scopeChangeFindings, type Tree } from "./corpus.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function workingTree(root: string): Tree {
  return {
    list(directory) {
      const path = join(root, directory);
      if (!existsSync(path)) return [];
      return readdirSync(path, { withFileTypes: true })
        .filter(function isFile(entry) {
          return entry.isFile();
        })
        .map(function relativePath(entry) {
          return directory ? `${directory}/${entry.name}` : entry.name;
        });
    },
    read(path) {
      const file = join(root, path);
      return existsSync(file) ? readFileSync(file, "utf8") : undefined;
    },
  };
}

export function gitTree(root: string, revision: string): Tree {
  function git(...args: string[]): string {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  }
  return {
    list(directory) {
      const output = git("ls-tree", "--name-only", revision, directory ? `${directory}/` : ".");
      return output.split("\n").filter(Boolean);
    },
    read(path) {
      try {
        return git("show", `${revision}:${path}`);
      } catch {
        return undefined;
      }
    },
  };
}

function main(): void {
  const base = process.argv[2];
  if (!base) {
    console.error("usage: node evals/index/scope-changes.ts <base revision>");
    process.exit(2);
  }
  const findings = scopeChangeFindings(readCorpus(gitTree(ROOT, base)), readCorpus(workingTree(ROOT)));
  for (const finding of findings) console.error(finding);
  if (findings.length > 0) process.exit(1);
  console.log(`No standard was added or changed its scope without its index entry and its cases (against ${base}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
