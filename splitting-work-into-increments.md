# Splitting Work into Increments

## Goal

**Before a refined task is built, split it into the smallest increments of functionality usable in production, tie them with a dependency graph, decide the order and the feature-flag strategy, and leave each increment in the project's task tracker with exactly what is needed to ship it — and nothing the task already says.**

A task is shipped one increment at a time: each one reaches production, is used and is verified before the next builds on it. Splitting decides that sequence once, with the person, instead of leaving each session that builds to decide what comes next from scratch.

This is the phase after [Refining Work](refining-work.md), and after the prototype when the task needs one. It starts in a new session, from the task.

## What Counts as In Scope

A task that has been refined — see [Refining Work](refining-work.md) — and prototyped, if it needs a prototype, and that is about to be built: from a single increment to an initiative of dozens.

Out of scope:

- a request whose outcome, limits or behaviour are not yet settled: refine it first;
- a task already split, whose increments are being shipped: that is [Shipping Increments](shipping-increments.md).

## The Rule

### 1. Read the task, and the code through sub-agents

Read the task and, if it has one, the validated prototype. Splitting reads the code as a whole, not only the facts refining checked: what already exists decides what has to be replaced, where a flag can go, and what has to change first. Every question about the code is delegated to a sub-agent that returns the conclusion and where it comes from, never the files.

**Correct the task when the code proves it wrong.** If something the task assumes is false — a capability that does not exist, a rule the code does not hold — correct the task before splitting on top of it, and mark the correction for the person to review. If the correction changes what the work does or for whom, ask first.

### 2. What an increment is

Each increment:

1. **Is used for real, in production, end to end** — by a person through the interface, or by another system through its contract.
2. **Is as small as possible**: take anything out and it stops being usable.
3. **Ships alone**: it passes every gate before merging without anything that is not yet in the main branch. If it would expose something half done, or replace something that exists, it goes behind the flag.
4. **Can be verified**: it names the user stories it delivers and where they are checked.

**An enabling increment** — a refactor, a migration, a rename — with no use of its own is allowed only when no usable increment can be built without it, and it names the increment it unblocks.

**Every user story of the task is delivered by some increment.** By default one story is one increment. A story too large to ship as the smallest usable step is split, simplest path first and its edge cases after; stories that are not usable apart are joined. Each increment cites the stories it covers, whole or in part — "4 (without external guests)" — so the coverage can be checked by adding them up.

### 3. The graph, the order and the flag

- **Dependencies are the tracker's blocking relation** between increments, not text in their pages: an increment is blocked by every increment it cannot ship without.
- **The order** is the order of delivery: the graph allows it, and the most valuable increments come as early as the graph lets them.
- **What is uncertain is proven in the first increment that needs it**, not at the end. When an increment depends on something not yet proven — an external service, a technical limit, a new piece nobody knows will hold — its acceptance includes proving it under real conditions: the number of people, the duration, the size. For example: "a 3-hour lesson with 100 people is recorded and transcribed".
- **The flag strategy** says which flag, which increments ship behind it, and which increment turns it on — the one that replaces what existed, if anything did. If no flag is needed, it says so.

### 4. Each increment's page

Each increment is a subtask of the task, in the project's task tracker, with:

- **Title**: what someone can do once it is shipped, in the product's words.
- **Stories**: the numbers it delivers, whole or in part.
- **Acceptance**: concrete scenarios, including who must be refused.
- **Where it is verified**: the page, endpoint or job where it is checked.
- **Design**: the prototype screens it implements, if any.
- **Flag**: whether it ships behind one, and which.
- **Enables**: for an enabling increment only, what it unblocks and why that cannot be built without it.
- **Decisions**: empty when created. Shipping it fills it in.

Nothing the task already says is repeated: every session that ships the increment reads both. No file paths and no code.

**Before an increment is planned as a new subtask, search the tracker for a task that already tracks its work**, as [Creating Tasks](creating-tasks.md) requires. The plan says which existing task each such increment extends or replaces, and that is confirmed with the rest of the plan.

**Sub-items the task had before it was split** — written before it was refined, such as the findings of an audit — do not decide how many increments there are or what each one holds. Together, the increments cover at least everything those sub-items covered. Once the plan is confirmed, those sub-items are deleted and the increments created in their place.

### 5. The task keeps the plan and the state, nothing else

Add to the task:

- **Plan**: the order, the flag strategy and the graph, as a diagram the tracker can render, or as an ordered list with each increment's dependencies if it cannot.
- **State**: one line per increment — pending, in progress or shipped, and its change request. Shipping keeps it up to date. It is the only place a new session needs to read to know where to carry on.
- **Next step**: the instruction to start shipping.

Decisions and details live in each increment, not here: the task is read by every session that follows, and its size is paid on each of them.

### 6. Confirm once, then create

Show the whole plan in one message: the increments with their stories, the graph, the order and the flag strategy, and, if the task had sub-items before, which increments cover each one and that they will be deleted. Ask once whether to create it. Apply exactly the edits the person asks for and show them; do not reopen the task. Then delete the task's earlier sub-items, if it had any, create the increments and their blocking relations, update the task, and check that they read back as written.

### 7. Hand off

Splitting ends here. End with the exact instruction to carry on, ready to copy: clear the context — in Claude Code, `/clear` — then start shipping with the task's link, by the name the agent runtime lists the skill under — in Claude Code with the `base` plugin, `/base:ship-increments <task link>`. An agent cannot clear its own context: the person does. If the person asks to carry on in this same session instead, say once what it costs — every call of what follows carries this session's context again — and carry on only if they confirm.

## Why This Rule Exists

**Measured in this organization:** an initiative split this way — some thirty increments, each with its blockers, behind a flag until the increment that replaced the old experience — reached production complete and verified in eight days. Its parent task also kept every decision of every increment and grew to 87,000 characters, read in full by every session that resumed the work. Decisions now live in each increment, and the task keeps only the plan and the state.

## Review Questions

- Can each increment be used in production by someone, on its own, once it ships?
- If the task had sub-items before it was split, do the increments cover everything they covered, and were they deleted?
- Could any increment be smaller and still be usable?
- Does every enabling increment name what it unblocks, and is there no usable way around it?
- Do the increments, added up, deliver every user story of the task?
- Is every dependency a blocking relation, and does the order respect them?
- Does every increment that depends on something unproven prove it, under real conditions, in its acceptance?
- Does the flag strategy say which increment turns the flag on, or that none is needed?
- Does any increment repeat what the task says, or carry file paths or code?
- Was every wrong assumption the code revealed corrected in the task, and marked for review?

## Report the Outcome

When splitting ends, state:

- the task and its increments, with links, in delivery order;
- the standards read in full, and why each one applies;
- the flag strategy;
- the corrections made to the task, for the person to review;
- the next phase, as the exact instruction to clear the context and run it with the task's link.
