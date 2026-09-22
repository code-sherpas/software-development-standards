# Serialization Boundaries

## Goal

**Whatever crosses a serialization boundary arrives as data and nothing else.** Methods are gone, prototypes are gone, classes are gone, and every guarantee that rested on the shape of the object is gone with them — silently, because the value still looks like what it was.

The rule has two halves: **design what crosses so the domain survives it**, and **reinstate the guarantee on arrival**, at one place, before the value reaches the code that uses it.

## What Counts as In Scope

Any point where a value is turned into bytes or into a plain structure and read back somewhere else:

- an HTTP, RPC or GraphQL response, and a server action's return value;
- props passed from a server-rendered component to a client one;
- `postMessage` to a worker, a frame or another window;
- a message published to a queue or an event bus;
- a cache entry, a session store, `localStorage`, a cookie, a query parameter;
- a JSON column in a database;
- a structured log line.

The boundary is often invisible in the code. A function call that looks local can be a network hop, and that is exactly why the loss goes unnoticed.

## What a Boundary Takes Away

**Methods and prototypes.** A value that carried behaviour arrives as a bag of fields. Anything the calling code did by invoking a method has to be done another way.

**Class identity.** `instanceof` is meaningless on the far side. Discriminating by class works up to the boundary and silently stops working after it.

**Non-enumerable properties.** `JSON.stringify` skips them, which is why serializing a native `Error` yields `{}` — the message is not enumerable. Any type that wraps an error and expects it to survive has to make those fields enumerable deliberately.

**The jurisdiction of your static tools.** This is the one that costs most, because nothing reports it. A lint rule or a type that forces callers to handle a failure only governs the typed value; once it has been flattened into a plain structure, the rule has nothing to attach to. The guarantee holding up the whole of one side ends exactly where the other side picks the value up, and no tool says so.

**Every type whose value is an invariant, not a shape.** A timezone-aware temporal value crosses as a string, a typed identifier crosses as a string, an immutable entity crosses as a plain object. Each one loses precisely the thing its standard exists to guarantee. Crossing the boundary is not the problem; leaving it flattened afterwards is.

## Design What Crosses

**Carry a literal discriminant.** Whatever is going to be distinguished on the far side needs a field that survives — a string literal naming the kind, not the class. On arrival, switch on that field and never on `instanceof`.

**Keep it rich in domain terms.** The point of crossing is not to degrade to `{ success: boolean, message: string }`. What crosses should still name the domain: which rule was violated, which entity, which state. Flattening the vocabulary at the boundary is how the far side ends up guessing from a string.

**Make sure what you need is actually enumerable**, and verify it rather than assuming — serialize one and look at the result.

## Reinstate the Guarantee on Arrival

**Rebuild the type at the boundary, through one door.** A single helper turns what arrived back into the type the rest of the code expects, and everything on the far side goes through it. Values read by hand, each at its own call site, is how a boundary quietly becomes a hundred boundaries.

**Reinstate it before the value spreads.** Parsing the temporal string, wrapping the identifier, reconstructing the result — at the edge, once, not at each use.

**Code that reads the flattened shape by hand is debt, not a pattern.** It works, and every copy of it is a place the guarantee does not hold. Write it down as debt rather than letting it read as the way things are done here.

## Two Ways a Remote Call Fails

A call across a boundary has **two** failure modes, and code that handles one usually believes it has handled both:

1. **It answered, and the answer is a failure.** The far side did its job and is telling you it could not.
2. **It did not answer.** The network, a timeout, an abort, a crash above the handler, a deployment mid-flight.

The helper that rebuilds the value covers both, and produces the same failure type for each. Otherwise the second mode reaches the caller as something it was never written to handle.

## A try/catch Around a Call That Returns Its Failure Is False Cover

When an operation reports failure **as a returned value**, a `try/catch` around it catches only the transport blowing up. The returned failure sails straight through, unhandled.

It is the most expensive shape of this mistake because of how it reads: the block is there, the code looks attended to, and nobody looks again. Measured once in this organization, a server-side rejection reached neither the user nor observability, and it took twenty minutes to work out that a button was not stuck.

**Converting the failure into an exception to make the `try/catch` honest is not the fix either.** It abandons the typed-failure model in the layer that decides what to tell the person. It is legitimate only as an adapter at a frontier that demands throwing — a library whose contract is to throw — and then only there.

See [Neverthrow Return Types](neverthrow-return-types.md) and [Neverthrow Wrap Exceptions](neverthrow-wrap-exceptions.md) for the model this preserves, and [Failure Reporting](failure-reporting.md) for who decides whether the failure is reported.

## Review Questions

- Does this value cross a boundary? Which one, and is it visible in the code?
- What does it lose on the way — methods, class, non-enumerable fields, a lint rule's jurisdiction?
- Is anything discriminated by `instanceof` on the far side?
- Does what crosses still name the domain, or has it degraded to a boolean and a string?
- Is the type rebuilt at the edge, through one door, or read by hand at each call site?
- Are both failure modes of the remote call handled, including the one where nothing answers?
- Is there a `try/catch` around a call that returns its failure as a value?

## Report the Outcome

When finishing the task, state:

- which boundary the change crosses and what the value loses crossing it;
- where the type is rebuilt, and that everything on the far side goes through it;
- how the far side discriminates, and that it is not by class;
- any place left reading the flattened shape by hand, recorded as debt.
