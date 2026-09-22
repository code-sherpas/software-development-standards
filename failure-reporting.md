# Failure Reporting

## Goal

**A component fails whenever it cannot do what it was asked to do.** It returns its error, always, to whoever called it. That is not negotiable and nothing here softens it.

**Reporting that failure to observability is a different decision.** The severity of a failure is not a property of the failure — it is a property of the context it happened in. The same error is an incident for one caller and an expected outcome for another. So the decision to report belongs to whoever knows that context: the caller who recovers, or does not.

## What Counts as In Scope

Apply this standard wherever code decides to emit something to an error tracker, an alerting channel or a log at error severity:

- a repository, a client or an adapter that wraps its own failures;
- a caller that recovers from a failure — a retry, a fallback, a repair by re-reading;
- a flow that races itself by design and repairs afterwards;
- any operation whose failure is routine for one entry point and an anomaly for another.

Out of scope: whether the operation fails at all, and what type its error has. That is the project's error-handling standard, not this one.

## Failing and Reporting Are Different Things

Keep them apart, because conflating them is what produces both bad outcomes:

- A component that **swallows** a failure to avoid noise leaves its caller unable to react. That is worse than the noise.
- A component that **reports** every failure it raises fills the error tracker with events nobody can act on, and the ones that matter get read as more of the same.

The resolution is that failing is unconditional and reporting is contextual.

## Severity Is a Property of the Context

The proof is that the same failure means opposite things to different callers.

Take a uniqueness violation when creating a user:

- For the flow that provisions a person on their **first login**, it is expected. Two requests for the same brand-new person arrive at once, both find nothing, both write, and the loser repairs by reading what the winner created. The person was served correctly.
- For the flows that **mint the identifier at an identity service** moments before writing, the same violation means that service handed back somebody who already exists. That is a real anomaly and it must stay loud.

Same error code, opposite meanings, one component raising it. No rule written inside that component can be right for both callers. Deciding there means choosing which of the two to get wrong.

## Report Where the Severity Is Known

The natural place is the caller that knows whether the failure mattered — typically the business-logic entry point, which knows what it was doing and whether it recovered.

**A component below that point reports nothing on its own.** It returns the failure, with enough context attached to the error for whoever reports it to be useful: the operation, the parameters that matter, the underlying code. A typed error carries all of that; "we have to report here because the context is here" is solved by putting the context in the error.

**The failure nobody recovers from is always reported.** The conflict that lost every retry, the fallback that also failed, the anomaly that no caller expected. That report does not depend on anyone opting into anything.

## When Reporting Lives Below the Decision

A codebase where a repository or a client already reports its own failures has the knowledge in one place and the action in another. The workaround is to pass the predicate downwards — a flag saying "this failure is expected here".

**That works, and it is a symptom.** Treat it as a transitional state, not as a design to reproduce:

- The predicate comes **from the caller** whenever the same failure means different things to different callers. Hard-coding it inside for everybody trades one flow's noise for another flow's silence, which is the worse of the two trades.
- The predicate may be **hard-coded inside** only when the failure always means the same thing there, for every caller, now and later. A write conflict under snapshot isolation is the clear case: it always means somebody got there first.
- Deciding severity is a judgement about what the failure means to the business. A repository making that judgement is doing something [repositories should not do](repository-no-business-logic.md).

## Reading First Does Not Avoid the Race

A flow that checks whether a row exists before writing it has avoided nothing. Under a snapshot isolation level both racers read the same snapshot and both find nothing, so the read cannot arbitrate — only the constraint can, and it does so by rejecting the loser.

Build the recovery around the rejection, not around trying to avoid it. See [transaction isolation levels](business-logic-entry-point-transaction-isolation-levels.md) for the write-conflict case.

## Why This Rule Exists

A rejection reached error tracking at `error` severity for a person who had just been served correctly, and sent somebody looking for a bug that was not there.

A false alarm does not cost the alarm. It costs the attention it takes from a real one, and the habit it builds of ignoring the channel.

## Review Questions

- Does this component fail — return its error — in every case where it cannot do its job?
- Does it also report, and if so, how does it know the failure mattered?
- Does the same failure mean something different to another caller of the same component? Then nothing inside it can decide.
- Does the error carry enough context for the caller to report it usefully?
- Is the failure that survives every recovery still reported?
- Is a "check before write" standing in for a recovery the constraint will have to arbitrate anyway?

## Report the Outcome

When finishing the task, state:

- which failures are reported, from where, and who decided they mattered;
- which are recovered from, and what still reports if the recovery fails;
- any predicate you had to pass downwards, and why reporting lives below the decision there.
