# Accessibility

## Goal

Every interface shipped is accessible, without exception and without anyone having to ask for it. The target is **WCAG 2.2 Level AA**.

Treat a change that misses the baseline below as unfinished, the same way you would treat one that does not compile. Reporting what an accessibility pass changed is expected; presenting accessibility itself as an achievement is not — it is the floor.

**This is also a legal obligation, not only a quality bar.** The European Accessibility Act has applied to new products and services placed on the EU market since 28 June 2025, with existing services covered from June 2030. Its technical reference in Europe is EN 301 549, which harmonises with WCAG Level AA. Enforcement began in 2026. Targeting WCAG 2.2 AA satisfies the current reference and the next one, since 2.2 is a superset of 2.1.

## What Counts as In Scope

Apply this standard to any change that produces or modifies something a person perceives or operates:

- a component, a screen, a flow, a form, a dialog, a toast, a table, a chart;
- content rendered outside the application — transactional email, exported PDF, printed view;
- a change to copy, an icon, a colour token, a spacing token, or a focus style;
- a change to the DOM order, to a route transition, or to what happens after an action completes.

Out of scope: code with no user-facing surface — a repository, a migration, a background job — unless it produces text a person will read.

## The Target: WCAG 2.2 Level AA

**Level AA, not AAA.** AA is what regulation references and what a product can meet across the board. Individual AAA criteria are worth adopting when they are cheap — and some are called out below — but AAA as a whole is not the bar.

**WCAG 2.2, not 2.1.** It adds nine success criteria and removes one. The six new ones at A and AA level are requirements here:

| Criterion | Level | What it requires |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | The focused element is not entirely hidden by author-created content |
| 2.5.7 Dragging Movements | AA | Anything done by dragging can also be done with a single pointer action |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least 24×24 CSS pixels, with exceptions |
| 3.2.6 Consistent Help | A | Help mechanisms appear in the same relative order across pages |
| 3.3.7 Redundant Entry | A | Information already entered is auto-populated or available to select |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function test unless an alternative exists |

`4.1.1 Parsing` is obsolete and removed. Do not cite it, and do not treat duplicate IDs or unclosed tags as accessibility findings on their own — they are code-quality findings.

## Semantics and Structure

**Use the native element.** A `button` is a button, a `a[href]` is a link, a `label` labels an input, a `table` holds tabular data. Native elements carry role, state, keyboard behaviour and platform conventions that a `div` with handlers does not, and that you will not fully reimplement.

**No ARIA is better than bad ARIA.** Reach for ARIA when no native element expresses the pattern, and then follow the ARIA Authoring Practices for that pattern rather than inventing one. A wrong `role` removes the semantics the element already had.

- Every control has an **accessible name** that says what it does — not "click here", not an empty button holding only an icon. An icon-only control needs a name through `aria-label` or visually hidden text.
- **Headings describe structure**, and their level reflects nesting. One `h1` per page. Never pick a level for its font size.
- **Landmarks** mark the regions of the page (`header`, `nav`, `main`, `footer`, `aside`), with `main` present exactly once.
- Each page has a **unique, descriptive `title`**, and the document declares its **language** with `lang` — including on any fragment written in a different language.
- **DOM order matches visual order.** CSS that reorders content visually (`order`, `grid-area`, absolute positioning) leaves keyboard and screen-reader users in the original sequence.
- Decorative images and icons are **hidden from assistive technology** (`alt=""`, or `aria-hidden="true"` on an inline SVG). Informative ones carry a text alternative that conveys the information, not the picture.

## Keyboard Operation

**Everything interactive is reachable with Tab and operable with Enter and Space**, in an order that matches the visual sequence. This is not a subset of accessibility to check separately — it is where most real failures are, because a change can look perfect and be unusable.

- **No keyboard traps.** Focus can always leave a component the same way it entered.
- **`Escape` closes layers in the order they were opened**, and focus returns to whatever opened them.
- **Do not add `tabindex` above 0.** Positive values reorder the whole document and break as soon as anything else changes.
- **Custom controls implement the expected keys** for their ARIA pattern: arrow keys within a radio group, a menu, a tab list or a listbox; `Home` and `End` where the pattern defines them.
- **Single-character shortcuts** are remappable, or only active when a control has focus.
- **Anything done by dragging can be done without it** (2.5.7): reordering, sliders, drawing, resizable panes. A drag handle is not an alternative to itself — a menu, a pair of buttons or a text input is.
- **Skip links** let keyboard users bypass repeated navigation, and become visible on focus.

## Focus

- **Focus is always visible** and clearly distinguishable. Never remove the outline without replacing it with something at least as visible. `:focus-visible` is the right hook for showing it to keyboard users without decorating mouse clicks.
- **The focused element is never fully covered** by sticky headers, cookie banners, chat widgets or toolbars (2.4.11). This is the criterion most often broken by a sticky element added long after the component.
- **Moving focus is deliberate.** Opening a dialog moves focus into it and traps it there until it closes; closing returns focus to the trigger. Deleting the focused element moves focus somewhere meaningful, never to `body`.
- **In a single-page application, a route change moves focus** to the new content or its heading. Without it, a keyboard user stays where the previous page left them and a screen-reader user is told nothing happened.

## Visual Presentation

