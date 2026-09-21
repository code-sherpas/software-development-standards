# Business Logic

## Goal

Define business logic as the rules, algorithms, and workflows in software that govern how data is created, stored, and transformed so real business policies become automated actions.

Treat business logic as purpose-driven code. The key question is not where the code lives, but whether the code expresses a business rule, business decision, business constraint, or business workflow.

## What Counts as Business Logic

Classify code as business logic when it does one or more of these things:

- applies a business rule or policy
- makes a business decision from domain data
- calculates a business outcome with domain meaning
- enforces a business constraint or invariant
- changes data according to a business workflow
- controls status or lifecycle transitions with business meaning
- derives values that represent a business concept
- coordinates a sequence of domain actions required by a business process

Business logic often appears in code that answers questions such as:

- whether something is allowed
- how something must be priced, approved, assigned, scheduled, ranked, or settled
- when data can be created, updated, completed, cancelled, renewed, or expired
- which values must be produced from business inputs

## Entry Point Vocabulary

Developers, architects, and codebases call business-logic entry points by different names depending on the tradition, framework, or architectural style they follow. These names all refer to the same idea: a function, method or class that a caller invokes to trigger business logic.

- **use case** — from Clean Architecture and hexagonal architecture traditions
- **application service** — from Domain-Driven Design and layered architecture traditions
- **service layer** — from service-oriented and layered architecture traditions
- **command handler** — from CQS and CQRS traditions, for entry points that change state
- **query handler** — from CQS and CQRS traditions, for entry points that return data
- **interactor** — from Clean Architecture tradition
- **facade** — when used as the public interface to business operations
- **action** — used in some frameworks and codebases for entry points that perform a business operation

This list is not exhaustive. Other names may appear in specific communities, frameworks, or codebases. The key criterion is not the name but whether the code acts as the entry point where a caller triggers business logic.

When the user or the codebase uses any of these names, treat the referenced code as a business-logic entry point and apply every business-logic entry-point standard that is in scope. Do not require the code to be literally named "entry point" to recognize it, and do not enforce a single naming convention from this vocabulary — the project may use any of these names or its own equivalent.

Do not rely on the name alone. Verify that the code actually acts as an entry point to business logic: a class named `Service` that only does HTTP routing is not a business-logic entry point; a class named `UseCase` that orchestrates business rules is.

## Detection Workflow

1. Read the code for business meaning first.
   - Look for domain terms, business concepts, policy names, state names, and vocabulary used by the product, company, or industry.
   - Pay attention to rules that would matter even if the implementation language or framework changed.

2. Identify the business outcome controlled by the code.
   - Determine what business decision or business state change the code produces.
   - Check whether the code changes how data is created, stored, or transformed in a way that reflects a real policy or workflow.

3. Trace the rule to inputs, decisions, and outputs.
   - Identify the domain inputs the rule depends on.
   - Identify the conditions, thresholds, formulas, transitions, and side effects that carry business meaning.
   - Identify the resulting domain state, persisted data, or downstream action.

4. Prefer semantic classification to file or framework conventions.
   - Do not assume code is or is not business logic only because of its folder, class name, framework role, or transport boundary.
   - Classify by what the code means for the business.

## Writing or Changing Business Logic

1. Preserve the business meaning before refactoring.
   - Restate the rule in plain language before changing the code.
   - Keep domain terms explicit in names, branches, and data structures.

2. Make business decisions legible.
   - Express thresholds, formulas, eligibility checks, lifecycle transitions, and workflow steps clearly.
   - Prefer code shapes that reveal the rule instead of hiding it behind incidental implementation detail.

3. Keep business rules explicit.
   - Avoid scattering one rule across many unrelated edits when a cohesive expression is possible.
   - When multiple steps form one workflow, keep the sequence understandable as a single business process.

4. Protect domain invariants.
   - Verify that edited code still enforces the required business constraints.
   - Verify that transformed or persisted data still matches the intended business outcome.

## Review Questions

When reading or reviewing code, ask:

- What business rule or policy is encoded here?
- What business decision does this branch, formula, or workflow make?
- Which domain inputs drive that decision?
- What business state or business data changes as a result?
- Would a change here alter real business behavior?

If the answer is yes, treat the code as business logic.

## Report the Outcome

When finishing the task:

- state which code was identified or treated as business logic
- state which business rules, algorithms, or workflows were implemented or preserved
- state which business inputs, decisions, and outcomes were affected
