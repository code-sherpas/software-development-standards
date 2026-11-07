# No Dead Ends

## Goal

**From every situation a person can reach, there is a way forward towards what they came to do — or the product says why there is none and who can open one.**

A dead end is a situation where the person needs to do something and the product gives them no way to: an item they created and cannot correct, a process stuck in a state nothing leaves, a prerequisite they discover only by failing, a permission they lack with nobody named who can grant it, a feature they cannot find. They stop, ask for help outside the product, or work around it — and each of those is the product failing at what it is for, without any error being reported.

## What Counts as In Scope

- Any change that produces or changes an interface a person operates, or a flow through it.
- Any change to business logic that decides what a person can do next: a lifecycle, a permission, a precondition, a limit, a deletion rule.
- Settling, while refining or splitting work, what an interface will do — the decisions that later phases build — as [Refining Work](refining-work.md) and [Splitting Work into Increments](splitting-work-into-increments.md) do.
- Judging whether an existing product area meets this standard, as [Auditing a Product Area](auditing-a-product-area.md) does.

Out of scope: refusing what a person must not do. A refusal is not a dead end when the rule is right; what this standard governs is that the refusal says what it can, as rule 3 asks.

## The Rule

### 1. Every goal can be completed inside the product

For each kind of person the area serves, list what they come to do, from start to finish. Each of those goals can be completed through the product — without editing data by hand, asking a developer, or opening a support ticket — unless the product decides otherwise and says so where the person meets it.

### 2. Every state can be left

- Every screen, dialog and flow can be cancelled, closed or left the way the person expects, without losing what they did unless they chose to.
- **Every state of an item has a way out**, including the terminal-looking ones — failed, incomplete, expired, rejected: retry, reopen, extend, duplicate, or delete. When a state really is final, the product says so, and why.

### 3. A refusal says what it can

When a person cannot do something they would reasonably expect to, the product says why and what would change it: the missing permission and who can grant it, the missing configuration and where it is set, the state that must come first. It names roles, not private people, and it never reveals what the person may not know — see [Unambiguous States](unambiguous-states.md) for a refusal that must also cover a resource's absence.

### 4. Mistakes can be corrected

- What a person can create, they or someone named can correct and remove, unless a rule forbids it — and then the product says so before the person commits, not after.
- An action that destroys or cannot be undone is confirmed, naming what it destroys, or can be undone for a while.
- An error in input keeps the input, says what to fix, and lets the person fix it in place.

### 5. Prerequisites lead somewhere

When an action needs something that does not exist yet — a category before an item, a template before an instance, a member before an assignment — the product says so at the point of the action and leads to where the prerequisite is created, or creates it in place. Nobody learns about a prerequisite by failing.

### 6. Every capability can be found

Every capability a person may use is reachable through the product's navigation, in the place they would look for it. A capability reachable only by knowing its address is not offered.

### 7. Work scales with what people need to do

When a person routinely needs to do the same thing many times — add fifty members, assign thirty people, change twenty items — there is a way to do it at that scale, or the gap is a finding with how often it happens and how long it takes.

### 8. Interruptions do not cost the work

Leaving a flow halfway keeps what was done, or warns before discarding it. A failure of the network or the server keeps what the person entered and lets them try again.

## Detection

1. **Walk every goal.** For each kind of person, take each goal of rule 1 and try to complete it in the product, from the state a new person starts in — no data, no permissions beyond those they get by default — and from the states a long-time person reaches. Every step where they cannot go on is a finding. This is a cognitive walkthrough: at each step, would they know what to do, could they do it, and would they know it worked?
2. **Try to leave every state.** For every state of every item, find the way out.
3. **Be refused.** As each role, try what that role may not do, and read what the product says.
4. **Make mistakes.** Create something wrong and try to correct and remove it; submit wrong input; interrupt flows halfway.
5. **Look for capabilities without a way in.** Compare what the logic and the routes offer with what the navigation reaches.

## Review Questions

- Can every goal of every kind of person be completed inside the product?
- Does every state of every item, failed and expired included, have a way out or say why it is final?
- Does every refusal say why and what would change it, without revealing what it must not?
- Can what was created be corrected and removed, and is every destructive action confirmed or undoable?
- Does every prerequisite lead to where it is created?
- Is every capability reachable through the navigation?
- Is there a way to do at scale what people need to do many times?
- Does an interruption or a failure keep the person's work?

## Report the Outcome

When finishing work in scope, state:

- the goals the change lets people complete, and which they walked through;
- the states whose way out the change added or changed;
- any dead end that remains, with how often a person meets it, the reason, and who accepted it.
