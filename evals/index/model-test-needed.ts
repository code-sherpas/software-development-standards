// Says whether a change needs the standards index test with the model, and
// why: only when a standard is added or removed, or its index entry changes.
// Writes `needed=true|false` to $GITHUB_OUTPUT when it is set.
//
//   node evals/index/model-test-needed.ts <base>

import { appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { indexChanges, readCorpus } from "./corpus.ts";
import { gitTree, workingTree } from "./scope-changes.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const base = process.argv[2];
if (!base) {
  console.error("usage: node evals/index/model-test-needed.ts <base revision>");
  process.exit(2);
}
const reasons = indexChanges(readCorpus(gitTree(ROOT, base)), readCorpus(workingTree(ROOT)));
console.log(reasons.length ? `The test with the model runs: ${reasons.join("; ")}.` : "The index did not change: the test with the model does not run.");
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `needed=${reasons.length > 0}\n`);
