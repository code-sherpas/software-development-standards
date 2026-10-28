# Leave Nothing Running

## Goal

**When an agent hands control back — the end of a turn, of a task, of a sub-agent's run — everything it started that is still running has been decided on: stopped, because nothing needs it any more, or kept on purpose, and said so.**

**What the agent did not start is not its to stop.** Another session's browser, server or stack, and the person's own, are stopped only with the person's permission.

An agent works on machines that people and other agents also use. What it leaves running is not invisible: a window on the person's screen, a port another session needs, memory and CPU on a shared server, a scheduler sweeping storage that other checkouts still use. And what it stops by mistake is worse: somebody else's work, gone mid-task, with nothing to say why.

## What Counts as In Scope

Anything an agent starts that keeps running after the command that started it returned:

- a browser or a browser window, visible or headless, driven by an automation tool or opened by hand;
- a development server, a watcher, a build in watch mode;
- containers and the stacks they belong to;
- a background process, a job, a long-running command, a scheduler;
- a tunnel, a port forward, a proxy, a remote session;
- a temporary environment provisioned for the task.

Out of scope:

- what the task exists to leave running and the person asked for — a deploy, a scheduled job created on request. It is the deliverable, not a leftover;
- data and files the change leaves behind. That is [Pre-Merge Gates](pre-merge-gates.md), Gate 5.

## The Rule

### 1. Know what you started — by mechanism, not by appearance

An agent knows what is its own by something that ties the resource to its session: the process tree it launched, an identifier of its session carried by the process or by an ancestor, a project or container name derived from its own workspace, a port or slot it reserved for itself.

**Appearance is not ownership.** "It looks idle", "it is on the port I usually use", "it is in my directory", "nobody seems to be using it" — none of them says who started it. A resource whose owner cannot be established is not yours.

### 2. Before handing back, stop what nothing needs any more

Nothing needs it when the rest of the task will not use it and nobody is looking at it. Then stop it — in the same turn, not at the end of the task, not "later".

### 3. Keeping it is a decision, and you say it

Sometimes a resource must stay: the person is looking at it, the next step uses it, a run is still in progress. Then keep it, and say in the reply **which one, and why** — enough for the person to find it and stop it if they disagree. A resource kept in silence is indistinguishable from one forgotten.

### 4. Stopped means seen stopped

A tool that reports success has not stopped anything you have not checked. Look for the resource after stopping it.

- **A close command can leave the process alive.** Measured in this organization: a browser automation tool answered that no tabs were open while its browser and its worker process kept running, and the worker had to be killed by force.
- **Stop the whole tree.** A supervisor respawns its child; killing what holds the port leaves the parent that starts it again.
- **Stop it with the identity that started it.** Tooling that derives what to stop from the workspace, the slot or the session addresses somebody else's resources once that identity changes.

### 5. What you did not start, you ask before stopping

Another session's resources, the person's own browser, a stack that predates the session: **ask the person before stopping any of it**, saying what it is, why you believe it is in the way, and what stopping it would cost its owner. When another agent session owns it, talk to that session first — see [Collaborating Across Agent Sessions](collaborating-across-agent-sessions.md) — but its agreement is not the person's permission.

Measured in this organization: a command meant to stop a session's own development stack, run after its workspace had been deregistered, resolved the workspace to the main checkout and **destroyed that checkout's database**. The tool's own notion of "mine" had silently become somebody else's.

### 6. A check enforces it where the agent runtime allows

A rule an agent has to remember is followed until the turn it is not. Where the agent runtime can run code when control is handed back, an automated check backs this standard:

- it looks only for resources it can tie to **this** session, by the mechanism of rule 1, and says nothing about anybody else's;
- it interrupts the hand-back **once**, naming what it found, so the agent decides: stop it, or keep it and say why;
- **it never traps the session**: the second time, it only reminds;
- **its message refers to this standard** rather than restating it, so the rule lives in one place.

A check covers the resources it knows how to detect. What it does not detect still falls under this standard.

## Why This Rule Exists

**Measured in this organization, on 2026-10-28.** An agent finished its turn with a browser window it had opened still on the person's screen. Nothing was wrong with the work, and nothing told the agent the window was there.

Leftovers are cheap for whoever leaves them and paid by whoever comes next: a port taken, memory gone on a shared server, a background scheduler deleting objects other checkouts still need, a window on somebody's screen. The opposite mistake costs more: stopping what belongs to somebody else ends their work without a trace, and the cause is found much later, if at all.

## Review Questions

- Did the agent hand back control with anything it started still running?
- For each thing still running, was it a decision — and did the reply say which one and why?
- How did the agent know each resource was its own: a mechanism, or how it looked?
- After stopping something, did the agent check it was gone — the whole tree, not only the process it targeted?
- Did the agent stop, or propose to stop, anything it did not start? Was the person asked first?
- Where the runtime allows a check, is it in place, does it ignore what is not the session's, and does it refer to this standard instead of restating it?

## Report the Outcome

When handing back control, state:

- what you started that is still running, which one, and why you kept it;
- what you stopped, and how you saw it stopped;
- anything not yours that is in the way, and the permission you asked for — never that you stopped it on your own.
