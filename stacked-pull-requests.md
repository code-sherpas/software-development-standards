# Stacked Pull Requests

## Goal

**Stack a pull request only on a change it depends on.**

A stack records a real dependency: this change needs code that is still in review. It is a tool for a high volume of changes, and it goes wrong in one predictable way: used as a default instead of for the problem it solves, it couples changes that have nothing to do with each other.

## What Counts as In Scope

- opening a pull request on top of another pull request that has not merged, whether or not the platform links them as a stack;
- adding a pull request to an existing stack, reordering a stack, or dissolving one;
- merging any pull request that belongs to a stack;
- the CI configuration that decides which checks run for stacked pull requests.

Out of scope: how to split a change into commits within one pull request.

## When to Stack

**Stack only when the new pull request needs code from a pull request that is still open.** The test: would this change compile, pass its tests and make sense against the trunk as it is today? If it would, it is not stacked; it targets the trunk on its own.

**There is no global stack.** A convention of "always stack on whatever stack exists" turns every open change into a dependency of every later one, and a stack enforces those dependencies:

- a pull request can only merge together with **every pull request below it** — one red, unreviewed or unverified change at the bottom blocks everything above it, including work that never needed it;
- closing a pull request in the middle blocks everything above it until the stack is dissolved and rebuilt;
- a fix to a lower layer rebases every layer above it and runs all their CI again.

**One stack per line of work.** Order the layers by dependency: foundations below — shared types, schema, domain — and what uses them above. When the next change starts a different concern that does not need what is below, it starts a new stack or targets the trunk.

**Do not stack on somebody else's stack without agreeing it with them.** The layers below are theirs: their rebases rewrite your branch, their review blocks your merge, and your merge integrates their change.

**Keep stacks short and land them from the bottom.** A layer that is ready merges; it does not wait for the rest to be written. A stack that keeps growing while nothing lands is the global stack again, owned by one person.

**If a dependency turns out not to exist, take the pull request out of the stack** and retarget it to the trunk, rather than letting the stack carry it.

## Working Inside a Stack

**Make each fix in the layer it belongs to**, then cascade the rebase upwards. A fix applied in a higher layer to work around a lower one leaves the lower layer wrong and the history misleading.

**Every layer must be validated against the stack's base, not only the bottom one.** Check that the platform actually runs the required checks on mid-stack pull requests. A pull request whose base is another feature branch can run no checks at all when the CI is configured to run only for pull requests against the main branch — and the code would then reach the main branch without any gate having seen it. Linking the pull requests as a platform stack, or targeting the trunk, is what closes that gap.

**Push through the repository's sanctioned push path.** A stack tool's own push or sync command may bypass checks the repository relies on at push time. When the repository wraps `git push`, use the wrapper, branch by branch.

**The platform may rewrite your branches.** A server-side cascading rebase — triggered when the trunk moves or when a lower layer merges — force-pushes every branch above. Fetch before any `--force-with-lease`; a lease against a stale reference fails. When local and remote branches end up with the same trees, keep one coherent chain: all local or all remote, never a mixture.

## Integrating a Stack

**Merging a layer integrates every layer below it.** [Pre-merge gates](pre-merge-gates.md) apply to each of those changes, not only to the one whose button was pressed. Whoever merges layer N has therefore run the pre-merge plan of every unmerged layer below N, and verified Gate 1 for each of them — or merges from the bottom up, one layer at a time.

- **Condition 1** holds for the stack as a whole: the stack must have a linear history on top of the current trunk.
- **Condition 6** is read per layer: each layer's diff must match what that layer claims, and the top layer's diff against the trunk must match the sum of them.
- **Asking permission to merge**, where a project requires it, is asked for every pull request the merge will land, not only the one selected.

**A skipped check is not a passed check.** CI for stacks multiplies — a workflow runs once per layer, and again on every rebase — and the platform lets a workflow restrict expensive jobs to some positions in the stack, such as the top or the lowest unmerged layer. That is a legitimate saving only if no layer merges on the strength of a skipped job. If expensive jobs run only at the top, the stack lands as a whole from the top, or the layer is re-run before it lands on its own.

## Why This Rule Exists

Stacks are sold for high-volume work, and the volume is exactly what makes a default dangerous. With many changes open at once, one stack for everything means the slowest change sets the pace for all of them, every amendment re-runs CI across the whole chain, and whoever merges the top lands work they never verified.

## Review Questions

- Does this pull request need code from an open pull request? If not, why is it stacked?
- Does every layer of the stack depend on the one below it, or are unrelated changes chained together?
- Is this stack somebody else's line of work, and did they agree to it?
- Did every layer run the required checks against the stack's base — and did none of them pass on a skipped job?
- When merging layer N, were the pre-merge gates verified for every unmerged layer below it?
- Was each fix made in the layer it belongs to?

## Report the Outcome

When stacking or merging a stack, state:

- why each stacked pull request depends on the one below it;
- which layers the merge integrated, and how the pre-merge gates were verified for each;
- which checks ran on each layer, and whether any were skipped by position.
