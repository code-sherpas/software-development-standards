# Expand-Contract Schema Changes

## Goal

**During a deploy, two versions of the application run against the same storage at once. Every change to what is stored must work for both.**

The version being replaced keeps serving requests and running its jobs until the new one takes over — seconds on a good day, minutes on a slow build or a cold start, longer if the new version fails its health check and the old one is kept. A schema change applied before or during that window is read by code written for the schema it just replaced.

So a change that removes, renames or narrows what the running version reads is never shipped in one step. It is split: **expand** — add the new shape alongside the old one; **migrate** — move the data and the code over; **contract** — remove the old shape, in a later deploy, once no running version reads it.

## What Counts as In Scope

Anything stored that a running version of the application reads or writes, whatever the storage technology:

- relational schemas: tables, columns, types, constraints, enum values, indexes the code depends on;
- document and key-value stores: field names, nesting, value shapes;
- messages left in a queue or a stream, and events in a log, that the next version will consume;
- cached values and serialized objects that outlive the version that wrote them;
- files and objects whose layout or key scheme the code assumes.

A change is **destructive** when the version currently running would fail against the result:

- removing or renaming a table, collection, column, field or key;
- changing a type to one the running code cannot read or write;
- tightening a constraint the running code may violate — `NOT NULL` on a column it leaves empty, a new unique index, a narrower enum;
- moving data so that it is no longer where the running code looks for it.

Adding something nullable or optional, adding a table, adding an index nothing depends on, and loosening a constraint are not destructive: the running version ignores them.

## The Rule

**1. A destructive change never ships in the same deploy as the code that needs it.**

Split it across deploys, each of which is safe against the version before it:

| Deploy | Storage | Code |
|---|---|---|
| **Expand** | The new shape is added next to the old one. Nothing is removed. | Writes both shapes, or writes the old one and can read both. |
| **Migrate** | Existing data is copied or transformed into the new shape — a backfill, run and verified as a data migration (see [Pre-Merge Gates](pre-merge-gates.md), Gate 4). | Reads and writes only the new shape. |
| **Contract** | The old shape is removed. | Already not touching it — that was the previous deploy. |

Steps may be combined when the result is still safe against the version before it: expand and migrate can often ship together. **Contract never ships with the code change that stopped using the old shape.** It waits until that code is the version running everywhere, confirmed — not merged, deployed.

A rename is an add, a copy, a switch and a drop. It is never a rename.

**2. The contract step names what made it safe.**

Whoever writes the contract step states, next to it, which deploy removed the last reader of the old shape: the commit or release that is confirmed running, and how it was confirmed. A contract step that cannot name it is not ready.

**3. The repository enforces this with an automated check.**

A rule that depends on someone remembering it is followed until the day it is not. Every repository that changes a stored schema carries a check, run by the gate every change passes through to reach the main branch, that:

- detects destructive operations in new migrations — or the equivalent change for the storage in use;
- fails unless each one carries the declaration of rule 2, in a form the check can read;
- ignores migrations already applied before the check existed, so it starts enforcing from now on without rewriting history.

The check cannot know whether the declaration is true. It makes the question unavoidable, puts the answer where a reviewer reads it, and turns "we forgot" into a failing build instead of an incident.

**4. Readers are made tolerant before writers change.**

When the change is to something written by one version and read by another — a message format, a cached value, an event — the readers that must accept the new shape are deployed first, and only then the writers that produce it. The same split applies in reverse to retire the old shape.

## Why This Rule Exists

**Measured in this organization, twice in one week.** On 2026-10-03 a migration renamed a table; on 2026-10-08 another renamed and moved columns. Both shipped in the same deploy as the code that used the new names. Each time, the hosting platform ran the migration before starting the new version, the old version kept running its background jobs against the migrated database for three to six minutes, and every job that touched those tables failed — *"The column `Transcript.virtualMeetingRecordingId` does not exist in the current database"*. Seven error-tracking issues, a few hundred events, and any person who opened those screens in the window got an error.

Nothing in the pipeline could see it. Every check runs one version against one schema, and in that pairing the change was correct. The failure exists only in the pairing no test builds — the old code against the new schema — which is exactly the pairing every deploy produces.

**And it is the cheap case.** A destructive change that ships with its code also cannot be rolled back: reverting the code brings back a version that reads a shape the database no longer has. Expand-contract keeps the previous version runnable at every step, which is what makes a revert an option.

## Review Questions

- Does this change remove, rename or narrow anything stored that the version now running reads?
- If so, is it split so that each deploy is safe against the version it replaces?
- Is a contract step shipping in the same deploy as the code that stopped using the old shape?
- Does the contract step name the deploy that removed the last reader, and say how it was confirmed running?
- Is there a backfill, and was it run against a representative dataset?
- For a message, event or cached value: are the readers ready before the writers change?
- Does the repository's check see this change, and does it pass for the right reason?

## Report the Outcome

When finishing a change that touches what is stored, state:

- whether it is destructive, and why or why not;
- which step of expand, migrate or contract it is, and what the next one is;
- for a contract step, the deploy that removed the last reader and how it was confirmed running;
- that the repository's check ran on it, or that the repository has none yet — and then that adding it is part of the work.
