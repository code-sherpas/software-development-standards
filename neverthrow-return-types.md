# Neverthrow Return Types

## Goal

Model every compatible function and method with `neverthrow` return types — in TypeScript and JavaScript — or, in any other stack, with its established equivalent (see «Other Stacks»).

This standard governs return signatures only. If the task also changes how thrown exceptions or rejected promises are captured, apply [Neverthrow Exception Wrapping](neverthrow-wrap-exceptions.md) alongside this standard.

## What Counts as In Scope

The return type of every function and method in TypeScript or JavaScript code, and in code of any other stack through its equivalent (see «Other Stacks»):

- standalone functions
- exported module functions
- class methods
- object literal methods
- factory-returned methods
- service, repository, and domain APIs

Do not treat nesting as an exception. A method inside a class or object follows the same rule as a top-level function.

Out of scope:

- an incompatible boundary enforced by the surrounding technology, library, or framework — the only allowed exception. `neverthrow` is still kept inside it: see «Detect Compatibility First»;
- how thrown exceptions or rejected promises are captured: that is [Neverthrow Exception Wrapping](neverthrow-wrap-exceptions.md).

## Other Stacks

`neverthrow` is the TypeScript and JavaScript implementation of one rule: **a failure the caller must handle is part of the return type, not an exception.** In any other stack, the rule is the same and the type is that stack's established equivalent:

- a language that has one built in uses it — `Result` in Rust and Swift, `Either` in Scala, the `(value, error)` pair in Go;
- otherwise, the typed result library the project already uses — Arrow's `Either` in Kotlin, Vavr's `Either` or `Try` in Java, a `Result` library in C# or Python;
- if the project has none, choosing one is a dependency decision: ask, as «Detect Compatibility First» says for adding `neverthrow`.

Everything else in this standard applies with the names translated: an explicit, stable error type; the result kept inside a boundary that cannot return it; no ad hoc failure shapes such as `null` or sentinel values.

## Detect Compatibility First

1. Identify the real contract of the function or method before editing.
   - Check implemented interfaces, overridden members, framework callback types, decorators, lifecycle hooks, route handler signatures, component signatures, and public SDK contracts.
   - If the contract already requires `Result` or `ResultAsync`, keep it.
   - If the contract requires another shape, the boundary is incompatible.

2. Treat these as common incompatible boundaries unless the local technology explicitly supports `neverthrow` returns:
   - UI render functions that must return elements or nodes.
   - Framework route handlers, middleware, loaders, actions, controllers, or resolvers that must return `Response`, framework reply objects, `void`, or `Promise` of those values.
   - Event listeners, test callbacks, constructors, getters, setters, and other APIs with fixed runtime signatures.
   - Interface implementations or overridden methods whose declared return type cannot be widened to `Result` or `ResultAsync`.

3. When incompatibility exists, keep `neverthrow` inside the boundary.
   - Move business logic into internal helper functions or methods that return `Result` or `ResultAsync`.
   - Convert the final `Ok` or `Err` into the framework-native return value only at the outermost boundary.
   - Do not fall back to ad hoc failure shapes such as `null`, sentinel values, or framework-specific shortcuts merely because the boundary itself cannot return `neverthrow`.

4. If the target project does not already depend on `neverthrow`, add the dependency only when the task allows dependency changes.
   - If dependency changes are out of scope, state that the policy cannot be fully applied yet.

## Choose the Return Type

1. Use `Result<T, E>` for synchronous work.
2. Use `ResultAsync<T, E>` for asynchronous work.
3. Prefer explicit domain error types for `E`.
   - Use discriminated unions, tagged objects, or stable error classes that match the local style.
   - Avoid `unknown`, `any`, and vague string errors unless the codebase already standardizes on them.
4. Use `ok(...)`, `err(...)`, `okAsync(...)`, and `errAsync(...)` to construct success and failure values explicitly.

## Implementation Rules

1. Do not mark a function or method `async` if its public contract should be `ResultAsync<T, E>`.
   - Return `ResultAsync` directly so callers can compose with `.map`, `.mapErr`, `.andThen`, and `.orElse`.
   - Avoid `Promise<Result<T, E>>` unless a framework boundary explicitly requires a native `Promise`.

2. When touching a module, update all edited compatible functions and methods in that scope.
   - Do not convert only top-level functions while leaving neighboring compatible class or object methods on non-`neverthrow` signatures if they are part of the same requested change.

## Boundary Pattern

When the outer API cannot return `neverthrow`, use this pattern:

```ts
function createUser(
  input: CreateUserInput,
): ResultAsync<User, CreateUserError> {
  return validateInput(input).asyncAndThen(insertUser)
}

export async function post(request: Request): Promise<Response> {
  const result = await createUser(await request.json())

  return result.match(
    (user) => Response.json(user, { status: 201 }),
    (error) => toErrorResponse(error),
  )
}
```

## Validate Before Finishing

1. Verify every edited compatible function or method now returns `Result` or `ResultAsync`.
2. Verify incompatible boundaries adapt from internal `neverthrow` results instead of bypassing them.
3. Verify imports come from `neverthrow` and match actual usage.
4. Verify error types are explicit and stable enough for callers.
5. Run the normal local validation for the stack when it is safe and in scope, such as tests, linting, or type checks.

## Report the Outcome

When finishing the task:

- State which functions or methods now return `Result` or `ResultAsync`.
- State which boundaries remained non-`neverthrow` and why they were incompatible.
- State how `Err` values are typed and mapped.
