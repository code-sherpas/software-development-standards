# Shipping Increments

## Goal

**Ship a split task one increment at a time: each increment is built, reviewed, merged, deployed and verified in production before anything that depends on it starts, with the person deciding every merge and every question that is theirs, and with no agent carrying more context than its own increment needs.**

This is the phase after [Splitting Work into Increments](splitting-work-into-increments.md). It starts in a new session, from the task, and it can be run as many times as the task has increments left.

## What Counts as In Scope

Shipping the increments of a task already split — see [Splitting Work into Increments](splitting-work-into-increments.md): building, reviewing, merging, deploying and verifying each one in production.

Out of scope:

- a task not yet split into increments: split it first.

## Arguments

The phase takes the task and, optionally:

| Argument | Meaning | Default | Allowed |
| :- | :- | :- | :- |
| maximum | How many increments this run ships at most. Each one gets its own builder; increments that become unblocked during the run count too. | 1 | any whole number from 1 up |
| in parallel | How many increments are being built at the same time, at most. | 1 | any whole number from 1 up |
| stack | An increment is unblocked as soon as its blockers have an open change request, and it is stacked on them. | off | on or off |

Anything else — zero, a negative or a fraction — is refused, saying what is allowed. There is no "unlimited": the person names a number. How many in parallel the machine and the person can sustain is theirs to decide.

## The Rule

### 1. Roles

- **The coordinator** is the agent of the session, the only one that talks to the person. It assigns increments, carries questions and merge requests to the person, puts approved changes in the merge queue and keeps the task's state. It never builds.
- **The builder** builds one increment, from the task and that increment. A new one for each increment.
- **The reviewer** reviews one increment before its change request is opened. Never the builder of that increment, and it never edits what it reviews.
- **The verifier** uses one shipped increment in production, after its deploy is confirmed. A new one each time, and it changes nothing.

Every one of them reads the standards index first, reads in full every standard whose entry applies to any part of its work — the ones that apply to almost every change included — and says in its report which ones it used and why.

A runtime without sub-agents runs the roles one after another in the same order, each starting from the task.

### 2. Start from the state, and report what nobody owns

Read the task's plan and state. An increment in progress that this run did not start — a run that was cut, a session that died — is reported to the person with its change request and its last activity. The person decides whether it is resumed or returned to pending. It is never claimed without them.

### 3. Pick from the frontier

An increment is unblocked when every increment blocking it is shipped: in production and verified. With **stack**, a blocker whose change request is open also counts, and the increment's change request is stacked on its blocker's, as [Stacked Changes](stacked-changes.md) says.

The coordinator picks unblocked increments in the plan's order, up to **in parallel** at a time and **maximum** in total, marks each one in progress and starts a builder for it. Only the coordinator assigns increments, so two builders in one run never take the same one.

### 4. Questions go through the coordinator

A sub-agent that needs an answer or a decision stops with the question, the options and the one it recommends. The coordinator answers what is technical and within what the task says; anything else goes to the person. Then it resumes the same sub-agent with the answer, so nothing it already did is lost. The other builders carry on meanwhile.

### 5. When the increment turns out larger

- **Larger in what it touches** — a migration, another layer, a new entry point: the builder reads the standards that part touches, and reports them.
- **Larger in what it does**: the builder stops and asks, through the coordinator.
- **The task is wrong** — something it assumes is false: the builder corrects the task and marks the correction for the person to review. If the correction changes what the work does, or for whom, it asks first.

### 6. Build

The builder:

- builds the increment and its tests;
- updates, in the same change, the product documentation the increment makes untrue: the documentation describes what the product does, and this is when that changes;
- records its decisions in the increment, each with its reason and marked for the person to review;
- passes every gate of [Pre-Merge Gates](pre-merge-gates.md) that applies;
- has a reviewer review it, fixes what the review finds, and opens the change request.

Then it stops. It does not wait for the merge queue or the deploy: waiting with its context loaded costs as much as working.

### 7. Review

The reviewer reads the task, the increment and the change, and checks the change against the standards that apply to it, the increment's acceptance and the prototype, if there is one. It returns a short list of findings, each with where it is and why it matters, or says there are none.

