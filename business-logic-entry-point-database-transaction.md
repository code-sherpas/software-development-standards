# Database Transaction for Business Logic Entry Points

## Goal

Every business-logic entry point that interacts with a database must wrap its entire flow in a single database transaction, when the underlying persistence technology supports transactions.

Use the project's existing library, framework, or ORM to open and manage the transaction. Do not introduce a custom transaction mechanism when the project stack already provides one.

The transaction must encompass the full entry-point flow: business constraints, business rules, business operations, and persistence. The entire flow succeeds or fails atomically.

If the persistence technology does not support transactions (e.g., some NoSQL databases, object stores, or file-based storage), this standard does not apply.

## Exception: read-only query handlers may read over the connection pool

A business-logic entry point that performs **no writes** and only needs the least-blocking isolation level — a read-only query handler under Command-Query Separation — MAY skip the interactive transaction entirely and read over the connection pool instead of wrapping its flow in one.

The rationale:

- At the least-blocking isolation level there is no cross-statement snapshot to gain from an interactive transaction, so the transaction buys the read nothing.
- An interactive transaction pins a single physical connection for its whole flow. Every read of the handler then serializes on that one connection — including reads the ORM resolves as **separate statements**, such as relation `include`s, and any `combine` / `Promise.all` fan-out over repositories. On some drivers this pipelining is a deprecation or a hard error. Reading over the pool gives each read its own connection.

This exception is **only** for handlers that perform no writes. Command handlers — and any handler that mutates state — always wrap their entire flow in a single transaction as the Goal requires; their precondition reads must stay inside that transaction so the flow remains atomic.

When a handler reads over the pool, its repository read methods must work **without** a transaction. Keep the transaction parameter optional and fall back to the pooled client when it is absent, so the same repository method serves both a command handler's transaction and a query handler's pooled read (this composes with the optional-transaction shape the execution-context and repository standards already describe).

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines a business-logic entry point that reads from or writes to a database
- executes multiple database operations within a single entry point without a wrapping transaction
- partially wraps some operations in a transaction while leaving others outside
- manages transaction boundaries inside inner helpers rather than at the entry-point level

## The Rule

1. Define a dedicated `runWithinTransaction` function.
   - The function receives two arguments: an options object that carries the isolation level (and any other transaction-level settings the project needs) and a callback containing the business logic to execute inside the transaction.
   - The function opens the database transaction using the project's library, framework, or ORM, runs the callback inside it, commits on success, and rolls back on failure.
   - Transaction management is the single responsibility of this function. It does not set up execution contexts, resolve requester identity, or perform any other cross-cutting concern.
   - When the project follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), `runWithinTransaction` stores the opened transaction in the execution context so inner functions can read it through the context getter. The callback signature does not receive the transaction explicitly.
   - When execution context is not in use, `runWithinTransaction` passes the opened transaction to the callback as an argument, and inner functions receive it explicitly through their parameters.

2. Wrap the entire entry-point flow in a single call to `runWithinTransaction`.
   - The transaction begins before any business constraint that accesses the database.
   - The transaction commits only after the entire flow completes successfully.
   - The transaction rolls back if any step fails.

3. Use the project's transaction mechanism inside `runWithinTransaction`.
   - The implementation of `runWithinTransaction` uses the library, framework, or ORM that the project already uses for database access.
   - Follow the project's idiomatic pattern for transaction management, whether that is a decorator, context manager, callback, wrapper function, or explicit begin/commit/rollback.

4. Place the transaction boundary at the entry point, not inside inner helpers.
   - The entry point owns the transaction by calling `runWithinTransaction` directly.
   - Inner helpers, business constraints, and persistence functions participate in the transaction but do not open their own.
   - Do not nest independent transactions within the same entry-point flow.

5. Include all database-accessing steps in the transaction.
   - Business constraints that query the database to verify preconditions must run inside the transaction.
   - Persistence operations that store or update data must run inside the transaction.
   - Read operations that inform business decisions must run inside the transaction.

## Detection Workflow

1. Find business-logic entry points that access a database.
   - Identify command handlers, query handlers, use cases, or application services that read from or write to a database.

2. Check for a wrapping transaction.
   - Verify that a transaction is opened at the entry-point level.
   - Verify that the transaction encompasses the entire flow.

3. Check for partial or misplaced transactions.
   - Look for transactions opened inside inner helpers rather than at the entry point.
   - Look for database operations that execute outside the transaction boundary.

4. Check the transaction mechanism.
   - Verify that the project's existing library, framework, or ORM is used.
   - Verify that the pattern is idiomatic for the project.

## Writing or Changing Entry Points

1. Open the transaction at the entry point.
   - Use the project's idiomatic transaction pattern.
   - Ensure the transaction wraps the first database-accessing step through the last.

2. Pass the transaction context to inner helpers.
   - If the project's transaction mechanism requires an explicit connection, session, or context object, pass it from the entry point to inner functions.
   - If the project uses implicit transaction propagation (e.g., thread-local, async context), verify that inner helpers participate in the same transaction.

