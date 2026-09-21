# Prefer Named Functions Over Anonymous Functions

## Goal

When defining a function, prefer a named function over an anonymous one, regardless of the technology stack.

A named function is any callable whose definition is bound to an explicit, descriptive identifier visible at its definition site (a function declaration, a named function expression, an arrow function or lambda assigned to a `const`/`val`/`let` with a meaningful name, a named method, or a named local helper). An anonymous function is a callable defined inline without a stable, descriptive identifier — typically a lambda, arrow function, block, or function expression passed directly as an argument or returned without being bound to a name.

Named functions improve stack traces, code navigation, searchability, reuse, testability, and the reader's ability to understand intent without parsing the body. Anonymous functions are still appropriate when the stack expects them or when naming would actively hurt readability.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines a callback, handler, listener, mapper, predicate, comparator, reducer, effect, or task as an inline anonymous function
- assigns an anonymous function or lambda to a variable without a meaningful name
- passes an inline lambda or arrow function with non-trivial logic as an argument
- defines an event handler, route handler, middleware, or job as an anonymous function
- exports an anonymous function or anonymous default export from a module
- repeats the same anonymous function shape in multiple places that could share a named definition

## The Rule

1. Default to a named function for every function you define.
   - Use the language's idiomatic naming construct: function declaration, named function expression, named lambda binding, named method, or named local helper.
   - Choose a name that describes the function's intent in domain terms, not its mechanics.

2. Bind anonymous shapes to a descriptive name when they have non-trivial logic.
   - If a callback, handler, or lambda contains more than a single trivial expression, lift it to a named function or a named local binding before passing it.
   - Prefer extracting it to module scope or a clearly named local constant over inlining it.

3. Avoid anonymous default exports and anonymous module-level functions.
   - Export functions under explicit names so call sites, stack traces, and tooling can identify them.
   - Do not rely on the importing module to give the function a name.

4. Use anonymous functions only when one of the documented exceptions applies.
   - The exception must be specific and justifiable, not a stylistic default.
   - When in doubt, name it.

## When Anonymous Functions Are Appropriate

Anonymous functions are appropriate when at least one of these holds:

- **The stack is designed around anonymous callables.** The language, framework, or API is built such that anonymous functions are the natural, idiomatic, or required form. Examples include single-expression collection operations (`map`, `filter`, `reduce`), trailing lambdas in DSLs, structural shorthand like Kotlin's trailing lambda, Ruby blocks, Scala for-comprehensions, SAM conversions, or framework hooks that explicitly expect inline closures.
- **The function body is a trivial, self-evident expression.** A one-line transformation, projection, or predicate where a name would only restate the body (e.g., `users.map(u => u.id)`, `items.filter(i => i.active)`).
- **Naming would actively hurt readability.** Introducing a name forces the reader to jump elsewhere to understand a one-shot, locally scoped operation whose meaning is obvious from context.
- **The callable is a single-use, locally scoped continuation.** A short closure that captures local state, runs once, and has no meaning outside its call site.
- **The framework or runtime requires an anonymous form.** The API contract only accepts inline lambdas, blocks, or anonymous classes (e.g., certain reactive operators, effect runners, or platform callbacks where naming is impossible or unidiomatic).
- **Project conventions consistently use anonymous functions for this construct.** The codebase has an established, deliberate convention and switching to named forms would introduce inconsistency or friction.

In all these cases, keep the anonymous body small and focused. If it grows beyond a trivial expression, lift it to a named function.

## Examples

Prefer this:

```ts
function isActiveAdult(user: User): boolean {
  return user.isActive && user.age >= 18;
}

const activeAdults = users.filter(isActiveAdult);
```

```py
def is_active_adult(user: User) -> bool:
    return user.is_active and user.age >= 18

active_adults = [u for u in users if is_active_adult(u)]
```

```kt
fun isActiveAdult(user: User): Boolean = user.isActive && user.age >= 18

val activeAdults = users.filter(::isActiveAdult)
```

Avoid this when the body is non-trivial:

```ts
const activeAdults = users.filter((u) => {
  const meetsAge = u.age >= 18;
  const isVerified = u.verifiedAt !== null;
  return u.isActive && meetsAge && isVerified;
});
```

```js
export default (req, res) => {
  // anonymous default export — invisible in stack traces and imports
};
```

Anonymous is fine when the body is trivial and idiomatic:

```ts
const ids = users.map((u) => u.id);
const active = users.filter((u) => u.isActive);
```

```py
ids = [u.id for u in users]
```

```kt
val ids = users.map { it.id }
```

Anonymous is fine when the stack expects it:

```kt
button.setOnClickListener { view -> handleClick(view) }
```

```ts
useEffect(() => {
  subscribe();
  return () => unsubscribe();
}, []);
```

## Detection Workflow

1. Identify anonymous callables in the changed or reviewed code.
   - Look for inline lambdas, arrow functions, function expressions, blocks, anonymous classes, and anonymous default exports.
   - Note any callable whose definition site has no descriptive identifier.

2. Classify each anonymous callable.
   - Trivial single-expression body in an idiomatic collection or framework call: leave as is.
   - Required by the framework or runtime contract: leave as is.
   - Established project convention: respect it.
   - Otherwise: candidate for renaming or extraction.

3. Check stack traces, logs, and tooling impact.
   - Anonymous functions often appear as `<anonymous>`, `lambda`, `<lambda>`, or generated names in errors and profilers.
   - If the function participates in async flows, error reporting, or hot paths, prefer a name to aid debugging.

4. Look for repeated anonymous shapes.
   - The same anonymous predicate, mapper, or handler used in multiple places is a strong signal to extract a single named function.

## Writing or Changing Functions

1. Name first.
   - When you write a new function, give it an explicit, descriptive name in the language's idiomatic form.
   - Place it at the smallest scope where it is reusable and discoverable.

2. Extract when bodies grow.
   - If an anonymous callback grows beyond a trivial expression, extract it to a named function before continuing.
   - Keep the call site readable: `users.filter(isActiveAdult)` over a multi-line inline lambda.

3. Replace anonymous default exports with named exports.
   - Export the function under an explicit name and let the importer use the same name.

4. Preserve idiomatic anonymous use.
   - Do not rewrite `users.map((u) => u.id)` into a named helper just to satisfy the rule.
   - Do not name closures that the framework expects to be anonymous and that have no meaning outside the call site.

5. Match project conventions.
   - If the codebase has a consistent, deliberate convention for a given construct (e.g., always-anonymous route handlers in a specific framework), follow it.
   - If the convention is accidental or inconsistent, prefer named forms going forward.

## Review Questions

When reading or reviewing code, ask:

- Is this callable anonymous when a named function would work?
- Does its body go beyond a trivial, self-evident expression?
- Would a name help stack traces, navigation, search, or reuse?
- Is the anonymous form genuinely required or strongly favored by the stack, framework, or local readability?
- Is the same anonymous shape repeated in multiple places that could share a named definition?
- Is this an anonymous default export or anonymous module-level function that should be named?

If a callable is anonymous without a clear reason, apply this standard.

## Report the Outcome

When finishing the task:

- state which anonymous callables were identified, named, or extracted
- state which anonymous callables were intentionally left anonymous and why (stack idiom, trivial body, framework requirement, or project convention)
- state whether project conventions or stack constraints influenced the choice
