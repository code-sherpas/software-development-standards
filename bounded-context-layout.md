# Bounded Context Layout

## Goal

**Source is organized by business context first, and by layer second.** Never the other way round.

A tree whose top level is `controllers/`, `services/`, `models/` and `repositories/` tells you what the framework thinks. A tree whose top level is the contexts of the business tells you what the system is for, and keeps everything one feature touches within reach of each other.

The layers inside each context are the visible shape of [Dependency Direction](dependency-direction.md): directories do not enforce that rule, but they make a breach easy to see.

## What Counts as In Scope

Any repository holding business logic — a service, or the server half of an application. It governs where code lives, not what it does.

Out of scope: the presentation half of a front-end application, which follows its framework's routing conventions; and tooling, configuration and scripts.

## The Layout

```
src/contexts/
  <business-context>/
    <module>/                 optional — a context may be flat or group modules
      domain/
      application/
      primary-adapter/
      secondary-adapter/
    shared/                   what the context's own modules share
```

**`domain`** — models, business rules, and the interfaces of the collaborators the business logic needs. It imports nothing from the other three.

**`application`** — the business-logic entry points, one per module, orchestrating the operation. See [One Entry Point per Module](business-logic-entry-point-one-per-module.md).

**`primary-adapter`** — what drives the system: an HTTP handler, a server action, a message consumer, a scheduled job. Thin, by the rule above: it translates and delegates, it does not decide.

**`secondary-adapter`** — what the system drives: repository implementations, provider clients, anything that satisfies an interface declared in `domain`.

## Rules

**A context is named after the business, not after a technology or a screen.** It survives a rewrite of the interface and a change of database.

**The module level is optional.** A context with one coherent operation is flat. A context grouping several related operations gives each its own module, and the layers live at the level that holds the logic.

**`domain` is there when there is a domain.** A stateless processing service with no entities of its own has `application`, `primary-adapter` and `secondary-adapter`, and that is correct — its rules are transformations, not invariants over persisted state. Do not create an empty `domain` to complete the picture.

**Nothing outside a context reaches into its adapters.** A context is used through its entry points. Importing another context's repository, or its domain models, couples the two in the one direction the layout exists to prevent — see [Aggregate Boundaries](aggregate-boundaries.md) for the domain-level version of the same question.

**`shared` is for what the context's own modules share**, and it is where coupling hides. Every move into a `shared` directory is a claim that two modules need the same thing for the same reason; when the reasons differ, duplicate instead. A `shared` that grows faster than the contexts around it is a context nobody named.

## Review Questions

- Is the top level of the tree the business, or the framework's idea of a layer?
- Would this context's name survive changing the database or rewriting the interface?
- Does anything in `domain` import from `application` or an adapter?
- Does anything outside this context import its adapters or its models directly?
- Is there an empty or near-empty `domain` that exists to complete the shape?
- Did something land in `shared` because two modules need it for the same reason, or because it had nowhere else to go?

## Report the Outcome

When finishing the task, state:

- which context the change belongs to, and why that one;
- whether it introduced a module, a context, or neither;
- anything added to `shared`, and which modules need it for the same reason.
