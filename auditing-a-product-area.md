# Auditing a Product Area

## Goal

**Establish, with evidence, how far an existing area of a product meets every standard that applies to it, and leave every finding in one task in the project's task tracker — what happens, where, how it was observed, what it costs and which rule it breaks — so that refining can turn the findings into decisions. The audit finds; it does not propose solutions.**

A product area that was built over time, by several people, from requests that were never fully settled, accumulates what no check sees: rules the interface contradicts, states nobody designed, goals a person cannot complete, components built beside the design system, code that drifted from the standards. None of it fails a test. It surfaces one person at a time, as confusion or as a request for help, until someone looks at the area as a whole.

**Finding and deciding are separate on purpose.** An audit reads a great deal — code, documentation, the product in production — and the solutions that serve a person best usually resolve several findings at once, which only shows once they are all on the table. So the audit leaves the findings, and [Refining Work](refining-work.md) decides, in a new session, with the person, from the task alone.

## What Counts as In Scope

A request to audit an existing part of a product — a capability, a module, a set of screens, a flow — or to establish whether it is ready for a use it has not had yet, such as real customers, more of them, or a new kind of user.

Out of scope:

- a reported error: that is [Fixing Reported Errors](fixing-reported-errors.md);
- reviewing a change before it merges: that is the reviewer's role in [Shipping Increments](shipping-increments.md);
- a request for something that does not exist yet: there is nothing to audit, and it goes straight to refining.

An audit is not a mandatory step before refining. It is for an area that exists and whose state is not known.

## The Rule

### 1. Delimit the area

- Name the area in the product's own terms, and list what is in it and what is not.
- Name its neighbours: what it reads from, and what reads from it.
- **When the request names several areas, audit them one at a time, in the order of their dependencies** — first the one the others depend on, directly or indirectly. Each gets its own audit and its own task, and the next area is audited once the previous one has been refined: auditing an area whose foundation is about to change finds what the change will remove, and its findings go stale before anyone decides on them.

### 2. Choose the standards

Read the standards index, then every standard that applies to anything in the area — its code, its interface, its data, its entry points, its integrations — in full. The scope is every applicable standard — the ones about the code, such as the domain model, the entry points, persistence, the error model and the layout, as much as the ones about the interface — not a subset chosen in advance: the area is touched once to bring it in line, rather than once per kind of concern. Every sub-agent the audit uses reads the index and the standards for its own part itself.

### 3. Make the inventory

The inventory is what makes the audit exhaustive: every finding is about one of its items, and every item is checked against every standard that applies to it. Build it from the documentation, checked against the code — through sub-agents that return facts with their source, never the files:

- **entities** and their lifecycles;
- **entry points** — operations, queries, endpoints, jobs — each with the rules that decide it and every outcome it can return;
- **screens and paths**, including how each is reached from the navigation;
- **roles, permissions and the switches** that open or close parts of the area per customer or per plan;
- **states**, as [Unambiguous States](unambiguous-states.md) enumerates them;
- **goals**: what each kind of person comes to do in the area, from start to finish, as [No Dead Ends](no-dead-ends.md) asks.

### 4. Observe

Each item is observed where it can be observed truthfully, and a finding rests on observation, or on code read through a sub-agent with a path to reproduce it. A finding reached by reasoning alone is a candidate until one of those confirms it.

- **In production, with dedicated test accounts, without changing anything.** That is where real data, real volumes, every configuration customers have, and what is actually deployed can be seen. Observe every configuration that changes the area's behaviour — each kind of customer, plan, role, language — on every device mode the product supports. Nothing is created, changed or deleted there: a state that needs a write is observed locally.
- **Locally, for the states that must be provoked**: empty, failed, refused, at the limits, racing. Refused paths are exercised by calling the operation as the refused identity, not by looking at the screen, as [Pre-Merge Gates](pre-merge-gates.md) Gate 6 describes.
- **In the code and the documentation**, through sub-agents, for the rules, the outcomes and the states the product does not show — and for every standard whose subject is the code itself.

