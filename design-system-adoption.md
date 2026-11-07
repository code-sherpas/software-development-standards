# Design System Adoption

## Goal

**Where a product has a design system, its interface is built from it — components, tokens and patterns — what the design system lacks is taken to it rather than built aside, and adopting it reuses the business logic rather than rewriting it.**

A design system is how a product stays coherent as many people change it: one button, one dialog, one way to show an error, accessible once and correct everywhere. Every component built beside it is a second implementation that drifts — in behaviour, in accessibility, in look — and every raw value is a decision the system already took, taken again differently.

## What Counts as In Scope

In a product whose project names a design system:

- any change that produces or changes an interface a person perceives or operates — a component, a screen, a style, a layout;
- migrating an existing interface to the design system, or to a new version of it;
- judging whether an existing product area meets this standard, as [Auditing a Product Area](auditing-a-product-area.md) does.

Out of scope: a product whose project names no design system, and changes with no interface.

## The Rule

### 1. The design system's component, whenever it has one

For every role the design system covers — a button, a field, a dialog, a menu, a table, a notification, a layout — the interface uses the design system's component. A component of the product's own that does what a design system component does is a finding, however well it works.

### 2. Tokens, never raw values

Colours, spacing, type, radii, shadows, layers and motion come from the design system's tokens, chosen by the role each token is for — the colour meant for text on a fill, the layer meant for a dialog — not by the value that happens to look right.

### 3. Its patterns, not new ones

Where the design system documents a pattern — how a form shows errors, how an empty state reads, how a destructive action is confirmed, how a page is laid out — the interface follows it.

### 4. What it lacks goes to it

- When the design system has no component or pattern for a need, the need is taken to whoever owns the design system **as a problem** — what the person must be able to do, in which context — not as a component already designed.
- Until the design system offers it, the product's own solution is marked as temporary, with a link to that request, and is built from the design system's tokens and smaller components.
- The design system's components are never forked, nor their internals restyled from outside.

### 5. The design system wins a conflict

When a good practice of the design system conflicts with a habit of the product, the product adapts. A deliberate visual change that adopting it brings is stated in the change that adopts it.

### 6. Adopting is not rewriting the logic

Moving an interface onto the design system keeps the business logic behind it. Its public interface changes only when the experience needs something the logic does not offer, and then the change goes through the logic, as [Business Logic and Interface Coherence](business-logic-interface-coherence.md) requires, never around it.

### 7. The current version

The interface uses the design system's current released version. Upgrading is part of adopting, and a component pinned to an old version is a finding.

## Detection

Make an inventory of the area's interface: every component instance, every style value, every pattern. For each, name the design system's equivalent, or that there is none. Instances with an equivalent they do not use, raw values with a token they do not use, and patterns that differ from the documented one are findings; needs with no equivalent are requests to the design system.

## Review Questions

- Does the change use the design system's component for every role it covers?
- Does every colour, spacing, type, radius, layer and motion value come from a token chosen by its role?
- Does it follow the design system's documented patterns?
- Was every missing piece taken to the design system as a problem, with the temporary solution marked and linked?
- Was any design system component forked or restyled from outside?
- Did adopting it leave the business logic intact, changing its public interface only through the logic?
- Is it on the current released version?

## Report the Outcome

When finishing work in scope, state:

- the design system components, tokens and patterns the change adopted, and the version;
- the requests made to the design system, and the temporary solutions that wait for them;
- any deliberate visual change adopting it brought;
- any change to the business logic's public interface the adoption needed.
