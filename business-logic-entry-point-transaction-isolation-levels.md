# Transaction Isolation Levels for Business Logic Entry Points

## Goal

When a business-logic entry point wraps its flow in a database transaction and follows Command-Query Separation, set the transaction isolation level based on whether the entry point is a command handler or a query handler, when the underlying persistence technology supports configurable isolation levels.

- Query handlers use the least blocking isolation level available in the project's database.
- Command handlers use REPEATABLE READ.

If the persistence technology does not support configurable isolation levels, this standard does not apply.

A read-only query handler has a further option: because the least-blocking isolation level provides no cross-statement snapshot, the handler MAY skip the interactive transaction altogether and read over the connection pool instead of opening one at the least-blocking level. See the exception in [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md). When it does open a transaction, the rule below (least-blocking level for query handlers, REPEATABLE READ for command handlers) still applies.

## When This Standard Applies

This standard applies only when all four conditions are met:

1. The entry point is a business-logic entry point.
2. The entry point wraps its flow in a database transaction.
3. The underlying persistence technology supports configurable isolation levels.
4. The entry point follows Command-Query Separation, so it is classified as either a command handler or a query handler.

If any of these conditions is not met, this standard does not apply.

## The Rule

1. Query handlers must use the least blocking isolation level available.
   - Use READ UNCOMMITTED if the database supports it.
   - If READ UNCOMMITTED is not available, use READ COMMITTED.
   - If neither is available, use the lowest isolation level the database provides.
   - The goal is to minimize locking and contention for read-only operations.

2. Command handlers must use REPEATABLE READ.
   - Set the isolation level to REPEATABLE READ explicitly.
   - This ensures that data read during business constraints and business decisions remains stable throughout the transaction, preventing non-repeatable reads between the constraint checks and the state changes.

3. Set the isolation level when opening the transaction.
   - Use the project's library, framework, or ORM to specify the isolation level at transaction creation time.
   - Do not change the isolation level mid-transaction.

4. Follow the database's naming conventions for isolation levels.
   - Use the exact isolation level name or constant that the project's database and library expect.
   - Map the conceptual levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ) to the project's specific syntax.

## Write Conflicts Are the Price of REPEATABLE READ

Choosing REPEATABLE READ for command handlers comes with an obligation the caller has to honour: **when two transactions write the same row, the database aborts the loser and tells it to run again.** In PostgreSQL that is SQLSTATE `40001`.

It is not a failure of the operation. It is the snapshot going stale, and the operation was correct — somebody simply got there first.

**Retrying is opt-in, and it must stay opt-in.** A retry re-runs the transactional operation from the top. The database work is rolled back; anything the flow already did *outside* the database is not. A handler that opened an account with a payment provider, published a post or sent an email before the conflict would do it twice. Only the entry point knows whether its own flow can be replayed.

When an entry point does opt in:

1. **Re-read, inside the transactional operation, whatever you are about to write.** The point of running again is to work from a current snapshot. An entity captured before the transaction would write back exactly the state the winner had just moved on from — turning a conflict the database detected into a silent overwrite, which is worse than the conflict. A sweep that listed its rows up front re-reads each one when its turn comes, rather than reusing what the listing returned.
2. **Tell the write that the failure is expected**, so a conflict that is recovered from does not reach error tracking — see [Failure Reporting](failure-reporting.md). The conflict that outlives every attempt is still reported, and that report is not optional.

**Two writers on one row is a shape, not an accident.** The common one is a projection refreshed on demand by a screen and refreshed on a schedule by a background job. When a feature adds a second writer to a row, it needs this treatment. Entry points with a single writer surface a conflict as an ordinary error, which is the correct outcome for them.

## Delegation to the Database Transaction Standard