- **Contrast**: 4.5:1 for body text, 3:1 for large text (at least 18pt — about 24px — or 14pt bold, about 18.7px). **3:1 for interface components and meaningful graphics** — borders of inputs, icons that carry meaning, chart series, focus indicators. Placeholder text and disabled-looking-but-enabled controls are the usual offenders.
- **Colour is never the only channel.** An error, a required field, a selected item, a series in a chart or a state in a badge also carries text, shape, icon or position.
- **Text scales to 200%** without loss of content or function, and the page **reflows to 320 CSS pixels wide** with no scrolling in two directions. Fixed heights and `overflow: hidden` are where this dies.
- **Text spacing can be overridden** — line height 1.5×, paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em — without clipping content.
- **Pointer targets are at least 24×24 CSS pixels** (2.5.8), unless spacing gives each one a 24px clearance circle, an equivalent larger control exists, the target is inline in a sentence, the browser sizes it, or the size is essential. When the design allows it, 44×44 is the better number.
- **Respect `prefers-reduced-motion`.** Movement that is not essential is reduced or removed; parallax, autoplaying carousels and large transitions are the ones that cause harm.
- **Anything that moves, blinks or auto-updates for more than five seconds can be paused, stopped or hidden.** Nothing flashes more than three times per second.

## Forms, Errors and Data Entry

- **Every field has a programmatically associated label** that stays visible. A placeholder is not a label: it disappears on input and usually fails contrast.
- **Instructions and format requirements come before the field**, not only after a failed submit.
- **Errors are identified in text**, describe how to fix the problem, are associated with their field (`aria-describedby`, `aria-invalid`), and are announced. A red border alone says nothing to anyone who cannot see it.
- **Fields about the user carry `autocomplete`** with the right token, so the browser can fill them.
- **Do not ask again for what was already entered** in the same process (3.3.7) — auto-populate it or offer it for selection.
- **Authentication does not require a cognitive function test** (3.3.8): no puzzle, no transcription, no memorising a code across screens, unless an alternative exists. **Allow paste in password and one-time-code fields** — blocking it breaks password managers and is the most common way this criterion fails.
- **Help is in the same place on every page** (3.2.6): contact, support link, chat — consistent relative order, not a different corner per screen.
- Actions that are legal, financial or destructive are reversible, confirmed, or checked for errors before submission.

## Dynamic Content and Announcements

- **Anything that changes without a page load is announced.** A status message, a validation summary, a result count, a toast: `aria-live="polite"` for most, `assertive` only for something that genuinely interrupts. Announce with `role="status"` or `role="alert"` where the pattern fits.
- **The live region exists in the DOM before the message arrives.** Inserting the region and its text together announces nothing.
- **State is exposed, not implied**: `aria-expanded` on disclosure triggers, `aria-current` for the current page or step, `aria-selected` in tabs and listboxes, `aria-invalid` on fields, `aria-busy` while a region loads.
- **A loading state is perceivable without sight.** A spinner with no accessible name and no live region is silence.
- **Nothing changes context on focus or input.** Focusing a field does not submit, navigate or open a layer; selecting an option does not navigate unless the user asked for it.

## Media

- Prerecorded video has **captions**; prerecorded audio has a **transcript**. Video whose visuals carry information that the audio does not has **audio description**.
- **Audio does not autoplay**, or can be stopped immediately.
- Captions are not the same as subtitles: they include speaker identification and meaningful sound.

## Detection Workflow

Run these in order. The first three cost seconds and catch most of what is broken.

1. **Check the element choice first.** Before auditing a component, ask whether it should have been a native element. Most findings disappear at this step.
2. **Operate the change with the keyboard only.** Tab through it, activate everything, open and close every layer, and watch where focus goes. If you cannot complete the flow, nothing else matters yet.
3. **Zoom to 200% and narrow the viewport to 320 CSS pixels.** Look for clipping, horizontal scrolling and content that has become unreachable.
4. **Run an automated checker** (axe, Lighthouse, or the equivalent in the project's test setup) and fix what it reports.
5. **Listen to it.** Traverse the change with a screen reader — VoiceOver, NVDA or Narrator — and confirm that each control announces its name, its role and its state, and that dynamic changes are announced at all.

## What Automated Tools Do Not Catch

An automated checker finds only a fraction of accessibility defects, and green results are not a pass. It cannot judge:

- whether an accessible name is **useful** — "button", "link" and "image" all pass;
- whether an `alt` text conveys the **information** the image carries;
- whether the **heading structure** reflects the actual structure of the page;
- whether **focus order** is meaningful, or where focus goes after an action;
- whether an ARIA pattern was implemented with the **keyboard behaviour** it implies;
- whether colour is the **only** channel carrying a distinction;
- whether captions are **accurate**.

Every one of those requires a person, or an agent, to operate the interface. Steps 2 and 5 of the workflow are not optional extras on top of step 4.

## Review Questions

When reading or reviewing a change that touches an interface, ask:

- Could this have been a native element instead of a `div` with a role?
- Does every control have an accessible name that says what it does?
- Can the whole flow be completed with the keyboard, in a sensible order, with focus always visible and never covered?
- Where does focus go when this opens, when it closes, and when the focused element disappears?
- Is any state, error or result conveyed only by colour, or only visually?
- Does it hold up at 200% zoom and at 320 CSS pixels wide?
- Is anything that changes dynamically announced, from a live region that already existed?
- Are pointer targets at least 24×24, or spaced so they behave as if they were?
- Does authentication allow paste, and does the form avoid asking twice for the same thing?

## Report the Outcome

When finishing work on an interface, state:

- which of the workflow steps you ran, and with which tools or screen reader;
- what the keyboard pass and the screen-reader pass changed — not that you ran them;
- any criterion you could not verify and why, naming it;
- any known gap that ships anyway, with the reason and who accepted it.

Do not report the baseline itself as an accomplishment. It is the floor.
