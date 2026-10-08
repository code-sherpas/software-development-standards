# Fixing Reported Errors

## Goal

**When an error is reported, establish what it is before doing anything about it, leave a task that lets anyone pick it up without redoing the investigation, ask before starting the fix, and then land the fix where the project's design says the violated rule is owned.**

A report is a claim that something went wrong, not a diagnosis. It may describe something already fixed. The same failure arrives under several reports that look different for reasons that do not matter. And a report can be the system blaming itself for a mistake its user made. Acting on the report as it arrives — fixing the first stack trace, or silencing it — gets each of those wrong.

The work has two phases. **Triage** (Steps 1 to 5) establishes what the error is and ends at a task and a question. **The fix** (Steps 6 and 7) starts only when the person says so, from that task, and does not redo it.

## What Counts as In Scope

Any report that something failed, whoever or whatever produced it:

- an issue or an event in an error-tracking tool;
- an alert, or a log line at error severity;
- a stack trace or a log someone pasted;
- a person telling the team — a customer, a colleague, a support ticket;
- another application or an agent reporting that a call failed.

Out of scope: deciding whether a component should report a failure at all. That is [Failure Reporting](failure-reporting.md), which this standard applies when it finds a report that should not exist.

## Step 1: Is It Already Resolved?

**Before investigating anything else, find out whether the report corresponds to an error that is already resolved**, and gather credible evidence in one direction or the other:

- the change that fixed it, and the deploy that carries it — confirmed live, as in [Post-Deploy Verification](post-deploy-verification.md), not merely merged;
- no occurrence since that deploy, over a window in which the situation that triggered it has happened again. Silence from an error that fires once a month says nothing after a day.

"It has not happened lately" is not evidence on its own, and neither is a commit message that claims to fix something similar. If the evidence is not credible either way, treat the error as not resolved.

**If it is resolved**, mark it resolved in the project's error-tracking system, if there is one. Then look for its duplicates (see below) and mark them resolved too.

## Step 2: If It Is Not Resolved, Gather Everything

**Collect every fact about the error the system can give you.** Consult every relevant source that is available: logs, the infrastructure and the hosting platform, error-tracking and observability tools, the deploys around the first occurrence, the data the failing operation touched. Prefer the original source over anyone's summary of it.

From an error-tracking tool, that means everything the event offers: the error type and message, the full stack trace, captured variables and breadcrumbs, the session or replay, the affected release and environment, whether it was handled or unhandled, whether it originated client-side or server-side, the request or job context, frequency and first occurrence, and source maps when the stack is minified. A stack trace names where the failure became visible, not why.

**Look for its duplicates here too.**

### What makes two reports the same error

Two reports are the same error when they share the root cause and differ only in details that do not matter:

- the values interpolated into the message — ids, amounts, names;
- line numbers or minified names that moved with a deploy;
- the route, screen or job that called into the same failing code;
- the browser, device or client version;
- the environment the report came from.

The test: would fixing one fix the other? Two reports with the same message and different causes are not the same error.

## Step 3: Decide What Kind of Error It Is

### Is it an application error?

The system did something it should not have done, or failed to do what it should. Establish:

- **the exact point of the system that reported it** — the component, the function, the endpoint, the job that emitted the report;
- **the root cause** — not the line that threw, but why it threw. The point that reports a failure is often not where the failure was caused;
- **the layer that owns the violated rule** — see "Where the Fix Belongs" below. It is what the proposed actions are about.

#### Establishing the root cause

The root cause is established with evidence, not with plausibility:

1. **Reproduce before theorizing.** Build a deterministic way to trigger the exact failure — a failing test, a script, a replayed request, a seeded input — before reading code to form theories. Match the effort to the error: a stack trace with captured variables can be enough to justify a trivial guard; a state- or timing-dependent fault needs a real harness. If it will not reproduce, raise the rate until it is debuggable — tighten the inputs, add instrumentation, stress the timing — or ask for what is missing: a session replay, a data dump, fuller logs. Do not speculate in place of reproducing.
2. **Isolate the origin.** Remove what is not load-bearing for the failure — inputs, middleware, callers, data — until the smallest thing that still fails remains. Then trace the bad state back from where it became visible to where it entered the system.
3. **Confirm the cause by switching it.** A cause is confirmed when changing that one thing — and nothing else — makes the reproduction stop failing, and undoing the change makes it fail again. An explanation that fits the stack trace is a candidate, not a cause. When the first candidate does not pass this test, move to the next one; do not stretch the first.

