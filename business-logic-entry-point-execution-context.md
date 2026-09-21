# Execution Context for Business Logic Entry Points

## Goal

Every business-logic entry point must set up an execution context that makes request-scoped data implicitly accessible from any point in the execution chain.

The execution context replaces explicit parameter passing for cross-cutting, request-scoped data. Functions deeper in the call chain retrieve the context from the ambient store instead of receiving it as a parameter.

The entry point itself — not the infrastructure caller — is responsible for creating and populating the execution context. Whether or not execution context is used is a business-logic concern. Infrastructure code such as HTTP handlers, controllers, server actions (Next.js), message consumers, or scheduled jobs must not know about the execution context. They call the entry point normally.

In Node.js projects, use `AsyncLocalStorage` from the `node:async_hooks` module.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines a business-logic entry point that needs request-scoped data available throughout its execution chain
- defines the execution context type that holds request-scoped data
- reads the execution context from within business logic, persistence, or other inner functions
- manages the lifecycle of the execution context store

## The Rule

1. The entry point sets up the execution context.
   - The entry point — not the infrastructure caller — is responsible for setting up the context.
   - The entry point wraps its own body with `runWithinContext` or its project-equivalent.
   - `runWithinContext` encapsulates the context lifecycle: it checks if a context already exists in the current execution chain and reuses it, or creates a new one if none exists. The entry point does not build or pass the context object explicitly.
   - `runWithinContext` has a single responsibility: making the execution context available. It does not open database transactions, manage isolation levels, or run any other cross-cutting concern. Transaction management is handled by a separate function (see [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md)).
   - Infrastructure callers (HTTP handlers, controllers, server actions, message consumers) call the entry point directly without knowing about the execution context.

2. Use `AsyncLocalStorage` in Node.js projects.
   - Create a single `AsyncLocalStorage` instance for the execution context.
   - Use `AsyncLocalStorage.run()` to bind the context to the execution chain.
   - The context is available through the entire asynchronous execution chain started by the callback.

3. Define a typed execution context.
   - Declare an explicit type for the execution context that lists all fields the project needs.
   - Fields that may not be available in all execution paths must be nullable.
   - Do not use an untyped store such as `Map<string, unknown>` or `Record<string, any>`.

4. Expose a getter for the execution context.
   - Provide a function such as `getExecutionContext()` that retrieves the current context from the store.
   - The getter must return the context type or `undefined` when called outside an execution context scope.
   - Do not throw when the context is absent. Return `undefined` and let the caller decide how to handle it.

5. The execution context holds cross-cutting, request-scoped data.
   - Suitable data: requester identity, database transaction, request metadata, correlation IDs, application mode.
   - The execution context is not a general-purpose dependency injection container. Only store data that is scoped to the current request or execution and that multiple layers need to access.

6. Inner functions access the context through the getter, not through parameters.
   - Business logic, persistence functions, and other inner functions call the getter to obtain request-scoped data.
   - Do not pass the execution context or its fields as explicit parameters through the call chain when the data is already available in the store.

7. Repository implementations must handle absent transactions gracefully.
   - When a repository retrieves the transaction from the execution context and it is `undefined` or `null`, the repository must create a new standalone transaction for that operation.
   - This ensures repository methods work both inside a wrapping transaction (using the shared one from the context) and outside one (creating their own).

## Detection Workflow

1. Find business-logic entry points.
   - Identify command handlers, query handlers, use cases, or application services.

2. Check whether the entry point sets up an execution context.
   - Verify that the entry point wraps its body with `runWithinContext` or its project equivalent.

3. Check that infrastructure callers do not set up the execution context.
   - HTTP handlers, controllers, server actions, message consumers, and other callers must call the entry point directly.
   - They must not import or reference the execution context module.

4. Check the execution context type.
   - Verify that a typed execution context exists.
   - Verify that nullable fields are explicitly marked.

5. Check inner functions for explicit parameter passing of context data.
   - Look for request-scoped data such as requester identity or database transactions being passed explicitly through the call chain.
   - These should instead be retrieved from the execution context getter.

## Writing or Changing Code

1. Define the execution context type.
   - List all request-scoped fields the project needs.
   - Mark fields that may not be available as nullable.

2. Create the execution context store.
   - In Node.js, create a single `AsyncLocalStorage<ExecutionContextType>` instance.
   - Export the `runWithinContext` wrapper and the `getExecutionContext` getter from the same module.

3. Implement `runWithinContext`.
   - `runWithinContext` checks if a context already exists in the current execution chain. If it does, it reuses the existing context and runs the function directly. If it does not, it creates a new context and binds it to the execution chain.
   - The context creation logic is encapsulated inside `runWithinContext`. Entry points do not build or pass the context object.
   - `runWithinContext` does not open database transactions, does not accept transaction or isolation-level options, and does not handle any other cross-cutting concern. Transactions live in `runWithinTransaction` (see [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md)).

4. Wrap the entry point's body with `runWithinContext`.
   - The entry point calls `runWithinContext` with its business logic as a callback.
   - The entry point does not pass a context object — `runWithinContext` handles that internally.
   - When the entry point needs a database transaction, it composes `runWithinContext` with `runWithinTransaction` from [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md): the outer call sets up the context, and the inner call opens the transaction inside it. Each function has a single responsibility.

