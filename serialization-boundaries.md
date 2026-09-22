# Serialization Boundaries

## Goal

**Whatever crosses a serialization boundary arrives as data and nothing else.** That much is how serialization works. What this standard governs is the part that is a decision: **designing what crosses so the domain survives it**, and **reinstating the guarantee on arrival**, once, before the value reaches the code that uses it.

The loss worth naming is the one no tool reports: **a lint rule or a type that forces callers to handle something governs the typed value only.** Once it has been flattened, the rule has nothing to attach to. The guarantee holding up one side ends exactly where the other side picks the value up, and nothing says so.

This is not only about error types. A timezone-aware temporal value crosses as a string, a typed identifier crosses as a string, an immutable entity crosses as a plain object — each losing precisely what its own standard exists to guarantee. Crossing is not the problem; leaving it flattened afterwards is.

## What Counts as In Scope

Any point where a value is turned into bytes or a plain structure and read back somewhere else:

- an HTTP, RPC or GraphQL response, and a server action's return value;
- props passed from a server-rendered component to a client one;
- `postMessage` to a worker, a frame or another window;
- a message published to a queue or an event bus;
- a cache entry, a session store, `localStorage`, a cookie, a query parameter;
- a JSON column in a database.

The boundary is often invisible in the code. A call that looks local can be a network hop, which is why the loss goes unnoticed.

## Design What Crosses

**Carry a literal discriminant.** Whatever will be distinguished on the far side needs a field that survives — a string literal naming the kind. Class identity does not cross, so the far side switches on that field.

**Keep it rich in domain terms.** The point of crossing is not to degrade to `{ success: boolean, message: string }`. What crosses still names the domain: which rule was violated, which entity, which state. Flattening the vocabulary at the boundary is how the far side ends up guessing from a string.

**Verify what actually survives**, rather than assuming: serialize one and look at the result.

## Reinstate the Guarantee on Arrival

**Rebuild the type at the boundary, through one door.** A single helper turns what arrived back into the type the rest of the code expects, and everything on the far side goes through it.

**Reinstate it before the value spreads** — parsing the temporal string, wrapping the identifier, reconstructing the result — at the edge, once, not at each use.

**Code that reads the flattened shape by hand is debt, not a pattern.** It works, and every copy is a place the guarantee does not hold. Values read by hand at each call site is how one boundary quietly becomes a hundred. Record it as debt rather than letting it read as the way things are done here.

## Two Ways a Remote Call Fails

A call across a boundary has **two** failure modes, and code that handles one usually believes it has handled both:

1. **It answered, and the answer is a failure.** The far side did its job and is telling you it could not.
2. **It did not answer.** The network, a timeout, an abort, a crash above the handler, a deployment mid-flight.

The helper that rebuilds the value covers both, and produces the same failure type for each. Otherwise the second mode reaches the caller as something it was never written to handle.

See [Neverthrow Return Types](neverthrow-return-types.md) and [Neverthrow Wrap Exceptions](neverthrow-wrap-exceptions.md) for the model this preserves, and [Failure Reporting](failure-reporting.md) for who decides whether a failure is reported.

## Review Questions

- Does this value cross a boundary? Which one, and is it visible in the code?
- Which guarantee stops being enforced once it has crossed?
- Does what crosses still name the domain, or has it degraded to a boolean and a string?
- Is the type rebuilt at the edge, through one door, or read by hand at each call site?
- Are both failure modes of the remote call handled, including the one where nothing answers?

## Report the Outcome

When finishing the task, state:

- which boundary the change crosses and which guarantee stops holding there;
- where the type is rebuilt, and that everything on the far side goes through it;
- any place left reading the flattened shape by hand, recorded as debt.
