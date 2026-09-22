# Dependency Direction

## Goal

**Business logic declares the interfaces it needs. Infrastructure implements them and is handed in from outside.**

Nothing in the domain or the business-logic layer imports a database client, an SDK, an HTTP library, a framework object or a vendor type. Not because the layering is elegant, but because the alternative decides for you: once business logic names a vendor type, the rule that used it can only be read, tested or reasoned about with that vendor present.

## What Counts as In Scope

Every collaborator business logic needs that lives outside it:

- persistence — covered in detail by [Repository Interface](business-logic-entry-point-repository-interface.md), which is this rule applied to repositories;
- a payment provider, an identity provider, a mail sender, an object store, a queue, a search index;
- another service of the organization, reached over the network — see [Integration Logic](integration-logic.md);
- the ambient things that look free and are not: the clock, the random source, the id generator, the environment.

Out of scope: dependencies between modules within the same layer, and the project's directory layout, which is a repository convention.

## The Rule

**The interface belongs to the caller, not to the implementation.** Business logic defines what it needs, in its own vocabulary and with its own types. The adapter is written to satisfy that interface, not the other way round.

An interface that mirrors a vendor's API — its method names, its options object, its error codes — is that vendor wearing a different hat. The test is whether replacing the vendor would change the interface. If it would, the interface was never yours.

**The implementation is provided from outside.** Business logic receives it; it does not construct it, import it, or reach for a singleton to obtain it.

**The types that cross the interface are the caller's.** Domain types and primitives, not the vendor's models. A vendor type in a signature is the dependency, however well hidden the import is.

**The ambient dependencies are dependencies.** Reading the clock, generating an id or picking a random value inside a business rule makes that rule untestable without time travel. They come in through the interface like everything else.

## Adapters at the Edge Are Thin

An adapter that receives a request — an HTTP handler, a server action, a controller, a message consumer, a scheduled job — **translates and delegates. It does not decide.**

It parses what arrived, invokes one business-logic entry point, and turns the outcome into what the transport expects. Everything else is business logic and belongs where business logic belongs.

A conditional in an entry adapter is the tell: if the code is choosing between outcomes, applying a rule, or building a value the domain should own, the rule has escaped into the layer that was supposed to be interchangeable — and it is now only reachable through that transport.

## Why This Rule Exists

The layering is not the point; the consequences are.

- **A rule reachable only through its transport can only be exercised through it.** Business logic that lives in an HTTP handler needs an HTTP request to be tested, and a second entry point to the same operation — a job, a CLI, another service — either duplicates it or does without it.
- **A vendor in a signature spreads.** It starts in one adapter and ends in the type of something the domain returns, and by then replacing the vendor is a migration rather than a swap.
- **The dependency you did not declare is the one you cannot replace in a test.** Time and randomness are the usual ones, and the tests that work around them are the flaky ones.

## Review Questions

- Does anything in the domain or business-logic layer import a client, an SDK, a framework object or a vendor type?
- Was this interface written from what the business logic needs, or from what the vendor offers?
- Would swapping the provider change the interface?
- Is the implementation handed in, or constructed and imported where it is used?
- Does an entry adapter contain a conditional that decides an outcome?
- Are the clock, the id generator and the random source declared, or read in place?

## Report the Outcome

When finishing the task, state:

- which interfaces the business logic now declares, and where they live;
- which adapters implement them, and how they are provided;
- any vendor type still crossing an interface, and why it has not been replaced yet.
