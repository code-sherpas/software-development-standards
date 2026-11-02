// What the model test does with an answer, apart from asking for it: kept
// free of the Anthropic SDK so the corpus tests run on Node alone.

import type { ExpectedCase } from "./corpus.ts";

// One run's answer: the standards it chose, or why there is no answer.
export type GradedRun = { chosen: string[]; error?: string };

// The text instruction() prints in require-standards-index.sh, with its paths.
export function hookInstruction(script: string, indexPath: string, base: string): string {
  const match = /instruction\(\) \{\s*printf '%s' "([^"]+)"/.exec(script);
  if (!match) throw new Error("require-standards-index.sh: instruction() not found");
  return match[1].replaceAll("$index", indexPath).replaceAll("$base", base);
}

export function grade(expected: ExpectedCase, runs: GradedRun[]): { missed: string[]; extra: string[] } {
  const wanted = expected.expected.map(function nameOf(item) {
    return item.standard;
  });
  const missed = wanted.filter(function missedInAnyRun(name) {
    return runs.some(function lacks(run) {
      return run.error !== undefined || !run.chosen.includes(name);
    });
  });
  const extra = [...new Set(runs.flatMap(function chosenOf(run) {
    return run.chosen;
  }))].filter(function notExpected(name) {
    return !wanted.includes(name);
  });
  return { missed, extra };
}