3. Commit on success, rollback on failure.
   - Let the transaction mechanism handle commit and rollback based on the entry-point outcome.
   - Do not manually commit partway through the flow.

4. Do not suppress transaction errors.
   - If the commit fails, propagate the error through the entry point's error convention.

## Composition with Execution Context

When the project follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), `runWithinTransaction` and `runWithinContext` are two separate functions, each with a single responsibility. The entry point composes them: the outer call to `runWithinContext` sets up the context, and the inner call to `runWithinTransaction` opens the transaction inside it. The transaction is stored in the execution context so inner functions can read it through the getter.

- `runWithinContext` does not know about transactions or isolation levels.
- `runWithinTransaction` does not create or manage the execution context — it assumes the context already exists in the surrounding scope (set up by `runWithinContext`) and writes the opened transaction into it.
- Inner functions, business constraints, and repository methods retrieve the transaction from the execution context instead of receiving it as a parameter.
- The entry point owns the transaction lifecycle through `runWithinTransaction`: it opens, commits, and rolls back the transaction.
- When a repository retrieves the transaction from the execution context and it is `undefined` or `null`, the repository must create a new standalone transaction for that operation. This ensures repository methods work both inside a wrapping transaction and outside one.
- All other rules in this standard still apply: the transaction wraps the entire entry-point flow, it is opened at the entry-point level, and all database-accessing steps run inside it.

## Examples

TypeScript implementation of `runWithinTransaction` integrated with execution context (Prisma):

```ts
import { Prisma, PrismaClient } from "@prisma/client";
import { ResultAsync } from "neverthrow";

type TransactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel;
};

const prisma = new PrismaClient();

function runWithinTransaction<Ok, Err>(
  options: TransactionOptions,
  fn: () => ResultAsync<Ok, Err>,
): ResultAsync<Ok, Err> {
  const context = getExecutionContext();

  // Reuse an existing transaction already stored in the context
  if (context?.transaction) {
    return fn();
  }

  return ResultAsync.fromPromise(
    prisma.$transaction(async (transaction) => {
      if (context) context.transaction = transaction;

      const result = await fn().match(
        (ok) => ({ ok }),
        (err) => ({ err }),
      );

      if ("ok" in result) return result.ok;

      // Throwing is necessary for the transaction to roll back
      throw result.err;
    }, options),
    (error) => error as Err,
  );
}
```

TypeScript entry point — composes `runWithinContext` with `runWithinTransaction`:

```ts
function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  return runWithinContext(() =>
    runWithinTransaction({ isolationLevel: "REPEATABLE READ" }, () =>
      ensureRequesterIsAuthenticated()
        .andThen((requesterId) =>
          ensureAvailableCars(command.carClass)
        )
        .andThen(() =>
          persistReservation(reservation)
        ),
    ),
  );
}
```

TypeScript entry point without execution context — `runWithinTransaction` passes the transaction to the callback explicitly:

```ts
function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  return runWithinTransaction({ isolationLevel: "REPEATABLE READ" }, (transaction) =>
    ensureRequesterIsAuthenticated(command.requesterId)
      .andThen((requesterId) =>
        ensureAvailableCars(transaction, command.carClass)
      )
      .andThen(() =>
        persistReservation(transaction, reservation)
      ),
  );
}
```

Python with a context manager:

```py
def create_reservation_command_handler(
    command: CreateReservationCommand,
) -> CreateReservationCommandHandlerSuccess:
    with run_within_transaction(isolation_level="REPEATABLE READ") as tx:
        requester_id = ensure_requester_is_authenticated(command.requester_id)
        ensure_available_cars(tx, command.car_class)
        return persist_reservation(tx, reservation)
```

Kotlin with a framework transaction:

```kt
fun createReservationCommandHandler(
    command: CreateReservationCommand,
): CreateReservationCommandHandlerSuccess {
    return runWithinTransaction(isolationLevel = IsolationLevel.REPEATABLE_READ) { tx ->
        val requesterId = ensureRequesterIsAuthenticated(command.requesterId)
        ensureAvailableCars(tx, command.carClass)
        persistReservation(tx, reservation)
    }
}
```

Not this — mixing transaction concerns inside `runWithinContext`:

```ts
// Bad: runWithinContext should not open transactions
return runWithinContext(
  () => /* business logic */,
  { transaction: { isolationLevel: "REPEATABLE READ" } }, // wrong concern
);
```

## Review Questions

When reading or reviewing code, ask:

- Does this entry point access a database?
- Is the entire flow wrapped in a single transaction?
- Is the transaction opened at the entry-point level, not inside inner helpers?
- Do all database-accessing steps, including business constraints, run inside the transaction?
- Is the project's existing transaction mechanism used?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which entry points were identified or changed
- state how the transaction wraps the entire entry-point flow
- state which transaction mechanism from the project stack was used
- state whether any database-accessing steps were moved inside the transaction boundary
