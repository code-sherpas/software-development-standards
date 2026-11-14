# Refining Work

## Goal

**Before a piece of work is split or built, turn the request into one task in the project's task tracker that settles what will be done and why, with no question left open, so that anyone — a person, or a later session that never saw this conversation — can carry it on from the task alone.**

A request is somebody's first draft: it names a wish, rarely its limits, and uses words that mean different things to different people. Building from it leaves each question to whoever meets it in the code, one at a time, each with less context than the person who asked. Refining settles them all at once, while that person is still there to answer.

**The conversation is not the record.** Refining ends with the conversation closed and the task as the only thing the next phase reads. The next phase starts in a new session; a session that carries the whole refinement into the building rereads all of it on every step.

## What Counts as In Scope

Any request whose outcome, limits or behaviour are not yet settled: a new capability, a change to an existing one, an initiative made of many of them.

Out of scope:

- a reported error: that is [Fixing Reported Errors](fixing-reported-errors.md);
- work whose task already settles everything below: there is nothing to refine.

## The Rule

### 1. Start from the request and the documentation

Read the request — the task, if it already exists in the tracker — and the documentation the project keeps of its product and of its code before asking anything. A question the documentation already answers is not asked.

**Before asking anything, search the tracker for a task that already covers the request, an equivalent one, or one whose scope should include it**, as [Creating Tasks](creating-tasks.md) requires. When there is one, that task is the request.

**A task that already exists is the request, and the refined task overwrites it.** Its text, and its sub-items' if it has any, are what was asked: the sub-items are not refined one by one. The refined task covers everything they asked, or names it as out of scope. When it is published, it replaces the task's text. The sub-items that existed before are left as they are until splitting, which decides what replaces them.

**Facts come from the documentation, checked against the code.** Finding one is delegated to a sub-agent that returns the fact with the place it came from, never the files; the conversation keeps the conclusion. The documentation gives the vocabulary and the intent. A fact about how the product behaves today that the task will rest on — one that, if false, would change a decision — the sub-agent also checks in the code, without asking the person: the documentation may be out of date, and the code is what the product does. When the two disagree, the code says what happens today, and the task notes the discrepancy so the documentation is corrected when that part is shipped. A fact neither holds is said to be unknown.

The code informs the facts, never the decisions: what the work will do is settled with the person, not inferred from what already exists, and no file path or code goes in the task. Checking only the facts the task rests on keeps each sub-agent from reading half the repository.

### 2. Interview until nothing is open

- **Ask one question at a time**, with the answer you recommend and why, so the person can agree in one word. Ask first the one whose answer settles the most: an answer often makes later questions unnecessary, and those are not asked. Facts can be looked up meanwhile; each new question is composed from every answer and fact so far.
- **Challenge the words.** A term used differently from the documentation, or vaguely, is named and settled: "the documentation calls X what you seem to mean by Y — which is it?"
- **Test with concrete scenarios.** Invent the cases that probe the limits — the empty, the many, the one who must be refused, the one who arrives late — and ask what happens in each.
- **Surface contradictions** between what is said and what is documented, or between two answers. Never pick a winner silently.

The interview ends when no question is open. A question the person chooses to leave open is written in the task as open, with what it blocks.

### 3. Record in the task, not in the product documentation

Terms that are new or change meaning, and every decision, go in the task. The product documentation describes what the product does, so it changes when each part of this work reaches production, not now: written here, it would describe something that does not exist yet, and the plan may still change on the way.

### 4. Write the task

The task is the shortest text that leaves nothing open. Every later session reads it, so its size is paid again on each of them.

It contains:

- **Problem**: what is missing or wrong, for whom, and why it matters.
- **Solution**: what will exist when it is done, in the product's own words.
- **Terms**: each term this work introduces or changes, defined in one line.
- **User stories**: a numbered list — "as \<who\>, I want \<what\>, so that \<why\>" — covering every kind of person or system it touches, including whoever must be refused. Later phases cite them by number, so the numbers never change; new ones are appended.
- **Access control**: who may do each thing, and who may see each piece of data, including listings and searches.
- **Decisions**: each with its reason and with who took it, the person or the agent. An agent's decision is marked for the person to review.
- **Where it is verified**: the public boundaries — a page, an endpoint, a job — where its behaviour will be tested and checked.
- **Out of scope**: what this work does not do, so that no later phase invents it.
- **Design**: whether it needs a prototype before it is split, because it adds or changes an interface.
- **Next step**: the phase that comes next, so that a new session knows where to start.

No file paths and no code: they go stale before the work ends. A brief shape — a payload, a signature — is allowed when it states a decision more precisely than prose.

### 5. Confirm once, then publish

Show the whole draft in one message and ask once whether to publish it. Apply exactly the edits the person asks for and show them; do not reopen the interview or add improvements nobody asked for. Then create the task in the tracker, or overwrite the existing one, and check that it reads back as written.

If the project has no task tracker, ask how to proceed. Do not leave the result only in the conversation.

### 6. Hand off

Refining ends here. Say which phase comes next — the prototype, if the task says it needs one, or splitting it — and that it starts in a new session from the task.

**When the agent runtime lets the agent start sessions, offer to start that one, and to end this one once it has.** The new session gets the task's link as its only context and runs the next phase's skill, by the name the runtime lists it under — in Claude Code with the `base` plugin, `/base:build-prototype <task link>` or `/base:to-increments <task link>`. Start it only if the person accepts, never on your own. Once it has started, end this session if the runtime allows it — whatever ending one means there: archiving it, closing it, finishing it.

**When the runtime does not let the agent start sessions, or the person declines, end with the exact instruction to carry on, ready to copy**: clear the context — in Claude Code, `/clear` — then run the next phase's skill with the task's link. The person does what the agent cannot, and the instruction leaves them nothing to work out.

If the person asks to carry on in this same session instead, say once what it costs — every call of what follows carries this session's context again — and carry on only if they confirm.

## Why This Rule Exists

**Measured in this organization, 2026-11-01:** in the repository where most work happens, a call to the model carried a median of 566,000 tokens of context, and sessions that went from understanding a request to building it in one conversation lasted days. Reading that context again on every call was two thirds of all the usage. The same initiative, run phase by phase from a task, needs each phase to read only the task and what that phase produces.

A task that leaves questions open moves them into the code, where each one is answered alone, by whoever meets it, with the least context.

## Review Questions

- Could someone who never saw the conversation carry the work on from the task alone?
- When the request was a task that already existed, did the refined task overwrite it, and does it cover everything it and its sub-items asked, or name it as out of scope?
- Is any question still open without being written as open, with what it blocks?
- Does every user story name who it is for, and is whoever must be refused covered?
- Does the access control cover listings and searches, not only the actions?
- Is each decision attributed, and is each of the agent's marked for review?
- Was a fact the task rests on taken from the documentation without being checked in the code, or left only in the conversation?
- Is every term this work introduces or changes defined in the task?
- Is the task free of file paths and code?
- Was the next phase's session started only after the person accepted, from the task alone — or, where the runtime cannot start one, was the exact instruction to carry on given instead?

## Report the Outcome

When refining ends, state:

- the task, with its link;
- the standards read in full, and why each one applies;
- the decisions taken by the agent, for the person to review;
- the questions left open, if any, and what each blocks;
- the next phase, as the offer to start its session from the task — or, when the runtime cannot start one, as the exact instruction to clear the context and run it with the task's link.
