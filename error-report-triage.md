# Error Report Triage

## Goal

**When an error is reported, establish what it is before doing anything about it, leave a task that lets anyone pick it up without redoing the investigation, and ask before starting the fix.**

A report is a claim that something went wrong, not a diagnosis. It may describe something already fixed. The same failure arrives under several reports that look different for reasons that do not matter. And a report can be the system blaming itself for a mistake its user made. Acting on the report as it arrives — fixing the first stack trace, or silencing it — gets each of those wrong.

## What Counts as In Scope

Any report that something failed, whoever or whatever produced it:

- an issue or an event in an error-tracking tool;
- an alert, or a log line at error severity;
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
- **the root cause** — not the line that threw, but why it threw. The point that reports a failure is often not where the failure was caused.

### If not, is it a user error?

The user — a person, an agent or another application — asked for something the system correctly refused, or used it in a way it does not support, and the system behaved as designed. Then:

1. **The report should not have been produced.** Remove the automatic report for that specific situation, if there is one. The component still fails and returns its error, as [Failure Reporting](failure-reporting.md) requires; what goes is the report to observability, and only for that situation — not for the whole class of failure it belongs to.
2. **Look for a change, anywhere in the system, that stops the user making the same mistake again or makes it less likely.** It typically belongs to the interface, product design or the frontend — a clearer field, a constraint shown before the user submits, a message that says how to recover — but it can live elsewhere: an error an API returns that tells the calling application what to send instead, the description of a tool an agent reads.

   **Do not make a change that conceptually means the error was the application's, not the user's.** Relaxing the rule the user broke so the request now succeeds, guessing what the user meant and doing that instead, swallowing the failure so nobody sees it — each of them says the application was wrong to refuse. If you believe it was, that is a different finding: say so, and classify the report as an application error.

### If it is neither

Explain why it does not fit either case, and propose how to proceed. The proposal is a proposal: the person decides.

## Step 4: Create a Task to Track It

**Whatever Step 3 classified it as, create a task in the project's task tracker** to follow its progress. A report that Step 1 found already resolved needs no task: marking it and its duplicates resolved is the whole job.

- **Its type is the one that represents an error or a defect** — "bug", "defect", or whatever the tracker calls it — and that already exists in the tracker. If no such type exists, create it, or ask someone who can if you cannot.
- **Look for an existing task first.** If one already tracks this error or one of its duplicates, update that one instead of opening another.
- **If the project has no task tracker, ask how to proceed.** Do not leave the findings only in the conversation.

### What the task contains

1. **A short sentence that states the problem from the perspective of whoever observes it or is affected by it**, in the language of the domain, not technical language. "A teacher who uploads a cover larger than 10 MB sees the course without it, and no message", not "TypeError in uploadCover".
2. **The classification**: an application error, a user error, or something else — and, for something else, why.
3. **The root cause.**
4. **The URL of the original report, and the URLs of every duplicate found.**
5. **The proposed actions** — to fix the application error, or to keep the user from making the same mistake again, including removing the report.
6. **The exact point of the system that reported it.**
7. **Symptoms, evidence and proof**, referencing the original sources by URL wherever they have one. Add your own text and short excerpts from the sources where they help a reader grasp the facts quickly; a link alone forces every reader to redo the reading. Remove secrets and personal data from what you paste.

## Step 5: Share the Task and Ask

**Once the task exists, share its URL and ask whether to start working on it.** Triage ends at the task. Starting the fix is the person's call, not something to infer from the error looking urgent or the fix looking small.

## Review Questions

- Was the report checked against what is already resolved, with credible evidence either way?
- Were duplicates looked for, by root cause rather than by message — and resolved, or linked, alongside the original?
- Were all the available sources consulted, or only the report itself?
- Is the classification argued — application error, user error, or neither and why?
- For an application error: are the reporting point and the root cause both identified, and are they told apart?
- For a user error: was the report removed for that situation only, and does the proposed improvement keep the error the user's?
- Does the task's title describe the problem as the affected person sees it, in domain language?
- Does the task carry every field, with URLs to the original sources?
- Was the task shared, and did the fix wait for an answer?

## Report the Outcome

When finishing the triage, state:

- whether the report was already resolved, and the evidence either way;
- the duplicates found, and what was done with each;
- the sources consulted;
- the classification, and the reasoning behind it;
- the task's URL, and the question of whether to start working on it.
