# Expected Failure Reporting

## Goal

**A component must not report a failure its caller is about to recover from.**

The severity of a failure is frequently not knowable where it is raised. Whether it matters depends on whether somebody upstream recovers from it, and the code that raises it cannot see that. So the decision to report belongs to whoever knows — and the code that raises the failure has to be told.

Otherwise error tracking fills with failures nobody can act on, and the ones that matter get read as more of the same.

## What Counts as In Scope

Apply this standard wherever a failure is both **raised in one place and handled in another**, and the handling makes it harmless:

- a write that loses a race and is retried;
- a uniqueness violation in a flow that races itself by design and repairs by reading what the winner wrote;
- a lookup that is allowed to miss, in a caller that falls back;
- an external call whose failure the caller degrades gracefully around;
- an optimistic operation with a defined fallback path.

Out of scope: failures nobody recovers from. Those are reported, always, and this standard does not soften that.

## The Rule

**When a caller wraps an operation in a recovery, the operation has to be told the failure is expected.** Not silenced globally — told, for that call.

The report that must survive is the one that outlives the recovery: the conflict that lost every retry, the duplicate that was not the expected one, the fallback that also failed. That report is not optional and does not depend on anyone opting into anything.

## Where the Predicate Is Decided Is Not Free

Two shapes, and choosing between them is a design decision, not a preference.

**Hard-code it in the component when the failure always means the same thing there.** A write conflict under a snapshot isolation level is never the repository's to judge: it means "somebody got there first", every time, for every caller. The predicate belongs inside.

**Take it from the caller when the same failure means different things to different callers.** This is the case that punishes a shortcut.

The worked example: a uniqueness violation on creating a user. For the flow that provisions a person on their first login, a duplicate is **expected** — two requests for the same brand-new person land at once, both find nothing, both write, and the loser repairs by reading what the winner created. For the flows that mint the identifier at an identity service moments before writing, the same duplicate means **that service handed back somebody who already exists**, which is a real anomaly that must stay loud.

Same error code, opposite meanings. Silencing it inside the component for everybody would have traded one flow's noise for another flow's silence, which is the worse of the two trades.

## Reading First Does Not Avoid the Race

A flow that checks whether a row exists before writing it has not avoided anything. Under a snapshot isolation level both racers read the same snapshot and both find nothing, so the read cannot arbitrate — only the constraint can, and it does so by rejecting the loser.

This is why "check then write" is not a fix for a self-racing flow, and why the recovery has to be built around the rejection rather than around avoiding it.

## Why This Rule Exists

It was written after a rejection reached error tracking, at `error` severity, for a person who had just been served correctly — and sent somebody looking for a bug that was not there. The cost of a false alarm is not the alarm; it is the attention it takes from a real one, and the habit it builds of ignoring the channel.

## Review Questions

- Does this operation raise a failure that its caller handles and recovers from?
- If so, has the operation been told that failure is expected — for this call, not for every call?
- Does the same failure mean something different to another caller of the same operation? Then the predicate belongs to the caller, not inside.
- Is the failure that survives the recovery still reported?
- Is a "check before write" standing in for a recovery that the constraint will have to arbitrate anyway?

## Report the Outcome

When finishing the task, state:

- which failures are now treated as expected, in which flow, and who decided it;
- where the predicate lives, and why there rather than the other side;
- what still gets reported when the recovery does not work.
