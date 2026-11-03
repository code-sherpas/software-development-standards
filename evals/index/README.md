# Standards index test — cases

The cases the standards index test runs: an agent that reads only the [index](../../README.md) has to choose every standard that applies to the case, the same ones it would apply after reading all of them in full. The cases are in [cases/](cases/) and the standards each one expects in [expected.json](expected.json).

## What a case is

One file per case, `cases/<id>.md`: a short front matter and, below it, the message the agent receives for that work, as it would really receive it. A case never names a standard, never hints at one, and never says what it was designed to cover: what it covers is its label in `expected.json`.

```yaml
---
id: C14
kind: description+code   # or: description
role: increment-builder  # whose brief the agent runs under, see below
---
```

The body is what reaches the agent after the hook's instruction and its role's brief:

- for `increment-builder`, `increment-reviewer` and `increment-verifier`, the coordinator's message to that sub-agent: the increment, its acceptance, and, in code cases, the code as it stands — the diff so far for a builder, the diff under review for a reviewer;
- for a skill (`refine`, `to-increments`, `ship-increments`, `fix-error`, `build-prototype`), the person's message that invokes it, with whatever they pasted;
- for `none`, the person's message to a session with no skill and no role.

Code is synthetic, written to force the edges of each standard's scope, and inspired by real changes without copying private code.

## Writing a new case

When a standard is added or its scope changes, the corpus needs cases that cover what is new:

- every standard is expected in at least 2 cases, of different shapes (description only and with code, different stacks and roles); corpus.test.ts checks the minimum;
- a standard easily confused with another also gets a near-miss case: one that looks like it applies and does not, by its own scope's exclusions;
- cases are synthetic, inspired by real changes, and written to force the edges of the scope rather than its centre;
- what a case was designed to cover is never written down where a labeller can see it. Its expected standards come from three independent labellers that read every standard in full, as [labelling/](labelling/decisions.md) describes, with the person settling their disagreements.

## How the prompt is composed

The test, like the real agent, receives three parts in this order:

1. **The hook's instruction to read the index**, the text `instruction()` prints in `plugins/base/scripts/require-standards-index.sh` of [code-sherpas/claude-code-plugins](https://github.com/code-sherpas/claude-code-plugins), with the path to the index the test provides.
2. **The role's brief**, taken from where the agent really gets it, so that a change in its wording is tested too:

   | `role` | Source | Brief as of 2026-11-02 |
   |---|---|---|
   | `increment-builder` | claude-code-plugins `plugins/base/agents/increment-builder.md` | Ship this increment following the project's standards for shipping increments, as its builder. |
   | `increment-reviewer` | claude-code-plugins `plugins/base/agents/increment-reviewer.md` | Review this increment following the project's standards for shipping increments, as its reviewer. You report findings; you never change what you review. |
   | `increment-verifier` | claude-code-plugins `plugins/base/agents/increment-verifier.md` | Verify this increment in production following the project's standards for shipping increments, as its verifier. You report what you see; you change nothing. |
   | `ship-increments` | agent-skills `skills/ship-increments/SKILL.md` | Ship this task's increments following the project's standards for shipping increments. |
   | `refine` | agent-skills `skills/refine/SKILL.md` | Refine this request following the project's standards for refining work. |
   | `to-increments` | agent-skills `skills/to-increments/SKILL.md` | Split this task into increments following the project's standards for splitting work into increments. |
   | `fix-error` | agent-skills `skills/fix-error/SKILL.md` | Fix this error following the project's standards for resolving errors. |
   | `build-prototype` | agent-skills `skills/build-prototype/SKILL.md` | Build this prototype following the project's standards for state-coherent prototypes. |
   | `none` | — | — |

3. **The case body.**

## Roles of the 30 cases

| Role | Cases |
|---|---|
| `refine` | C01, C07 |
| `to-increments` | C02, C08 |
| `ship-increments` | C03 |
| `fix-error` | C04, C30 |
| `increment-builder` | C05, C11, C12, C13, C14, C17, C19, C20, C23, C24, C27, C29 |
| `build-prototype` | C06, C22 |
| `increment-verifier` | C09 |
| `none` | C10 |
| `increment-reviewer` | C15, C16, C18, C21, C25, C26, C28 |

## Expected standards

[expected.json](expected.json) holds, per case, the standards that apply (`expected`), each with the reason and its source, and the standards it is a near miss for (`near_miss`). The test fails when most of a case's runs (2 or 3 of 3) miss one of its expected standards, or when a run gives no answer; a standard missed in one run only is reported as unstable, and choosing a near miss, or any other standard not expected, is only reported. How the labels were made, and every decision on a disagreement, is in [labelling/](labelling/decisions.md).

## What keeps the corpus whole

Two deterministic checks, no model involved:

- [corpus.test.ts](corpus.test.ts), on every tree: every case has a valid front matter and its expected standards; every label names a standard that exists, with its reason and source; every standard declares its scope in a «What Counts as» section, has one entry in the index, and is expected in at least 2 cases.
- [scope-changes.ts](scope-changes.ts), in the merge queue against the queue's base: when a standard is added or its «What Counts as» section changes, the same change must update its entry in the index and at least one of its cases (a case file, a case newly naming it, or what `expected.json` says about it). A changed scope tested on the cases of the old one is a false green.

## The test with the model

[run.ts](run.ts) asks `claude-opus-5-5`, the model the agents run on, at the effort they run at (`medium`, its default), 3 times per case which standards it would read in full, giving it the hook's instruction, the index of this tree, its role's brief and the case. It fails when most runs of a case miss an expected standard: that is a systematic miss of the index. A standard missed in one run of three is reported as unstable, to tune its entry, without blocking: with some 1,200 choices per run, demanding no miss at all would fail most runs of an index that is not getting worse. What it chose beyond the expected standards, near misses included, is only reported. It writes `report.md` and `results.json`, and in CI also the job's summary.

```
npm ci
node evals/index/run.ts --dry-run --cases C14   # what the agent receives; calls nothing
node evals/index/run.ts                         # every case, 3 runs: some 900,000 tokens
node evals/index/run.ts --cases C13,C14 --runs 1
```

In the merge queue, the job `index_model_test` runs it only when [model-test-needed.ts](model-test-needed.ts) finds a standard added or removed or an index entry changed; otherwise it passes without calling the model. It authenticates with Workload Identity Federation, as the service account `standards-index-test`: the rule, service account, organization and workspace ids are repository variables, and there is no API key. If the exchange fails, the job fails. It can also be started by hand (`workflow_dispatch`). No fallback model is used: a refusal is a failed run, not an answer from another model.
