# Standards index test — cases

The cases the standards index test runs: an agent that reads only the [index](../../README.md) has to choose every standard that applies to the case, the same ones it would apply after reading all of them in full. [case-list.md](case-list.md) says what each case was designed to cover and why; the cases themselves are in [cases/](cases/).

## What a case is

One file per case, `cases/<id>.md`: a short front matter and, below it, the message the agent receives for that work, as it would really receive it. A case never names a standard, never hints at one, and never says what it was designed to cover: that lives in `case-list.md` and, once labelled, in the expected set.

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

[expected.json](expected.json) holds, per case, the standards that apply (`expected`), each with the reason and its source, and the standards it is a near miss for (`near_miss`). The test fails when any of a case's runs misses one of its expected standards; choosing a near miss, or any other standard not expected, is only reported. How the labels were made, and every decision on a disagreement, is in [labelling/](labelling/decisions.md).

## What keeps the corpus whole

Two deterministic checks, no model involved:

- [corpus.test.ts](corpus.test.ts), on every tree: every case has a valid front matter and its expected standards; every label names a standard that exists, with its reason and source; every standard declares its scope in a «What Counts as» section, has one entry in the index, and is expected in at least 2 cases.
- [scope-changes.ts](scope-changes.ts), in the merge queue against the queue's base: when a standard is added or its «What Counts as» section changes, the same change must update its entry in the index and at least one of its cases (a case file, a case newly naming it, or what `expected.json` says about it). A changed scope tested on the cases of the old one is a false green.

## The test with the model

[run.ts](run.ts) asks `claude-opus-5-5`, the model the agents run on, at the effort they run at (`medium`, its default), 3 times per case which standards it would read in full, giving it the hook's instruction, the index of this tree, its role's brief and the case. It fails when any run misses an expected standard; what it chose beyond them, near misses included, is only reported. It writes `report.md` and `results.json`, and in CI also the job's summary.

```
npm ci
node evals/index/run.ts --dry-run --cases C14   # what the agent receives; calls nothing
node evals/index/run.ts                         # every case, 3 runs: some 900,000 tokens
node evals/index/run.ts --cases C13,C14 --runs 1
```

In the merge queue, the job `index_model_test` runs it only when [model-test-needed.ts](model-test-needed.ts) finds a standard added or removed or an index entry changed; otherwise it passes without calling the model. It authenticates with Workload Identity Federation, as the service account `standards-index-test`: the rule, service account, organization and workspace ids are repository variables, and there is no API key. If the exchange fails, the job fails. It can also be started by hand (`workflow_dispatch`). No fallback model is used: a refusal is a failed run, not an answer from another model.