### If not, is it a user error?

The user — a person, an agent or another application — asked for something the system correctly refused, or used it in a way it does not support, and the system behaved as designed. Then:

1. **The report should not have been produced.** Remove the automatic report for that specific situation, if there is one. The component still fails and returns its error, as [Failure Reporting](failure-reporting.md) requires; what goes is the report to observability, and only for that situation — not for the whole class of failure it belongs to.
2. **Look for a change, anywhere in the system, that stops the user making the same mistake again or makes it less likely.** It typically belongs to the interface, product design or the frontend — a clearer field, a constraint shown before the user submits, a message that says how to recover — but it can live elsewhere: an error an API returns that tells the calling application what to send instead, the description of a tool an agent reads.

   **Do not make a change that conceptually means the error was the application's, not the user's.** Relaxing the rule the user broke so the request now succeeds, guessing what the user meant and doing that instead, swallowing the failure so nobody sees it — each of them says the application was wrong to refuse. If you believe it was, that is a different finding: say so, and classify the report as an application error.

### If it is neither

Explain why it does not fit either case, and propose how to proceed. The proposal is a proposal: the person decides.

### Where the Fix Belongs

The root cause is not the same as the fix location. Decide ownership deliberately, from the project's own conventions — its agent instructions file, its architecture and design documents, and the code around the root cause: where invariants are enforced, where validation and authorization live, which layers may hold business logic, where module and aggregate boundaries fall.

- **Name the violated rule, not the failing line.** Identify the invariant, constraint, business rule or decision that was broken, independent of where the break surfaced.
- **Find the highest layer that owns that rule by design**: where the concept's other invariants already live, the module or aggregate the data belongs to, the layer permitted to hold business logic, or the point where validation, authorization or construction rules already sit.
- **Prefer the highest owning layer, not the lowest one that turns the test green.** The test: if I fix only here, can the same rule still be violated through another path or caller? If yes, the fix is too low.
- **An exception that escaped is an error-model gap.** If the failure reached the tracker unhandled, model it as an explicit outcome — a domain error, a validated boundary, a guarded constructor — at the layer that owns that outcome, rather than catching it at the point that reported it.
- **When ownership is ambiguous, or no convention covers it, ask.** State the rule, the candidate layers and the trade-off. Do not default to the point that reported it because it is nearest, and do not invent a convention on the project's behalf.

For a user error, the same criteria place the change that makes the mistake less likely.

Schematic examples:

- A null dereference surfaces in a view rendering an entity's optional field. The stack points at the template, but the entity was constructed earlier in a state the domain considers invalid. Owner: the entity's construction invariant. The fix makes that state unconstructable; the view was only the first reader to trip over it.
- A "duplicate key" error is thrown by the persistence layer on insert. The rule "this identifier is unique per tenant" is a business rule. Owner: the layer the project designates for business rules, which turns the collision into a modeled domain outcome rather than catching the database exception in the adapter.
- An unhandled exception from parsing an external payload surfaces deep in a mapper. The rule is "external input is validated at the boundary". Owner: the integration boundary, which validates and translates into the project's error model.

```ts
// Where it was reported — patches the reader, not the rule.
function render(entity) {
  const name = entity.owner?.name ?? "" // silences the failure; the rule is still violable elsewhere
  return view(name)
}

// Where the rule is owned: the entity may not exist without an owner.
class Entity {
  private constructor(readonly owner: Owner) {}
  static create(owner: Owner | null): Result<Entity, MissingOwnerError> {
    if (owner === null) return err(new MissingOwnerError())
    return ok(new Entity(owner))
  }
}
// The regression test asserts Entity.create(null) is rejected — every reader is now safe.
```

## Step 4: Create a Task to Track It

**Whatever Step 3 classified it as, create a task in the project's task tracker** to follow its progress. A report that Step 1 found already resolved needs no task: marking it and its duplicates resolved is the whole job.

- **Its type is the one that represents an error or a defect** — "bug", "defect", or whatever the tracker calls it — and that already exists in the tracker. If no such type exists, create it, or ask someone who can if you cannot.
- **Look for an existing task first.** If one already tracks this error or one of its duplicates, update that one instead of opening another.
- **If the project has no task tracker, ask how to proceed.** Do not leave the findings only in the conversation.

