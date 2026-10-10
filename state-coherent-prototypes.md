# State-Coherent Prototypes

## Goal

**A prototype that stands in for a product behaves like the product: every interaction, path, navigation and state works, and everything it shows is coherent, at every moment, with what has happened in it so far.**

Two conditions, and both are required:

1. **Complete behaviour.** Nothing a person can press is inert. Every path leads somewhere, every state the design describes can be reached, and every state can be left.
2. **Coherent state.** The prototype keeps one model of what has happened, and every screen derives from it. A count, a list, a badge, a timer or a message never contradicts another one, nor what the person just did.

A prototype that only meets the first condition is clickable, not state-coherent. A prototype where screens look right one by one, but disagree with each other after a few clicks, teaches the people who review it the wrong behaviour — and the implementation built from it inherits the contradictions.

The prototype is also held to the same generic UI/UX and accessibility baseline as the product. It is what people review and what the implementation copies, so a defect left in it ships twice.

## What Counts as In Scope

Any interactive prototype that a team reviews as the reference for how a product behaves, or that an implementation is built from:

- an interactive design artifact — a design canvas, a prototyping tool, an HTML page;
- a prototype built in code to explore a feature before it is implemented;
- a static mockup, or a set of them, that is being turned into an interactive prototype.

Out of scope: a static mockup that nobody presents as interactive, and a throwaway sketch used only to discuss an idea.

## Complete Behaviour

**No inert controls.** Every button, link, menu item, tab and field does something.

- **What is outside the prototype says so.** A control that leads to something the prototype does not cover answers with a short notice ("«X» is not part of this prototype") instead of doing nothing. Silence reads as a bug, or worse, as a design decision.
- **Every state the design describes is reachable**, and every state can be left the way the product would leave it: closing, cancelling, going back, timing out.
- **Every path ends somewhere coherent.** A flow that opens a dialog closes it; a flow that starts something lets it finish; a flow that removes something leaves the place it was in looking empty, not stale.

**What cannot be reached with clicks is simulated, visibly marked.** Some states depend on other people or on time: someone else joins, a connection drops, a timer runs out, a background job finishes. The prototype offers them in a clearly separated control, labelled as outside the design (for example "Out of design · Simulate…"), and:

- the simulation goes through the same path the real event would, so its consequences are the same as if it had happened;
- the simulation control is reachable on every viewport and device mode the prototype supports — a mobile layout that hides the desktop control needs its own;
- nothing in the simulation control is mistaken for product interface: distinct styling, distinct position, distinct label;
- the simulation control never covers the product interface it sits on. At every viewport it stays clear of navigation bars, footers and controls — moving above them, wrapping, or collapsing to an icon — because a reviewer who cannot reach a control underneath it concludes the design is broken.

## Coherent State

**One model, everything derived from it.** The prototype holds one state of what has happened — who is where, what was created, what was changed, what time it is — and every screen computes what it shows from that state. Two places never keep their own copy of the same fact.

The test: after any action, every place that shows that fact shows the new value. Move a person from one group to another, and the group lists, the counters, the header, the people panel and any report change together.

**Consequences persist across screens and roles.** Leaving a screen and coming back, switching between the roles the prototype offers, or ending a flow, leaves the trace the product would leave: an item becomes "in progress" or "ended", what was created appears where it should, what was configured is still configured.

**Time is real.** Countdowns, durations, timestamps and "x minutes ago" come from a clock, not from text written once. A recording that lasted two minutes says two minutes.

**Names and data are consistent.** The same person, item or place has the same name everywhere. A page reached from an item shows that item, not a fixed example. Headings match the navigation entry that leads to them.

**Device modes share the state.** When the prototype offers several viewports or device modes — desktop and mobile, portrait and landscape — they are views of the same state. Switching in the middle of a flow keeps everything as it was: the open panel, the running timer, the half-finished form.

## Generic UI/UX and Accessibility Baseline

The prototype meets the same baseline as the product, regardless of its domain. [Accessibility](accessibility.md) governs; what follows are the defects that most often survive in prototypes.

**Reflow and zoom.**

- Nothing scrolls horizontally at 320 CSS pixels wide, or at 200% zoom of the main desktop size (equivalent to half the viewport width and height). Fixed minimum column widths (`minmax(360px, …)`), rows of buttons that cannot wrap, and controls that never shrink are where this breaks.
- Text that is truncated on purpose truncates with an ellipsis inside its container. It is never cut by the edge of the screen.

**Layers.**

- A popup that opens inside a scrolling container does not stretch that container and make a scrollbar appear: it opens towards the side where it fits, or outside the container.
- A notification, a floating button or a sticky bar never covers a control the person is using — an open menu, a field, the primary action. When both can be on screen, the interactive one is on top.
- A fixed bar, a sheet or a footer is positioned for the layout it is in: an offset meant for a desktop sidebar does not survive into a layout that has no sidebar.