The isolation level is set when calling `runWithinTransaction` from [Database Transaction for Business Logic Entry Points](business-logic-entry-point-database-transaction.md). That function takes an options object — which carries the isolation level — and the callback with the logic to execute inside the transaction. The isolation level rules remain the same: query handlers use the least blocking level, command handlers use REPEATABLE READ.

When the project also follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), the entry point composes both functions — `runWithinContext` on the outside to set up the context, `runWithinTransaction` on the inside to open the transaction at the chosen isolation level and store it in the context. When a repository retrieves the transaction from the execution context and it is `undefined` or `null`, the repository must create a new standalone transaction for that operation.

## Examples

TypeScript with execution context — `runWithinContext` outside, `runWithinTransaction` inside:

```ts
// Query handler — least blocking isolation level
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
  )
}

// Command handler — REPEATABLE READ
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
  )
}
```

TypeScript without execution context — `runWithinTransaction` passes the transaction explicitly to the callback:

```ts
// Query handler — least blocking isolation level
function findReservationByIdQueryHandler(
  query: FindReservationByIdQuery,
): ResultAsync<FindReservationByIdQueryHandlerSuccess, FindReservationByIdQueryHandlerError> {
  return runWithinTransaction({ isolationLevel: "READ UNCOMMITTED" }, (transaction) =>
    ensureRequesterIsAuthenticated(query.requesterId)
      .andThen((requesterId) =>
        findReservationById(transaction, query.reservationId)
      )
  )
}

// Command handler — REPEATABLE READ
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
      )
  )
}
```

Python with a context manager:

```py
# Query handler — least blocking isolation level
def find_reservation_by_id_query_handler(
    query: FindReservationByIdQuery,
) -> FindReservationByIdQueryHandlerSuccess:
    with run_within_transaction(isolation_level="READ UNCOMMITTED") as tx:
        requester_id = ensure_requester_is_authenticated(query.requester_id)
        return find_reservation_by_id(tx, query.reservation_id)

# Command handler — REPEATABLE READ
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
// Query handler — least blocking isolation level
fun findReservationByIdQueryHandler(
    query: FindReservationByIdQuery,
): FindReservationByIdQueryHandlerSuccess {
    return runWithinTransaction(isolationLevel = IsolationLevel.READ_UNCOMMITTED) { tx ->
        val requesterId = ensureRequesterIsAuthenticated(query.requesterId)
        findReservationById(tx, query.reservationId)
    }
}

// Command handler — REPEATABLE READ
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

## Detection Workflow

1. Confirm all three activation conditions.
   - The entry point is a business-logic entry point.
   - It wraps its flow in a database transaction.
   - It follows Command-Query Separation.

2. Classify the entry point as a command handler or a query handler.
   - Use the CQS classification from the project or from [Command-Query Separation for Business Logic Entry Points](business-logic-entry-point-command-query-separation.md).

3. Check the current isolation level.
   - Verify that query handlers use the least blocking level available.
   - Verify that command handlers use REPEATABLE READ.

4. Check that the isolation level is set at transaction creation time.
   - Verify that it is not changed mid-transaction.
   - Verify that the project's library or ORM syntax is used correctly.

## Writing or Changing Entry Points

1. Determine the CQS role first.
   - Classify the entry point as a command handler or a query handler.

2. Set the isolation level accordingly.
   - Query handler: use the least blocking isolation level the database supports.
   - Command handler: use REPEATABLE READ.

3. Specify the isolation level at transaction creation.
   - Use the project's idiomatic way to set isolation levels.
   - Do not rely on database-level defaults unless they match the required level.

## Review Questions

When reading or reviewing code, ask:

- Is this entry point a command handler or a query handler under CQS?
- Does it wrap its flow in a database transaction?
- Is the isolation level set explicitly at transaction creation time?
- Does a query handler use the least blocking isolation level available?
- Does a command handler use REPEATABLE READ?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which entry points were identified or changed
- state whether each is a command handler or a query handler
- state which isolation level was set for each
- state which database and transaction mechanism were used