When the change carries a migration, leaves data behind, or adds or changes an entry point, the reviewer also checks that the builder's report shows how gates 4 to 6 of [Pre-Merge Gates](pre-merge-gates.md) were met: a reviewer reads the code that is there, and those gates are about what is not.

If a standard applied that the builder did not read, the finding says so: that increment becomes a case of the standards index test (`evals/index` in the standards repository), so the index is fixed where it failed.

### 8. Merge

The coordinator asks the person for permission to merge, gathering the increments that are ready into one question. Only with that permission does it put them in the merge queue — unless the person said, when starting the run, that it may merge without asking.

### 9. Verify in production

Once the deploy that carries an increment is confirmed, the coordinator starts a verifier for it. The verifier uses the increment in production the way its consumers will, as [Post-Deploy Verification](post-deploy-verification.md) says, and reports what it saw. If it fails, the coordinator tells the person with the evidence, and the person decides whether it is reverted.

An increment is **shipped** only once it has been verified in production.

### 10. Keep the state, keep the reports short

The coordinator keeps each increment's status and its line in the task's state up to date: pending, in progress, in review, waiting for merge, shipped. Sub-agents report in a few lines and leave the details in the tracker — every line they return stays in the coordinator's context for the rest of the run.

No sub-agent waits for anything that takes more than a few minutes: CI, the merge queue, a deploy, another session's work, a `sleep`. A sub-agent's prompt cache lasts five minutes, so after a longer idle wait its next call writes its whole context again. It reports what it is waiting for and stops; the coordinator, whose cache lasts longer, starts or resumes it once the result is there. Running its own tests is work, not waiting.

### 11. Hand off

The run ends when it has shipped **maximum** increments, when nothing is unblocked, or when something needs the person before it can go on. End with the exact instruction to carry on, ready to copy: clear the context — in Claude Code, `/clear` — then run the phase again with the task's link and the same arguments, by the name the agent runtime lists the skill under — in Claude Code with the `base` plugin, `/base:ship-increments <task link>`. An agent cannot clear its own context: the person does. When every increment is shipped, say that the task is done.

## Why This Rule Exists

**Measured in this organization, 2026-11-01:** in the repository where most work happens, half of all usage came from sub-agents, and 69 of 80 sub-agents had read every standard in full, some 233,000 tokens each, before starting. In another repository, builders started fresh for one increment each reached a median of 88,000 tokens of context in about nine calls; the session that coordinated them, never cleared, reached 573,000.

**Measured in the same repository, 2026-10-19 to 2026-11-01:** whole-context rewrites after a pause of 5 to 60 minutes were 8 % of all usage, and 152 of those 165 rewrites were sub-agents waiting — on a `sleep`, on `gh`, on a long build — with the five-minute cache sub-agents get. Giving sub-agents a one-hour cache would cost about as much as it saves: it makes every cache write of theirs dearer.

## Review Questions

- Was every increment started only once every blocker was verified in production, or stacked because the run asked for it?
- Did every builder, reviewer and verifier read the index and say which standards it used?
- Did any sub-agent wait for CI, the queue, a deploy or a `sleep` instead of reporting and stopping?
- Did a review find a standard that applied and the builder did not read, and did that increment become a case of the standards index test?
- Did any question that was the person's get answered without them?
- Was the reviewer a different agent from the builder, and did it leave the change untouched?
- For a change with a migration, data left behind or a new or changed entry point, did the review check how gates 4 to 6 were met?
- Does every shipped increment have its product documentation updated in its own change, and its decisions recorded?
- Did anything merge without the person's permission, when they had not waived it?
- Is every increment marked shipped verified in production?
- Was every increment found in progress, and not owned by this run, reported instead of claimed?

## Report the Outcome

When the run ends, state:

- each increment it touched, with its status and its change request;
- the decisions taken by agents, and the corrections made to the task, for the person to review;
- anything that needs the person: a question, a failed verification, an increment nobody owns;
- the next step, as the exact instruction to clear the context and run the phase again, or that the task is done.