### 5. Record each finding

Each finding carries what refining needs to judge it without redoing the investigation, and no solution:

- **what happens**, in the product's language, from the side of whoever meets it;
- **where and how to reproduce it**: the screen or operation, the steps, the identity;
- **where it was observed**: the environment, the configuration, the data;
- **its consequence**, one of:
  - *access* — someone can do or see what they must not, or cannot what they must;
  - *data* — data lost, corrupted, wrong, or left behind;
  - *experience* — wrong behaviour, an ambiguous state, a dead end, an incoherence, an accessibility or language failure;
  - *internal* — a departure from a standard that no person notices today;
- **the rule it breaks**: the standard, and what that standard demands. That is not a solution; it is what any solution will have to meet;
- **the evidence**: captures, requests and responses, sourced facts.

Before recording a finding, look for it in the tracker, as [Creating Tasks](creating-tasks.md) requires. A finding already tracked is listed with its link, not described again. A reported error the audit stumbles on is recorded as a finding and marked as one, so that it can go to [Fixing Reported Errors](fixing-reported-errors.md). A discrepancy between the product documentation and the code is a finding too: the code says what happens.

Name screens, operations and jobs as the product names them. No file paths and no code: they go stale before the findings are resolved.

### 6. Write the task

One task per area, in the project's task tracker — ask where, if the project's instructions say to ask. Before creating it, search for a task that already audits or refines the same area, as [Creating Tasks](creating-tasks.md) requires. It contains:

- **Area**: what is in, what is out, its neighbours.
- **Standards applied**: every standard checked, and the ones that turned out not to apply, with why.
- **Coverage**: the inventory, and for each item what was checked and where; what could not be checked, and why.
- **Findings**, numbered, grouped by consequence. Later phases cite them by number, so the numbers never change.
- **Already tracked**: the existing tasks the audit found, with their links.
- **Unknown**: facts neither the documentation nor the code holds.
- **Next step**: refining, from this task.

If the project has no task tracker, ask how to proceed. Do not leave the findings only in the conversation.

### 7. Hand off

The audit ends at the task. Say that refining comes next, in a new session, from the task, and end with the exact instruction to carry on, ready to copy: clear the context — in Claude Code, `/clear` — then run the refining skill with the task's link — in Claude Code with the `base` plugin, `/base:refine <task link>`. The person decides there which findings block the use the area is meant for.

## Why This Rule Exists

**Measured in this organization, 2026-11-07,** looking at one product's learning areas before opening them to real customers: the skill taxonomies could be reached only by typing their address; the progress of a learning path was computed once and never again; the documentation described assessments with several reviewers while the model allowed one; four permissions decided which shortcuts appeared on a home page and restricted nothing; read-only viewers of career ladders saw the drafts. Every check was green, and each of these had shipped in a change that its own review approved, because each review looked at one change and none at the area.

## Review Questions

- Is the area named, with what is in it, what is not, and its neighbours?
- When several areas were asked for, was each audited alone, in dependency order, after the previous one was refined?
- Were every applicable standard and the index read in full, by the audit and by each sub-agent?
- Does the inventory cover entities, entry points with their outcomes, screens and paths, roles and switches, states and goals — and was every item checked against every standard that applies to it?
- Does every finding rest on observation or on code with a path to reproduce it?
- Was production only observed, and was every configuration that changes the area's behaviour observed?
- Does every finding carry what happens, how to reproduce it, where it was observed, its consequence, the rule it breaks and the evidence — and no solution?
- Were findings already tracked linked rather than described again?
- Is the task free of file paths and code, and does it end with the instruction to refine it?

## Report the Outcome

When the audit ends, state:

- the task, with its link;
- the standards read in full, and why each applies;
- the coverage: what was checked, where, and what could not be;
- how many findings, by consequence;
- the next phase, as the exact instruction to clear the context and refine the task.
