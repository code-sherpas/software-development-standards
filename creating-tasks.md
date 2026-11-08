# Creating Tasks

## Goal

**Before a task is created in the project's task tracker, search the tracker for a task that already covers the same work, an equivalent one, or one whose scope should include it — and when there is one, extend that task instead of creating another.**

A tracker is only useful while each piece of work lives in one place. A second task for work that is already tracked splits it: its history, its decisions and its findings end up in two pages, each one incomplete, each one claiming to say what is open. Two sessions pick up the same work from two pages without knowing, or one closes its page while the other stays open and lies. And a task that should have been part of a broader one is decided apart from it, when it would have been decided better together.

Searching takes a minute. Merging two tasks that have already been worked on takes far more, and is often never done.

## What Counts as In Scope

Creating any task in the project's task tracker — a task, a subtask, a defect, a finding, an increment — by any agent or person, whatever the work that leads to it:

- the task refining writes, the one an audit leaves, the defect triage records, and the increments splitting creates;
- a problem, a pending item or an improvement noticed along the way and recorded so it is not lost;
- a task someone asks for directly.

Out of scope:

- editing, moving or closing a task that already exists, when nothing new is created;
- recording something as part of a task that already exists, a section or a comment in it: that is already the outcome this standard asks for.

## The Rule

### 1. Search before creating

Search every place in the tracker where the work could already be: the database or project where the new task would go, and the others the project keeps for related work — each milestone's tasks, a backlog of known problems, another team's board. Search by what the work is about, not only by the title you would give it: by the area of the product, the entity, the screen, the operation, the error message, and the words a person affected by it would use. Include tasks that are done: a closed task for the same work means either that it came back, or that it was never really solved.

### 2. Decide what each candidate is

For each task found, decide which of these it is:

- **The same work**: it already tracks exactly this. Do not create anything.
- **Equivalent work**: different words, the same outcome. The test is the one [Fixing Reported Errors](fixing-reported-errors.md) uses for duplicates: would finishing one finish the other? If so, it is the same work.
- **A broader task that should include it**: its goal, its problem or its area already covers this work, or would have to be revisited when this is done. This work belongs in its scope.
- **Related, but separate**: it touches the same area and finishing it would not finish this, nor would this change what it decides. Create the new task, and link the two.

A task that is done is extended only when the work is a regression or an unfinished part of what it delivered; otherwise the new task is created and links to it.

### 3. Extend instead of creating

When there is the same, an equivalent or a broader task:

- **add what is new to it** — the facts, the evidence, the scope, the user stories — following that task's own structure and what the standard that governs it says about changing it, such as appending user stories rather than renumbering them;
- **say what was added and why**, so whoever already worked on it notices that it changed;
- **if extending it would change what was already agreed** — its scope, its decisions, an increment already planned — or it is already in progress, ask the person before touching it: proposing the change is yours, deciding it is theirs.

When two tasks that already exist turn out to track the same work, say so and propose which one stays. Do not merge or delete them without the person.

### 4. Say what you found

Whatever the outcome, state it where the creation was asked for: the tasks searched for, the candidates found, what each one was judged to be, and whether a task was created, extended or left as it was — with the links. A new task names, in itself, the related tasks it was told apart from, so that the next search finds both.

## Why This Rule Exists

The standards that create tasks — refining, auditing, fixing reported errors, splitting — each said something about what was already in the tracker, and each said something different: triage looked for a task tracking the same error, an audit linked findings already tracked, refining overwrote a task only when the request already was one, splitting replaced only the task's own sub-items. Nothing covered a task created outside those four, and nothing covered the case most often missed: the work that is not a duplicate of any task, but belongs in the scope of one. One rule, applied wherever a task is created, removes the difference.

## Review Questions

- Was the tracker searched before the task was created, in every place the work could already be, and by what the work is about rather than only by a title?
- Were tasks that are done included in the search?
- Was each candidate judged as the same, equivalent, broader or related work — and was equivalence decided by whether finishing one would finish the other?
- When a task should have included the work, was it extended instead of a new one being created?
- Was a change to what an existing task had already agreed, or to one in progress, asked of the person before it was made?
- Does a new task link the related tasks it was told apart from?
- Was the outcome — searched, found, judged, created or extended — stated with links?

## Report the Outcome

When a task would have been created, state:

- where the tracker was searched, and for what;
- the candidates found, and what each one was judged to be;
- whether a task was created, an existing one extended, or nothing done — with the links;
- any change to an existing task that waits for the person's decision.