5. Keep infrastructure callers simple.
   - HTTP handlers, controllers, server actions, and other callers call the entry point directly.
   - Do not import the execution context module from infrastructure code.

6. Retrieve context in inner functions through the getter.
   - Replace explicit parameter passing of request-scoped data with calls to `getExecutionContext()`.
   - Handle the `undefined` case when the getter is called outside a context scope.

## Examples

TypeScript with AsyncLocalStorage:

```ts
import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@prisma/client";
import { ResultAsync } from "neverthrow";

type ExecutionContext = {
  requesterId: string | null;
  transaction: Prisma.TransactionClient | null;
};

const executionContextStore = new AsyncLocalStorage<ExecutionContext>();

function runWithinContext<Ok, Err>(
  fn: () => ResultAsync<Ok, Err>,
): ResultAsync<Ok, Err> {
  // Reuse existing context or build a new one
  const context: ExecutionContext =
    executionContextStore.getStore() ?? buildExecutionContext();

  return executionContextStore.run(context, fn);
}

function getExecutionContext(): ExecutionContext | undefined {
  return executionContextStore.getStore();
}
```

`runWithinContext` does not know about transactions — opening a transaction is the job of `runWithinTransaction` from [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md). The entry point composes them: the outer call sets up the context, and the inner call opens the transaction inside it.

Command handler with a REPEATABLE READ transaction:

```ts
function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  return runWithinContext(() =>
    runWithinTransaction({ isolationLevel: "REPEATABLE READ" }, () =>
      ensureRequesterIsAuthenticated()
        .andThen((requesterId) =>
          ensureAvailableCars(command.carClass)
            .andThen(() => persistReservation(reservation))
        ),
    ),
  );
}
```

Query handler with the least blocking isolation level:

```ts
function findReservationByIdQueryHandler(
  query: FindReservationByIdQuery,
): ResultAsync<FindReservationByIdQueryHandlerSuccess, FindReservationByIdQueryHandlerError> {
  return runWithinContext(() =>
    runWithinTransaction({ isolationLevel: "READ UNCOMMITTED" }, () =>
      ensureRequesterIsAuthenticated()
        .andThen((requesterId) =>
          findReservationById(query.reservationId)
        ),
    ),
  );
}
```

Entry point without a transaction — `runWithinContext` is used on its own:

```ts
function validateEmailCommandHandler(
  command: ValidateEmailCommand,
): ResultAsync<void, ValidateEmailCommandHandlerError> {
  return runWithinContext(() =>
    ensureRequesterIsAuthenticated()
      .andThen((requesterId) =>
        validateEmail(command.email)
      )
  );
}
```

Infrastructure callers are simple — they do not know about execution context:

```ts
// HTTP handler — just calls the entry point
app.post("/reservations", async (req, res) => {
  const result = await createReservationCommandHandler({
    carClass: req.body.carClass,
    startDate: req.body.startDate,
  });

  res.json(result);
});
```

```ts
// Next.js server action — just calls the entry point
"use server";

async function createReservation(formData: FormData) {
  return createReservationCommandHandler({
    carClass: formData.get("carClass") as string,
    startDate: formData.get("startDate") as string,
  });
}
```

Retrieving the context from an inner function:

```ts
function ensureRequesterIsAuthenticated(): ResultAsync<
  RequesterId,
  RequesterIsNotAuthenticated
> {
  const ctx = getExecutionContext();
  const requesterId = ctx?.requesterId ?? null;

  if (!requesterId) {
    return errAsync(new RequesterIsNotAuthenticated());
  }

  return okAsync(requesterId as RequesterId);
}
```

Not this — the entry point builds and passes the context explicitly:

```ts
// Bad: the entry point should not build the context object
function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  const context: ExecutionContext = {
    requesterId: command.requesterId,
    transaction: null,
  };

  return runWithinContext(context, () =>
    ensureRequesterIsAuthenticated()
      .andThen((requesterId) => { ... })
  );
}
```

Not this — passing request-scoped data explicitly through the call chain when execution context is available:

```ts
// Bad: request-scoped data should come from execution context, not parameters
function createReservationCommandHandler(
  command: CreateReservationCommand,
  requesterId: RequesterId,       // should come from execution context
  transaction: DatabaseTransaction, // should come from execution context
): void { ... }
```

Not this — `runWithinContext` receives transaction options and mixes two concerns:

```ts
// Bad: runWithinContext should not know about transactions or isolation levels
function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  return runWithinContext(
    () => ensureRequesterIsAuthenticated().andThen(/* ... */),
    { transaction: { isolationLevel: "REPEATABLE READ" } }, // wrong: belongs to runWithinTransaction
  );
}
```

## Review Questions

When reading or reviewing code, ask:

- Does this business-logic entry point set up an execution context?
- Does the entry point wrap its own body with `runWithinContext` or its project equivalent?
- Is there a typed execution context with explicitly nullable fields?
- Does a `getExecutionContext` getter exist that returns `undefined` when called outside a context scope?
- Are inner functions retrieving request-scoped data from the execution context instead of receiving it as explicit parameters?
- Is the execution context limited to request-scoped, cross-cutting data?
- Are infrastructure callers free from execution context concerns?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which entry points were identified or changed
- state how the entry point sets up the execution context
- state which fields are defined in the execution context type
- state which inner functions were changed to use the execution context getter instead of explicit parameters
- state that infrastructure callers do not reference the execution context
