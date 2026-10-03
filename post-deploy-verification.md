# Post-Deploy Verification

## Goal

**A change is not done when it merges, and not when it deploys. It is done when it has been used in production the way its real consumers will use it — and was seen doing what it claims.**

The consumer is whoever or whatever the change exists for: a person through the interface, another application through its contract, an agent through the path agents take. Verifying a change means standing where that consumer stands, in the environment they use, and doing what they do.

[Pre-Merge Gates](pre-merge-gates.md) stops a change from entering the main branch until it has been exercised; this standard stops it from being called finished until it has been exercised **where it runs**. They are two halves of one obligation and neither replaces the other.

## What Counts as In Scope

Every change that reaches production, by whatever route: a merged pull request, a direct push in trunk-based mode, a configuration or environment change made on the hosting platform, a change to a third-party tenant the product depends on.

**The exemptions are the closed list of [Gate 3](pre-merge-gates.md#gate-3-you-have-exercised-the-change-by-hand)**, and nothing else:

- documentation, comments, and commit or pull request text;
- `.gitignore`, editor configuration, and agent or tooling configuration that does not run inside the product;
- a test-only change with no production code touched;
- a change whose entire observable effect in production is covered by a check that already runs **against production** and that you can name — a synthetic monitor, an uptime probe on the exact path. A check that runs in CI is not one: it does not run where the change runs.

Everything Gate 3 lists as *looking* regression-proof — a rename, a dependency bump, a seed change, a copy change — is in scope here too, for the same reasons.

## The Rule

### Who and when

**Whoever integrated the change verifies it**, exactly as with the pre-merge gates. A report from the author, from another session or from another agent is evidence about their run.

**After the deploy that carries the change is live — confirmed, not assumed.** Check that the running version contains the change: the deployed commit, the image tag, the version the service reports. The main branch containing it says nothing about what is running. A deploy can still be building, can have been cancelled because a newer commit superseded it, or can have failed to build while every check on the pull request was green.

**Before the task is reported as done.** "Merged" and "deployed" are states of the pipeline; "done" is a claim about the product, and it waits for this.

### As the consumer does

Identify every consumer of the change, then use **their** path, not a shortcut to the same code:

- **A person** — the interface they use, in a real browser, through the real login, starting where they start. Not an internal endpoint, not a database query, not a page reached by a URL nobody would type.
- **Another application** — its contract: the same request it sends, authenticated the way it authenticates, reading the response the way it reads it. For a callback or a webhook, trigger the real event at the real sender when it can be done safely; a replayed payload proves the parser, not the integration.
- **An agent** — the tool, API or command an agent actually invokes, with an agent's credentials.
- **A scheduled or background job** — its effect: let it run on its own schedule in production, or trigger it the way production triggers it, and observe what it did. Not a direct call to its handler.

**None of these is a substitute:** a staging environment, a local stack, CI being green, the pre-merge plan having passed, the deploy log saying "live", a health check answering 200, logs showing the code path ran. A read of the production database or of observability can *complement* the verification — confirming a row was written, an error did not appear — but it does not replace using the change.

### What to observe

- **The claim.** Whatever the change says it does, seen doing it.
- **The neighbourhood.** At least one adjacent flow the change could plausibly regress, used the same way. A change is verified by what it did not break as much as by what it does.
- **The quiet signals.** Error tracking and logs over a window after the verification — a change can look perfect in the one path you drove and fail for the next request.

### With accounts and data that exist for it

Production verification needs an identity and a place to act that are **not a real customer's**:

- **Dedicated test accounts and test tenants or organizations**, marked as internal in product analytics so they never count as usage.
- **No real money and no real people.** Do not complete a real payment, connect a real payment provider, or send anything that reaches a person outside the team. If the change is about exactly that, the verification plan says how far to go and where to stop, and a person agrees to it before it runs.
- **Clean up what you create** — content, uploads, records — unless it is a fixture the next verification needs, and say which.
- **Credentials never pass through a conversation or a repository.** Whatever logs in the agent reads them from the environment it runs in.

**If the project has none of this, providing it is part of the work**, not a reason to skip the verification. The first change that needs it is the one that builds it.

### Write the plan down

A change that has to be verified in production carries a **post-deploy plan** in its description, next to its pre-merge plan: who the consumers are, which path each one takes, what to observe, and which accounts to use. Writing it is part of proposing the change, for the same reason the pre-merge plan is.

## When You Cannot Verify

**If you cannot verify the change in production autonomously and reliably, stop and ask for what you need.** Report, in one message:

1. which consumers and steps you can verify and which you cannot;
2. for each one you cannot, **why** — the missing account, credential, permission, tenant setting, tool or access;
3. **the concrete actions that would unblock you**;
4. whether a person running the steps and reporting back is acceptable for this change, and what exactly they should look at.

Then wait. Waiving the verification is the person's call and must be explicit. It is never yours to infer from the change being small, from the deploy being green, or from it being late.

## When It Fails

**Stop, and tell the person immediately.** Do not keep iterating against production, and do not revert or push a fix on your own initiative. In one message:

1. **what fails**, and how you reached it — the path, the account, what you saw;
2. **who is affected and since when** — which consumers, from which deploy;
3. **the evidence** — the response, the screenshot, the error-tracking event, the log line;
4. **the options as you see them** — reverting the change, or the fix you would make and how long it would take to pass its gates — and what each one costs.

The person decides whether to revert or fix forward. Until they do, the change is not done, and the task is not reported as done.

## Why This Rule Exists

Every gate before production runs somewhere else. Production differs from all of them in the ways that matter most:

- **Configuration lives outside the repository.** Environment variables, secrets, feature flags, and the settings of third-party tenants — the identity provider, the payment provider, the analytics project — are set by hand per environment, and nothing compares them to what the code expects.
- **Third parties are different tenants.** The identity provider in development and test can offer a password login while production offers only a social one; a flow that works in every pipeline cannot even be reached in production. Measured in this organization.
- **The build itself is different.** A production build can fail, or be cancelled, while every check on the pull request was green — and the previous version keeps running, looking exactly like the new one from the outside. Measured in this organization.
- **The data is different.** Volume, history, and the rows written by versions that no longer exist — none of which a fresh test database has.
- **Consumers behave differently from tests.** Real browsers, real clients, real automated traffic — analytics tools, for instance, drop events from automated browsers, so an agent's session leaves no trace there unless someone checks.

A change that passed every gate and was never used in production has been verified everywhere except the one place it exists for.

## Review Questions

- Is the deploy carrying this change live, and how do you know — the running version, not the branch?
- Who are this change's consumers, and which path does each of them take?
- Was each path used in production the way that consumer uses it, or through a shortcut to the same code?
- What adjacent flow could this have broken, and was it used too?
- Did error tracking stay quiet over a window after the verification?
- Were the accounts and data dedicated to testing, marked as internal, and cleaned up?
- Did any credential pass through a conversation or a repository?
- If verification failed or could not be done, was the person told — with the evidence — and did they decide?

## Report the Outcome

When finishing a change, state:

- which deploy carried it, and how you confirmed it was live;
- each consumer, the path you used for it, the account you used, and what you observed;
- the adjacent flow you used and what you observed;
- the error-tracking window you checked;
- what you created in production and whether you removed it;
- any step you could not verify, why, and who waived it, in which words.
