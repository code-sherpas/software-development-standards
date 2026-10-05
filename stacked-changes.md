# Stacked Changes

## Goal

**Stack a change only on a change it depends on.**

A stack is a chain of change requests where each one is reviewed on top of the one below it, and only the bottom one targets the trunk. It records a real dependency: this change needs code that is still in review. It is a tool for a high volume of changes, and it goes wrong in one predictable way: used as a default instead of for the problem it solves, it couples changes that have nothing to do with each other.

**This standard is provider-agnostic.** A *change request* is whatever unit the review platform reviews and merges — a pull request on GitHub, a merge request on GitLab, a change on Gerrit. Some platforms model stacks explicitly; GitHub's stacked pull requests are the example this organization has measured, and they are cited below where a behaviour was observed there. Where a platform does not model stacks, the rules still apply to change requests opened on top of each other by hand.

**What a stack buys, when the dependency is real**, compared with the alternatives:

- against **waiting for the lower change to merge** before starting the next: the work does not stop at every review, check run and pre-merge plan;
- against **one change request carrying everything**: each layer stays small enough to review properly, and is gated, deployed and reverted on its own;
- against **a change request on the trunk that also carries the lower change's commits**: its diff shows only its own work, the platform enforces the order so it cannot land before the change it needs, and the rebase after the lower one lands is done for you.

None of that applies when the changes are independent, and a stack still costs CI on every layer for every rebase.

## What Counts as In Scope

- opening a change request on top of another one that has not merged, whether or not the platform links them as a stack;
- adding a change request to an existing stack, reordering a stack, or dissolving one;
- merging any change request that belongs to a stack;
- the CI configuration that decides which checks run for stacked change requests.

Out of scope: how to split a change into commits within one change request.

## When to Stack

**Stack only when the new change request needs code from one that is still open.** The test: would this change compile, pass its tests and make sense against the trunk as it is today? If it would, it is not stacked; it targets the trunk on its own.

**There is no global stack.** A convention of "always stack on whatever stack exists" turns every open change into a dependency of every later one, and a stack enforces those dependencies:

- a layer can only land together with **every layer below it** — one red, unreviewed or unverified change at the bottom blocks everything above it, including work that never needed it;
- abandoning a layer in the middle blocks everything above it until the stack is restructured;
- a fix to a lower layer rebases every layer above it and runs all their CI again.

**One stack per line of work.** Order the layers by dependency: foundations below — shared types, schema, domain — and what uses them above. When the next change starts a different concern that does not need what is below, it starts a new stack or targets the trunk.

**Do not stack on somebody else's stack without agreeing it with them.** The layers below are theirs: their rebases rewrite your branch, their review blocks your merge, and your merge integrates their change.

**Keep stacks short and land them from the bottom.** A layer that is ready merges; it does not wait for the rest to be written. A stack that keeps growing while nothing lands is the global stack again, owned by one person.

**If a dependency turns out not to exist, take the change request out of the stack** and retarget it to the trunk, rather than letting the stack carry it.

## Working Inside a Stack

**Make each fix in the layer it belongs to**, then cascade the rebase upwards. A fix applied in a higher layer to work around a lower one leaves the lower layer wrong and the history misleading.

**Every layer must be validated against the stack's base, not only the bottom one.** Check that the platform actually runs the required checks on mid-stack change requests. A change request whose base is another feature branch can run no checks at all when the CI is configured to run only for changes against the main branch — and the code would then reach the main branch without any gate having seen it. Measured in this organization on GitHub: a pull request based on another branch reported no checks, and the same pull request linked into a GitHub stack ran every check, because GitHub evaluates each layer as if it targeted the stack's base. Linking the layers as a stack the platform recognises, or targeting the trunk, is what closes that gap.

**Push through the repository's sanctioned push path.** A stack tool's own push or sync command may bypass checks the repository relies on at push time. When the repository wraps `git push`, use the wrapper, branch by branch.

**The platform may rewrite your branches.** A server-side cascading rebase — on GitHub, triggered when the trunk moves or when a lower layer merges — force-pushes every branch above. Fetch before any `--force-with-lease`; a lease against a stale reference fails. When local and remote branches end up with the same trees, keep one coherent chain: all local or all remote, never a mixture.

## Integrating a Stack

**Merging a layer integrates every layer below it.** [Pre-merge gates](pre-merge-gates.md) apply to each of those changes, not only to the one whose merge was requested. Whoever merges layer N has therefore run the pre-merge plan of every unmerged layer below N, and verified Gate 1 for each of them.

### Which layer to merge

**Merge the lowest layer that is ready, one layer at a time.** That is the default, for four reasons:

- **Each merge integrates exactly one change**, so the gates are run once per change by whoever integrates it, and nobody answers for a layer they did not verify.
- **What was tested is what lands.** The lowest layer already sits on the trunk, so its head is exactly the tree the trunk will have after the merge.
- **Each deploy carries one change.** When [post-deploy verification](post-deploy-verification.md) fails, the failing layer is known and can be reverted alone; a deploy carrying five layers makes every failure an investigation of all five.
- **What is ready does not wait for what is not**, and the stack shrinks instead of growing.

Its cost is CI: each merge rebases every layer above, and they all run their checks again, so landing a stack of five layer by layer takes five CI cycles in sequence. That is paid in machine time; what it buys protects production.

**Merge a group — the top layer, or one in the middle — only when every layer in the group is ready, with its gates verified, and at least one of these holds:**

- **the layers are not separately meaningful in production** — they were split so the review would be readable, not so each could ship on its own: a schema and a backend nothing calls until the interface above them exists. The real change is the group;
- **the expensive checks run only at the top of the stack**, so the group lands from the top rather than on a skipped check (see below).

**Never merge a higher layer to carry along lower ones that are not ready** — another person's layer, or one whose pre-merge plan nobody ran. The merge lands them all the same.

- **Condition 1** holds for the stack as a whole: the stack must have a linear history on top of the current trunk.
- **Condition 6** is read per layer: each layer's diff must match what that layer claims, and the top layer's diff against the trunk must match the sum of them.
- **Asking permission to merge**, where a project requires it, is asked for every change request the merge will land, not only the one selected.

**A skipped check is not a passed check.** CI for stacks multiplies — a workflow runs once per layer, and again on every rebase — and some platforms let a workflow restrict expensive jobs to some positions in the stack, such as the top or the lowest unmerged layer. That is a legitimate saving only if no layer merges on the strength of a skipped job. If expensive jobs run only at the top, the stack lands as a whole from the top, or the layer is re-run before it lands on its own.

## Why This Rule Exists

Stacks are sold for high-volume work, and the volume is exactly what makes a default dangerous. With many changes open at once, one stack for everything means the slowest change sets the pace for all of them, every amendment re-runs CI across the whole chain, and whoever merges the top lands work they never verified.

## Review Questions

- Does this change request need code from an open one? If not, why is it stacked?
- Does every layer of the stack depend on the one below it, or are unrelated changes chained together?
- Is this stack somebody else's line of work, and did they agree to it?
- Did every layer run the required checks against the stack's base — and did none of them pass on a skipped job?
- When merging layer N, were the pre-merge gates verified for every unmerged layer below it?
- Is this merge landing the lowest ready layer? If it lands a group, is every layer in it ready, and is the group one change in production or gated by checks that only run at the top?
- Was each fix made in the layer it belongs to?

## Report the Outcome

When stacking or merging a stack, state:

- why each stacked change request depends on the one below it;
- which layers the merge integrated, and how the pre-merge gates were verified for each;
- if it integrated more than the lowest layer, why the group landed together;
- which checks ran on each layer, and whether any were skipped by position.
