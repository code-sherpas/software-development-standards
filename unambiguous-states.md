# Unambiguous States

## Goal

**In every state a person can reach, they can tell where they are, what is true right now, what just happened, and what they can do next — without knowing how the product is built.**

A state is ambiguous when two different situations look the same, or when what the person sees admits more than one reading: an empty list that may mean "nothing exists", "nothing matches your filter" or "you may not see it"; a report that may be generating, failed, or never requested; a button that may have worked. The person then guesses, and acts on the guess: they retry what already happened, wait for what will never come, or create what already exists.

## What Counts as In Scope

- Any change that produces or changes an interface a person operates, in what it shows in any of its states.
- Any change to a lifecycle, a state machine, a background process or a time-dependent rule whose state a person sees.
- Settling, while refining or splitting work, what an interface will do — the decisions that later phases build — as [Refining Work](refining-work.md) and [Splitting Work into Increments](splitting-work-into-increments.md) do.
- Judging whether an existing product area meets this standard, as [Auditing a Product Area](auditing-a-product-area.md) does.

Out of scope: states no person ever sees, such as the internal steps of a job that reports only its outcome.

## The Rule

### 1. Enumerate the states before designing them

The states of an interface are the combinations that change what it should show:

- **the item's lifecycle** — draft, published, in progress, finished, failed, expired, archived;
- **the data** — none, one, many, very many, very long values, values missing;
- **the request** — loading, failed, partly loaded, stale;
- **who is looking** — each role, the owner and the rest, someone who may see but not change;
- **time** — before, during and after each date or deadline the logic uses;
- **the device** — each viewport and input mode the product supports.

Every combination a person can reach is either designed, or deliberately shown the same as another one, with the reason. A combination nobody thought of is the most common ambiguous state.

### 2. Different states look different

- Two situations that mean different things to the person never look the same. In particular: **nothing exists** versus **nothing matches**; **not started** versus **in progress** versus **failed** versus **finished**; **draft** versus **published**; **you may not do this** versus **this cannot be done now**.
- **When security requires two states to look the same** — a resource the person may not know exists, shown like one that does not exist — the message covers both readings, so it is truthful in each.

### 3. The system's status is visible

- Work in progress says that it is in progress, what it is doing, and what will happen when it finishes; work that runs in the background has a visible state the person can come back to.
- Information that may be out of date says how old it is, or that it is being refreshed.
- An outcome that took effect is shown where the person is looking, and stays visible as long as they need it to understand the result.

### 4. Empty is explained

An empty area says what would be there, why it is empty now, and how it gets filled — the action that fills it, or who can.

### 5. The person knows where they are

- The page's title matches the navigation entry that leads to it.
- The context that changes what the page means — the organization, the account, the item, the step of a flow — is visible on the page.
- Two items that look the same to the person can be told apart on every screen where both appear.

### 6. Partial outcomes are told apart

An operation that did part of what was asked says which part succeeded and which did not, and what happens to the rest. "Done" for half the work, or "failed" for work that was half kept, are both false.

### 7. Times are read one way

Dates and times are shown in the zone that matters to the person, saying which zone where it could be read in another, and a relative time ("in 2 hours") can be resolved to an absolute one.

### 8. Words keep one meaning

A word that names a state means the same in every screen. A term that names one thing here and another thing there makes the state behind it ambiguous, however clear each screen is alone — see [Business Logic and Interface Coherence](business-logic-interface-coherence.md).

## Detection

1. Build the table of rule 1 for the area: lifecycle × data × request × role × time × device, keeping only the combinations that change what should be shown.
2. Reach every combination — in the product, or by provoking it locally when it needs data that cannot be created where real people work — and capture what is shown.
3. Put side by side the captures of states that mean different things. Two that look the same are a finding.
4. For each capture, answer as the person would: where am I, what is true, what just happened, what can I do. A question without one answer is a finding.

## Review Questions

- Was every reachable combination of lifecycle, data, request, role, time and device designed or deliberately merged?
- Do "nothing exists", "nothing matches", "may not see" and "failed" each look different?
- Does work in progress, and work in the background, show its state?
- Does every empty area say why it is empty and how it gets filled?
- Does every page say where the person is, and can same-looking items be told apart?
- Does a partial outcome say what succeeded and what did not?
- Can every time be read only one way?
- Does every state word mean the same everywhere?

## Report the Outcome

When finishing work in scope, state:

- the states the change added or changed, and how each is presented;
- any states deliberately shown the same, and why;
- any ambiguous state that remains, with the reason and who accepted it.