**Keyboard and focus.**

- Everything is operable with the keyboard. Menus answer to the arrow keys, Home, End and Escape, and return focus to their trigger when they close.
- Opening a dialog moves focus into it; closing a panel or a dialog returns focus to what opened it; an action that replaces the content the person was on moves focus to the new content.
- Escape closes the innermost layer first.

**Semantics.**

- No interactive element contains another one. A row that opens a detail and also holds a button is not itself a button: the title is the control.
- Every control has an accessible name in every layout, including the ones where its visible label is hidden.
- Icons and badges that carry meaning have a text alternative and a role that allows it; decorative ones are hidden.
- A status message is announced from a live region that already exists before the message arrives.
- Scrollable regions can be reached with the keyboard.

**Contrast and size.**

- Colours come from the design system's tokens and from the variant the system intends for each use: text on a coloured fill uses the step meant for text, not the brand step meant for large surfaces.
- Pointer targets are at least 24×24 CSS pixels.

**Feedback.**

- Every action that changes something gives feedback, in the place the person is looking or in an announced notification.
- A control that cannot be used right now says why, near the control, instead of only looking disabled.

## Verifying a Prototype

Run these, in order, on the prototype as it will be reviewed:

1. **Scenario scripts.** Write each flow the design describes as an automated scenario that drives the prototype like a person — by role and accessible name — and asserts what every affected place shows after each step. Keep them and run them after every change: they are the regression suite of the prototype.
2. **Random exploration.** Click, type and press Escape at random within each area for a few hundred actions per role and device mode, and fail on any runtime error. It finds the errors that only appear on paths nobody scripted, such as a handler that exists on one screen and is missing on another.
3. **Every state in every configuration.** Capture each meaningful state at desktop, mobile portrait, mobile landscape, 320 CSS pixels and 200% zoom, run an automated accessibility checker on each, and measure horizontal overflow and target sizes.
4. **Look at the captures.** Automated checks do not see a layout that is unbalanced, a notification covering a menu, or a page that shows the wrong item. Review every capture; a check passing is not a review.
5. **Keyboard pass.** Operate the main flows with the keyboard only, watching where focus goes.

When a defect is found, fix it in the prototype and add the check that would have caught it to the scenario scripts.

## Why This Rule Exists

**Measured in this organization.** A prototype of live lessons was reviewed as "functional" for weeks before anyone checked the claim. When someone did, it had controls that did nothing, counts that disagreed with the lists beside them, times written by hand, and a home screen that rendered under every other screen because a node had been dragged out of its condition. Incorporating a new feature into it, the same review found, among others: a handler silently overwritten by a list with the same name, so the button that closed the rooms did nothing; catalog cards that all opened the same course; a page title that did not match its menu entry; a popup that stretched its dialog into a scrollbar; a footer offset by a sidebar that the mobile layout does not have; controls cut off at 320 pixels; white text on the brand orange at 4.04:1; and the prototype's own simulation bars covering the mobile navigation at 320 pixels and the button to leave a call at 200% zoom. Every one of them looked right in the screen where it was made. None of them was visible without exercising the prototype as a whole, in every configuration.

A prototype is where a team agrees on behaviour. When its screens contradict each other, the team agrees on nothing, and the implementation picks one of the contradictions at random.

## Review Questions

- Is there any control that does nothing? Does what is out of scope say so?
- Can every state the design describes be reached, and left?
- Are the states that need other people or time available as simulations, marked as outside the design, reachable in every device mode — and do their controls stay clear of the interface at every viewport?
- After each action, does every place that shows the affected fact show the new value?
- Do consequences persist when leaving and coming back, or switching roles?
- Do times and durations come from a clock?
- Does switching device mode in the middle of a flow keep the state?
- Does anything scroll horizontally at 320 pixels or at 200% zoom? Does any popup stretch its container?
- Does anything cover a control in use? Is any fixed element offset for a layout it is not in?
- Can every flow be completed with the keyboard, with focus going where it should?
- Does any interactive element contain another one? Does every control keep its name in every layout?
- Were the scenario scripts, the random exploration, the captures in every configuration and the keyboard pass run on this version?

## Report the Outcome

When finishing work on a prototype, state:

- which flows the scenario scripts cover, and that they pass;
- how much random exploration was run, per role and device mode, and the errors it found;
- which configurations were captured and checked, what the automated checker reported, and what the review of the captures changed;
- what the keyboard pass changed;
- anything left out of scope on purpose, and how the prototype says so;
- any known gap that remains, with the reason.
