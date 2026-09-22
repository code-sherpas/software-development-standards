# Code Sherpas Software Development Standards

Principles, patterns and conventions for developing software at Code Sherpas. Each file is one standard, self-contained, and normative: it states what the code must look like and how to review it.

## How to consume these standards

Repositories reference these files from their `AGENTS.md` / `CLAUDE.md` by URL. There is no versioning: consumers always read `main`, so a merge here reaches every repository in its next session.

```
https://raw.githubusercontent.com/code-sherpas/software-development-standards/main/<standard>.md
```

## How to wire this into a repository

A consuming repository carries a section in its `AGENTS.md` that tells the agent to read these standards, when, and how much. That section has one canonical copy here: [setup/agents-md-section.md](setup/agents-md-section.md). Copy it verbatim; do not adapt it per repository.

**Current section version: 1**

At session start an agent reads this index anyway, so it compares that number against the version stated at the end of its own copy at no extra cost. When they differ, the copy in the repository is stale and the agent says so instead of silently working from outdated instructions.

## Index (40 standards)

### Domain model

- [Domain Entity](domain-entity.md) — Define a domain entity as a domain object with a unique identity that persists over time, even as its attributes change.
- [Domain Entity Aggregate Boundaries](aggregate-boundaries.md) — When a domain entity relates to another domain entity, determine whether they belong to the same aggregate or to different aggregates, apply the correct reference style, and persist the boundary decision so it is available to future tasks.
- [Domain Entity Reference Direction](domain-entity-reference-direction.md) — When two domain entities are related, determine whether each entity needs a reference to the other based on its own domain responsibilities — invariants and behavior — not on read or query convenience.
- [Domain Entity Reference Optionality](domain-entity-reference-optionality.md) — When a domain entity holds a reference to another domain entity, determine whether that reference is required or optional based on whether the entity can exist in a valid domain state without it.
- [Domain Entity Typed IDs](domain-entity-typed-ids.md) — Choose the right level of type distinction for domain entity identifiers based on whether the project's type system is nominal or structural.
- [Domain Entity UUIDv4 IDs](domain-entity-uuidv4-ids.md) — Represent domain entity identifiers with UUIDv4.
- [Immutable Domain Entities](immutable-domain-entities.md) — Apply the immutable design pattern when writing or changing domain entities.
- [Domain Service](domain-service.md) — When domain logic involves multiple aggregates and does not naturally belong to any single one of them, encapsulate that logic in a domain service.

### Business logic

- [Business Logic](business-logic.md) — Define business logic as the rules, algorithms, and workflows in software that govern how data is created, stored, and transformed so real business policies become automated actions.
- [Typical Domain-Entity Entry Points for Business Logic](business-logic-typical-domain-entity-entry-points.md) — When deciding which business-logic entry points to implement around a domain-entity type, prefer a standard set of entry points instead of inventing ad hoc operations.
- [One Entry Point per Module for Business Logic](business-logic-entry-point-one-per-module.md) — Every business-logic entry point must be a separate module.
- [Prefer Top-Level Functions for Business Logic Entry Points](business-logic-entry-point-prefer-top-level-functions.md) — When implementing a business-logic entry point, prefer a top-level function over a class or object, as long as the project stack allows it without introducing friction.
- [Command-Query Separation for Business Logic Entry Points](business-logic-entry-point-command-query-separation.md) — Apply Command-Query Separation at entry points to business logic.
- [CQS Handler Signatures for Business Logic Entry Points](business-logic-entry-point-cqs-handler-signatures.md) — Apply a consistent signature pattern to business-logic entry points when Command-Query Separation is already the governing design rule.
- [Colocate Types with Business Logic Entry Points](business-logic-entry-point-colocate-types.md) — When a business-logic entry point has parameters or return values whose types are declared by the project, those types must live in the same file as the entry point, as long as the project stack allows it.
- [Primitive Input Types for Business Logic Entry Points](business-logic-entry-point-primitive-input-types.md) — The fields of command and query types accepted by business-logic entry points must use only primitive or basic types.
- [Domain Entity Payload Types for Business Logic Entry Points](business-logic-entry-point-domain-entity-payload-types.md) — When a business-logic entry point returns domain-entity data, the payload type must be the domain-entity type itself.
- [Ensure Business Constraints for Business Logic](business-logic-ensure-business-constraints.md) — Write business-logic business constraints with a consistent `ensure ...` formalism translated into the syntax and naming conventions of the language in use.
- [Ensure Authenticated Requester for Business Logic Entry Points](business-logic-ensure-authenticated-requester.md) — Every business-logic entry point that requires authentication must include an `ensure requester is authenticated` business constraint as the first check before any other business logic runs.
- [Ensure Authorized Requester for Business Logic Entry Points](business-logic-ensure-authorized-requester.md) — Every business-logic entry point that requires authorization must include an `ensure requester is authorized` business constraint, placed after authentication and before any business operation runs.
- [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md) — Every business-logic entry point must set up an execution context that makes request-scoped data implicitly accessible from any point in the execution chain.
- [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md) — Every business-logic entry point that interacts with a database must wrap its entire flow in a single database transaction, when the underlying persistence technology supports transactions.
- [Transaction Isolation Levels for Business Logic Entry Points](business-logic-entry-point-transaction-isolation-levels.md) — When a business-logic entry point wraps its flow in a database transaction and follows Command-Query Separation, set the transaction isolation level based on whether the entry point is a command handler or a query handler, when the underlying persistence technology supports configurable isolation levels.
- [Use Repositories in Business Logic Entry Points](business-logic-entry-point-use-repositories.md) — Every business-logic entry point that persists, retrieves, or deletes domain entities must do so exclusively through repositories.
- [Repository Interface for Business Logic Entry Points](business-logic-entry-point-repository-interface.md) — Business-logic entry points must depend on a repository interface — not on the concrete repository implementation.
- [Repository Domain Types for Business Logic Entry Points](business-logic-entry-point-repository-domain-types.md) — The types exchanged between business-logic entry points and repositories must be domain-entity types and domain value types.
- [Repository Operations for Business Logic Entry Points](business-logic-entry-point-repository-operations.md) — Repository interfaces must expose a standard set of operations with clear naming, explicit intent, predictable return types, and a strict error model.