### What the task contains

1. **A short sentence that states the problem from the perspective of whoever observes it or is affected by it**, in the language of the domain, not technical language. "A teacher who uploads a cover larger than 10 MB sees the course without it, and no message", not "TypeError in uploadCover".
2. **The classification**: an application error, a user error, or something else — and, for something else, why.
3. **The root cause**, and how it was reproduced.
4. **The URL of the original report, and the URLs of every duplicate found.**
5. **The proposed actions** — to fix the application error, or to keep the user from making the same mistake again, including removing the report — and the layer each one belongs to.
6. **The exact point of the system that reported it.**
7. **Symptoms, evidence and proof**, referencing the original sources by URL wherever they have one. Add your own text and short excerpts from the sources where they help a reader grasp the facts quickly; a link alone forces every reader to redo the reading. Remove secrets and personal data from what you paste.

## Step 5: Share the Task and Ask

**Once the task exists, share its URL and ask whether to start working on it.** Triage ends at the task. Starting the fix is the person's call, not something to infer from the error looking urgent or the fix looking small.

## Step 6: Fix It Where the Rule Is Owned

**Start from the task.** Its root cause, reproduction, classification and proposed actions are where the fix begins; none of them is investigated again.

- **Apply the proposed actions at the layer the task names.**
- **Put the regression test at that same layer**, asserting the rule that layer is responsible for. The reproduction from Step 3 is usually its starting point. Optionally keep a test at the point that reported the error, proving the original failure no longer occurs.
- **For a user error**, the tests assert that the situation still fails without being reported, and that other failures of the same class still are.
- **If the work contradicts the task** — the reproduction no longer holds, the root cause turns out to be another, or the fix belongs somewhere else than the task says — stop, update the task with what you found, and ask again. The go-ahead was given for what the task said.
- **When the owning layer is outside what you are authorized to change**, propose the fix there explicitly rather than patching a lower layer.

## Step 7: Close the Loop

- **Keep the task current**: its status, and the link to the change.
- **The error is resolved only as Step 1 defines it**: the deploy that carries the fix confirmed live, and no occurrence since over a window in which the triggering situation has happened again. Merging the fix, deploying it, or the regression test passing is not that evidence.
- **Until there is that evidence, the task stays open** and says which window is still running. A task is never closed on the strength of the fix alone.
- **Once there is, close the task, and mark the original report and every duplicate resolved**, recording in the task the deploy and the window that make up the evidence.
- **Add a short post-mortem to the task**: the root cause in one or two sentences, and the one design change that would prevent this class of error from recurring.

## Review Questions

- Was the report checked against what is already resolved, with credible evidence either way?
- Were duplicates looked for, by root cause rather than by message — and resolved, or linked, alongside the original?
- Were all the available sources consulted, or only the report itself?
- Is the classification argued — application error, user error, or neither and why?
- For an application error: are the reporting point and the root cause both identified, and are they told apart? Was the root cause reproduced, and confirmed by switching it on and off against the reproduction rather than by plausibility?
- Is the proposed fix at the highest layer that owns the violated rule, decided from the project's conventions?
- For a user error: was the report removed for that situation only, and does the proposed improvement keep the error the user's?
- Does the task's title describe the problem as the affected person sees it, in domain language?
- Does the task carry every field, with URLs to the original sources?
- Was the task shared, and did the fix wait for an answer?
- Is the regression test at the layer the fix lives in?
- Was every departure from the task written into it and approved?
- Were the task closed, and the report and its duplicates marked resolved, only after the deploy was confirmed live and the window passed quiet?

## Report the Outcome

When finishing the triage, state:

- whether the report was already resolved, and the evidence either way;
- the duplicates found, and what was done with each;
- the sources consulted;
- the classification, and the reasoning behind it;
- the root cause, how it was reproduced, and the layer that owns the fix;
- the task's URL, and the question of whether to start working on it.

When finishing the fix, state:

- where the fix and its regression test were placed, and why that layer rather than the point that reported the error;
- any departure from the task, and who approved it;
- the deploy that carried the fix, the window observed, and whether the task is closed and the report and its duplicates resolved — or which evidence is still pending.
