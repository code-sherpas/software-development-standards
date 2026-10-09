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

## Exception: reads from another service happen before the transaction, not inside it

A business-logic entry point that needs an answer from another service — a payment processor, an identity provider, any remote API — to decide what to write MUST NOT keep a database transaction open while it waits for that answer. It asks first, outside any transaction, and then opens a short transaction that does the database work.

The rationale:

- **A transaction cannot undo a call to another service.** Rolling back the database does not take back what the other service did or said, so keeping the call inside the transaction buys no atomicity.
- **An open transaction pins a pooled connection for as long as the other service takes**, and holds its snapshot for that long. Remote latency becomes pool exhaustion and wider write-conflict windows.
- **The ORM expires a transaction that stays open past its limit.** Measured in this organization: three reads from a payment processor took 5.2 s together, the write that followed landed on a transaction the ORM had already expired after 5 s, and the record stayed stale. Raising the limit only moves the cliff, unless every call also has a deadline — and then the connection is still held until it.

The exception covers only calls that **change nothing at the other service** — retrievals. A call that creates, charges, sends or publishes is a side effect, and where it sits relative to the transaction is a separate decision.

When an entry point takes this exception:

1. **Decide inside a transaction, ask outside it, write inside another.** Everything the entry point checks before asking — authentication, authorization, feature availability, whether the work is needed at all — stays in a transaction (or a pooled read, for a query handler). The call to the other service happens after it closes. The write gets a transaction of its own.
2. **The write transaction re-reads what it is about to change and revalidates it** against what the question was based on. If the record moved on while the other service was answering — it now refers to a different external object, say — the answer describes a state that no longer exists: write nothing, and let the next run ask again. Writing it anyway would undo the change that happened in between.
3. **Every call to the other service has a deadline**, so a service that never answers cannot hold the entry point — or a job that runs entry points one after another — indefinitely.
4. **The write transaction can be retried on a write conflict** under the rules in [Transaction Isolation Levels](business-logic-entry-point-transaction-isolation-levels.md): it re-reads, so a retry starts from the current state, and it does not call the other service again.

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
- Does the entry point wait for another service while a transaction is open? If it reads from one, does it ask before the transaction, and does the write revalidate what the answer was based on?
- Is the project's existing transaction mechanism used?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which entry points were identified or changed
- state how the transaction wraps the entire entry-point flow
- state which transaction mechanism from the project stack was used
- state whether any database-accessing steps were moved inside the transaction boundary
