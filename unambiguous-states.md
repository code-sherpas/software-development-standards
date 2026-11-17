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

### 9. The facts can be scanned

What is true right now is found at a glance, not read out of paragraphs.

- **A short value, and the explanation apart.** Each fact shown has a short value — a word, a number, a name, a date, a state — and that value is what the eye scans. What explains it goes apart and subordinate to it: a secondary note under the value, or behind a disclosure the person opens. A fact given only as a sentence, with its value somewhere inside, is a finding.
- **Grouped by the question they answer.** Facts that answer the same question — what it is, where it is used, who sees it — sit together under that question, apart from the facts that answer another one. A block of facts all with the same weight makes the person read every one to find the one they need.
- **Said once.** What a badge, a state or a notice on the same screen already says is not said again in prose.
- **Quantities are figures the eye finds without reading.** A quantity the person compares or looks for is shown as a number set apart, with its unit beside it, one per element — never inside a sentence, nor strung with others on one line between separators such as "1 template · 7 assessments · 6 ratings".
- **Enumerations are counted, as a list.** Related items are shown as a count by kind that leads to the full items, not as a sentence that names them one after another. The counts are a list, one element per kind, not a sentence. What is being counted — directly, or inherited from what hangs below the item — is said once, in a sentence before the list, not repeated in each count.
- **Explanations shrink, they do not disappear.** Why an action is refused and how to leave a state, as [No Dead Ends](no-dead-ends.md) and [Business Logic and Interface Coherence](business-logic-interface-coherence.md) require, stay on the screen as the note under the value. Making the screen scannable never removes them.

## Detection

1. Build the table of rule 1 for the area: lifecycle × data × request × role × time × device, keeping only the combinations that change what should be shown.
2. Reach every combination — in the product, or by provoking it locally when it needs data that cannot be created where real people work — and capture what is shown.
3. Put side by side the captures of states that mean different things. Two that look the same are a finding.
4. For each capture, answer as the person would: where am I, what is true, what just happened, what can I do. A question without one answer is a finding.
5. For each capture that shows facts about an item, read only the group headings and the first words of each line. What is true should still be there; a value that can only be found by reading a sentence, a group that mixes questions, and a fact said twice are findings.

## Why This Rule Exists

**Measured in this organization**, for rule 9. On 2026-11-17, in a prototype of a skills taxonomy, the detail panel of an item gave each fact as a sentence of 15 to 30 words, all with the same weight, one after another. Each sentence was correct and none was ambiguous on its own, yet the person reviewing it pointed out that the effort needed to process the panel was high: to learn one fact they had to read them all. It was fixed by grouping the facts by the question they answer and giving each one a short value with its explanation as a note. The same review then found that a note like "1 assessment template · 7 assessments · 6 ratings" read as a list of items to be worked through rather than as three numbers; it became a row of tiles, one per kind, with the number large and what it counts beneath it, in a semantic list, after a sentence saying what is counted.

Rule 9 rests on four well-established principles:

- **Extraneous cognitive load** (Sweller): every word read to find a value is effort spent on the presentation, not on the person's task, and it competes with the task for the same limited working memory.
- **Scannability** (Krug, and the F-shaped reading pattern described by Nielsen Norman Group): people scan a screen before they read it, and read down the left edge and the first words of each line. A value that is not among those words is not seen.
- **Grouping by proximity** (Gestalt): what sits together is read as belonging together, so facts placed by the question they answer are found by that question.
- **Progressive disclosure**: the detail is there when the person asks for it, and does not stand between them and the facts when they do not.

## Review Questions

- Was every reachable combination of lifecycle, data, request, role, time and device designed or deliberately merged?
- Do "nothing exists", "nothing matches", "may not see" and "failed" each look different?
- Does work in progress, and work in the background, show its state?
- Does every empty area say why it is empty and how it gets filled?
- Does every page say where the person is, and can same-looking items be told apart?
- Does a partial outcome say what succeeded and what did not?
- Can every time be read only one way?
- Does every state word mean the same everywhere?
- Does every fact shown have a short value with its explanation apart, grouped by the question it answers, said once, with enumerations counted — and are the reasons for a refusal and the ways out still there?
- Is there any quantity or enumeration inside a sentence that the person has to read in full to find it?

## Report the Outcome

When finishing work in scope, state:

- the states the change added or changed, and how each is presented;
- any states deliberately shown the same, and why;
- any ambiguous state that remains, with the reason and who accepted it.
