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

export type Grade = {
  // Expected standards missed in most runs (2 or 3 of 3): a systematic miss
  // of the index. These block.
  missed: string[];
  // Expected standards missed in some runs but not most (1 of 3): reported
  // as unstable, for the index to be tuned, without blocking.
  unstable: string[];
  // Whether a run failed to answer at all (a refusal, an API error). It blocks:
  // a run with no answer tells nothing about the index.
  errored: boolean;
  // Standards chosen beyond the expected ones, near misses included: reported only.
  extra: string[];
};

// Why most runs and not any run: with some 1,200 choices per full run, a
// standard that is chosen 999 times in 1,000 still fails «no miss in any run»
// most of the time. The misses the index really had were systematic (chosen
// 0 or 1 times in 3); the ones left after tuning it moved from case to case
// between runs. Decided by David, 2026-11-03.
export function grade(expected: ExpectedCase, runs: GradedRun[]): Grade {
  const wanted = expected.expected.map(function nameOf(item) {
    return item.standard;
  });
  const answered = runs.filter(function hasAnswer(run) {
    return run.error === undefined;
  });
  function missesOf(name: string): number {
    return answered.filter(function lacks(run) {
      return !run.chosen.includes(name);
    }).length;
  }
  const missed = wanted.filter(function missedInMost(name) {
    return missesOf(name) * 2 > runs.length;
  });
  const unstable = wanted.filter(function missedInSome(name) {
    const misses = missesOf(name);
    return misses > 0 && misses * 2 <= runs.length;
  });
  const extra = [...new Set(answered.flatMap(function chosenOf(run) {
    return run.chosen;
  }))].filter(function notExpected(name) {
    return !wanted.includes(name);
  });
  return { missed, unstable, errored: answered.length < runs.length, extra };
}