### Persistence

- [Repository No Business Logic](repository-no-business-logic.md) — Repositories must contain no business logic.
- [Write Persistence Representations](write-persistence-representations.md) — Write or update the persistence representation that maps application data to the storage technology in use.

### Types, errors and style

- [Built-In Temporal Types](built-in-temporal-types.md) — Represent temporal values with built-in or standard-library temporal types that match their real meaning.
- [UTC Zoned Temporal Types](utc-zoned-temporal-types.md) — When the stack supports timezone-aware built-in or standard-library temporal types, use those types and set their timezone to UTC.
- [ISO 8601 Millisecond Precision](iso8601-millisecond-precision.md) — When a temporal value must be represented textually, use ISO 8601.
- [Neverthrow Return Types](neverthrow-return-types.md) — Model every compatible function and method with `neverthrow` return types.
- [Neverthrow Exception Wrapping](neverthrow-wrap-exceptions.md) — Capture recoverable exceptions with `neverthrow` helpers instead of ad hoc `try/catch`.
- [Prefer Named Functions Over Anonymous Functions](prefer-named-functions.md) — When defining a function, prefer a named function over an anonymous one, regardless of the technology stack.

### User interface

- [Accessibility](accessibility.md) — Every interface shipped is accessible, targeting WCAG 2.2 Level AA: native semantics before ARIA, full keyboard operation, visible and unobscured focus, contrast and reflow, announced dynamic changes, and the criteria WCAG 2.2 added for dragging, target size, redundant entry and accessible authentication.
- [Internationalization](internationalization.md) — Every string a person reads is localized in every supported locale: the locales are one list everything else derives from, keys are typed so a missing one does not compile, each concept has one catalogue and one resolver, the database stores keys rather than display text, and sentences are whole messages rather than concatenated fragments.

### Testing

- [Model-Interpreted Features](model-interpreted-features.md) — When a model interprets what the user asked, the feature ships a corpus and the corpus is the test suite: one table crossing the shapes an object can take with the kinds of request that stress it, split across unit tests that gate CI, a thin e2e subset, and an evaluation harness run by hand that names what it missed.

### Shipping changes

- [Pre-Merge Gates](pre-merge-gates.md) — Before a change enters the main branch, five gates must hold: the change is ready to merge, its pre-merge plan was run by whoever integrates it, it was exercised by hand, any data migration was run against a representative dataset, and any data it leaves behind ships the mechanism that removes it.

### Integration

- [Integration Logic](integration-logic.md) — Define integration logic as the code required for two independent applications to communicate.
