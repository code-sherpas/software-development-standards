# Business Logic and Interface Coherence

## Goal

**The interface is a faithful projection of the business logic: it offers a person exactly what the logic allows them in the state they are in, tells them every outcome the logic can return, shows each fact as the logic computes it, and names things the way the domain does.**

An interface and the logic behind it are two descriptions of the same product. When they disagree, the person believes the interface and the system does what the logic says: they press a button the logic will refuse, look for an action the logic allows and the interface never offers, or read a number the screen computed with a rule the logic does not apply. Every such disagreement looks like a bug to them, whichever side is right.

## What Counts as In Scope

- Any change that produces or changes an interface a person operates — a screen, a flow, a form, a dialog, a notification, an email with actions — in what it offers, shows, checks or says.
- Any change to business logic that an interface exposes: a rule, a limit, a state machine, a permission, an error the logic returns, or a value it derives.
- Settling, while refining or splitting work, what an interface will do — the decisions that later phases build — as [Refining Work](refining-work.md) and [Splitting Work into Increments](splitting-work-into-increments.md) do.
- Judging whether an existing product area meets this standard, as [Auditing a Product Area](auditing-a-product-area.md) does.

Out of scope: logic no interface reaches, such as an internal job whose effect no person sees, and an interface with no business logic behind it, such as a static page.

## The Rule

### 1. Offered if and only if allowed

- **No control for what the logic will refuse.** An action the logic refuses for this person, on this item, in this state, is not offered as if it would work. Either it is absent, or it is shown unavailable with the reason — see [No Dead Ends](no-dead-ends.md) for when the reason must be shown.
- **No allowed action without a way to do it.** What the logic allows a person to do, the interface gives them a way to do, unless leaving it out is a decision written down where the team can see it. A capability that exists only in the logic is invisible; one that is reachable only by typing an address is not offered.
- **The logic stays the authority.** What the interface hides or disables protects the screen, never the operation. Every rule is enforced by the logic, whatever the interface does — see [Ensure Authorized Requester](business-logic-ensure-authorized-requester.md).

### 2. Constraints are known before submitting

Every constraint the logic enforces on input — a required field, a length, a size, a range, a format, a uniqueness, a precondition on the state — is stated before the person submits, and checked as they enter it when the check can be made there. The interface's check is a copy of the logic's, never a replacement: when they differ, the copy is wrong.

### 3. Every outcome the logic can return is handled

- Each distinct outcome an operation can return — each error type, each refusal, each partial success — reaches the person as a message in domain language that says what happened and what they can do now.
- **No generic failure for a modelled outcome.** "Something went wrong" for an outcome the logic named is information the interface threw away.
- **No success for something that failed**, and no failure for something that succeeded: what the interface says happened is what the logic did.

### 4. One source for each fact

- What the interface shows — a count, a status, a derived value, whether an action is allowed — comes from the logic. The interface does not compute it again with a rule of its own; when it needs a value the logic does not offer, the logic is extended to offer it.
- After an action, every place that shows an affected fact shows the new value.

### 5. The same words and the same states

- The interface uses the domain's terms: one term per concept, one concept per term, the same in every screen, message and notification.
- **A concept that goes takes its words with it.** When a decision removes a concept from the domain, the words that only served to tell something apart from it go too: a qualifier, a label, a group, a column. They keep implying the concept is still there, and the person looks for it.
- **States map one to one.** Every state the logic distinguishes that matters to the person can be told apart in the interface, and the interface shows no state the logic does not have. When several logic states are shown as one on purpose, the mapping is a written decision, and it is total: no logic state is left without a presentation.

### 6. Consequences are stated as the logic will apply them

An action with consequences beyond its own item — a deletion that cascades, a change that notifies, a state change that cannot be undone — says what will happen, as the logic will actually do it, before it happens. A confirmation that names fewer consequences than the logic applies is a false statement.

### 7. What was recorded keeps its meaning

Records already made — an assessment, a rating, an order, a history entry — keep pointing at what they referenced, and anything that reads them later, a report among them, reads them through it. An operation on something they reference can therefore change what they mean without touching them: moving an item to another parent, renaming it, rewriting its description, reassigning it.

- **Before an operation like that is allowed, what it does to the meaning of the records that reference the item is established**, in the logic, not only in the interface.
- **When the meaning would change, there are two ways, and only two:**
  - the operation is not offered on an item that records reference;
  - correcting is separated from changing the meaning: what does not change the meaning — a typo, a clearer wording of the same thing — can still be edited, and what does is done by retiring the item and creating another, or by a new version, so that the past records keep what they meant.
- **The interface says so at the moment of the operation, before saving**: which records reference the item, and what the person can do instead — as rule 6 asks for consequences and [No Dead Ends](no-dead-ends.md) for refusals.

A change of meaning that happens silently is a false statement about the past: every record still looks right, and none of them says what was really recorded.

### 8. Change the logic, not around it

When a better interface needs something the logic does not offer — a check before submitting, the reason an action is unavailable, a projection of several entities, a new outcome — the logic is extended, or its public interface changed, to offer it. The rule is never reimplemented in the interface, and the interface never reaches past the logic's public interface to get it.

## Detection

1. List the operations the area's logic exposes and, for each, the outcomes it can return and the rules that decide them: who, on what, in which state.
2. List the states of each entity the interface shows.
3. For every pair of operation and person, find the interface path. Mark each pair: offered and allowed, offered and refused, allowed and not offered.
4. For every outcome and every state, find what the person sees. An outcome or a state with no presentation, or two with the same one, is a finding.
5. For every fact the interface shows, find where it is computed.
6. For every operation that moves, renames, edits or reassigns an item, list the records that reference it and what each one would mean afterwards. A record whose meaning changes without the person being told before saving is a finding.

## Why This Rule Exists

**Measured in this organization**, for rule 7. On 2026-11-17, refining a skills taxonomy found two operations that changed the past without anyone seeing it. Moving a behaviour to another skill left every rating already made on it pointing at a behaviour of the other skill, because a rating stores both. Rewriting the name or the description of something already assessed made the reports, which read the current structure, show the new text as if that had been what was rated. Both operations were correct one by one, and both were offered with no warning.

**Measured in this organization**, for rule 5. On 2026-11-19, in the prototype of the same taxonomy, a decision had removed the possibility of sharing items between organizations. The screens still said "141 own items" and kept a group titled "Who sees it": "own" only meant something next to shared items, and "Who sees it" only had an answer while sharing existed. Every word was correct when written; the concept that gave them their meaning was gone.

## Review Questions

- Is any action offered that the logic will refuse for this person in this state?
- Is any action the logic allows not offered, without a written decision?
- Is every input constraint the logic enforces stated before submitting?
- Does every outcome the logic can return reach the person in domain language, with what to do next?
- Does the interface compute any fact with a rule of its own?
- After an action, does every place showing the fact change?
- Does every state the logic distinguishes have its own presentation, and every presentation a state?
- Does the interface use the domain's terms, the same everywhere?
- Is any word left that only told something apart from a concept that no longer exists?
- Does every confirmation state the consequences the logic will apply?
- Does any operation change what records already made mean? If so, is it not offered, or is correcting separated from changing the meaning — and does the person learn it before saving?
- Where the interface needed something new, was the logic extended rather than worked around?

## Report the Outcome

When finishing work in scope, state:

- the operations and states whose presentation the change added or changed, and how each outcome reaches the person;
- any action deliberately left out of the interface, and where that decision is written;
- any extension of the logic or of its public interface the interface needed;
- any incoherence that remains, with the reason and who accepted it.
