# Model-Interpreted Features

## Goal

When a model interprets what the user asked, the feature ships a **corpus**, and the corpus **is** the test suite — not a document beside it.

The corpus is written once, as one table, and the tests are generated from it. Writing the cases twice — once as prose, once as `it()` blocks — is how the two drift, and the drift is invisible because both look maintained.

## What Counts as In Scope

Apply this standard when a feature turns what a person expressed into an action the system performs, and something has to interpret it:

- natural-language commands over an object the user is looking at — an editor, a canvas, a document, a schedule;
- natural-language search or filtering, where terms have to become parameters;
- an assistant that decides which operation to invoke and with which arguments;
- extraction or classification whose output drives a decision the product then takes.

Out of scope: generation with no downstream action (a summary shown as text), and deterministic parsing with a fixed grammar — that is a parser, and it is tested as one.

## The Corpus Is the Test Suite

The corpus is **one table crossing two catalogues**.

**The objects operated on, in every shape they can take.** Not one of each type — the extremes and the awkward ones:

- the collection of one, and of ten;
- the empty one;
- the one that already carries unsaved changes;
- the one with two indistinguishable elements;
- the one brushing a limit.

**The requests, graded by what they stress:**

- **granular** — one object, one verb, one value;
- **ambiguous by referent** — more than one candidate matches;
- **ambiguous by magnitude** — "shorter", "cheaper", "a bit later";
- **compound** — two operations in one sentence;
- **impossible** — asks for something the domain cannot express;
- **out of scope** — valid elsewhere in the product, not here;
- **traps** — phrasings that sound like a request and are not, and the reverse.

**Each crossing carries its expectation**: what changes and with which parameters, or «asks», or «declines and explains».

**It ships in the same pull request as the feature.** A corpus that arrives later describes something nobody can still change cheaply.

### Worked example

For an editor driven by written instructions:

| | «delete the last paragraph» *(granular)* | «delete the image» *(ambiguous by referent)* | «make it shorter» *(ambiguous by magnitude)* |
|---|---|---|---|
| **Empty document** | declines and explains | declines and explains | declines and explains |
| **One paragraph** | `deleteBlock(b1)` | declines: there are no images | `shorten(b1)` |
| **Three images** | `deleteBlock(bN)` | **asks which one** | asks which part |
| **Two identical paragraphs** | deletes the **second**, not the first | — | — |
| **With unsaved changes** | executes, grouped into one undo step | — | — |

The row with two identical paragraphs is the kind of case nobody writes by hand, and the one that breaks things: a resolver that looks for "the paragraph that says X" finds two and picks wrong.

## One Corpus, Three Layers, and They Do Not Share a Gate

| What it measures | Nature | Where it runs |
|---|---|---|
| The deterministic half — validating against the real vocabulary, fitting the object's shape, calibrating magnitudes, refusing the impossible, grouping for undo | Pure functions | **Unit tests, and they gate CI** |
| That the whole chain reaches the screen and comes back | Integration through a browser | **A thin representative subset in e2e** — every case here costs minutes, so it carries the shapes, never the matrix |
| The model's interpretation — that "the line at the bottom" resolves to the element we meant | Model adherence, best-effort | **An evaluation harness, run by hand**, reporting a score and naming what it missed |

The first layer is larger than it looks. Once the interpreter has produced `{action: "delete", target: "block-7"}`, everything downstream is deterministic: does it delete that block and leave the rest intact, does it reject a target that does not exist, does a compound request become a single undo step, is an out-of-range magnitude refused. **No model runs in those tests.**

## Why the Model's Interpretation Stays Out of CI

Putting it in CI buys a check that is slow, expensive, and red for reasons that are not regressions — and a check like that stops being signal and becomes noise people learn to ignore. The day it catches something real, nobody is looking.

The harness answers **"38 of 42 referents resolved as expected"** and **names the four**, which is the actionable half. A pass/fail bit is not.

Run it when the prompt changes, when the model or its version changes, when the vocabulary changes, and before a release that touches the feature. Record the score with the date and the model version, so a drop is visible as a drop rather than as a number without a baseline.

## Acceptance Criteria Are Written on What Is Verifiable

Acceptance criteria state **that the command ran with the parameters the interpreter produced** — never that the model is always right.

- Verifiable: "when the interpreter resolves a target, the system executes `deleteBlock` with that id, and the operation is undoable in one step".
- Not verifiable, and not true: "the system always understands which image the user meant".

**The instruction to the model is absolute; the promise to the user never is.** Telling the model "never delete without confirming" is right. Promising a customer that it never misreads which element they meant is not a promise anybody can keep, and writing it into a criterion makes every later conversation harder.

## Review Questions

- Does this feature have something interpreting the user's intent? Then where is its corpus?
- Does the corpus cross both catalogues, or is it a list of requests that happen to work?
- Are the awkward shapes in it — empty, one, many, indistinguishable, at the limit, mid-edit?
- Are the traps in it, or only the well-formed requests?
- Is anything deterministic being tested through the model, when it could be tested as a pure function?
- Is the model's interpretation gating CI?
- Does any acceptance criterion promise that the model gets it right?

## Report the Outcome

When finishing the task, state:

- where the corpus lives and what the two catalogues are;
- which cases became unit tests, which became the e2e subset, and why those;
- the harness score, with the model version and the date, and **which cases it missed**;
- any shape or request class you decided not to cover, and why.
