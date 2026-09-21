# Repository Operations for Business Logic Entry Points

## Goal

Repository interfaces must expose a standard set of operations with clear naming, explicit intent, predictable return types, and a strict error model.

Each operation must make its purpose unambiguous. A caller reading the repository interface must know immediately whether it is creating a new entity, updating an existing one, retrieving zero-or-one by identity or unique key, retrieving zero-or-many by criteria, performing a dynamic listing, counting matches, asking whether something exists, or deleting by identity.

The operation set is organized in two families:

- **Entity fetch family** (`findBy*`, `findManyBy*`, `search`) — returns domain entities.
- **Aggregation family** (`countBy*`, `existsBy*`, `existManyBy*`) — returns scalars (number, boolean) computed over the same predicates.

Two cross-cutting rules apply to every operation:

- **Domain outcomes are valid return values, never errors.** Not found, empty list, zero count, false existence — all are valid results. Errors are reserved for infrastructure failures.
- **`save` is forbidden.** Always distinguish between `create` and `update` explicitly so the caller's intent is never ambiguous.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines a repository interface or repository class
- defines repository method signatures for domain-entity persistence operations
- introduces a `save` method that handles both creation and update
- introduces a method that throws or returns a domain error when an entity is not found
- introduces a `findBy*` method whose return type is a collection
- introduces an `existsBy*` / `existManyBy*` method whose implementation does not delegate to the corresponding `countBy*`
- introduces a `countBy*` whose predicate visibly diverges from the corresponding `findManyBy*`
- exposes a domain-shaped error type (`*NotFoundError`, `*AlreadyTakenError`, etc.) in a repository signature
- defines find, search, count, exists, create, update, or delete operations on a repository

## The Operations

### 1. `findBy<Field>` (single-row)

Retrieves zero or one domain entity by a single field or by a conjunction of fields.

- **Naming**: `findBy<Field>` for one field; `findBy<Field1>And<Field2>` for two fields conjoined; and so on. `findById` is the most common case (`Field = Id`). Do not use `findBy<Field1>Or<Field2>` for single-row queries — `OR` over fields breaks the uniqueness contract and must be expressed as a multi-row query instead.
- **Parameter**: the value(s) for the field(s).
- **Returns**: the domain entity, or an absence value idiomatic to the stack — `T | null`, `T | undefined`, `Optional<T>`, `Maybe<T>`, `T?`. **Never throws or produces a domain error when the entity does not exist; absence is a valid return value.**

### 2. `findManyBy<Field>` (multi-row)

Retrieves zero or more domain entities by one or more fields, optionally combining them with AND, OR, or both.

- **Naming**: `findManyBy<Field>` for one field; `findManyBy<Field1>And<Field2>`, `findManyBy<Field1>Or<Field2>`, and combinations of AND and OR for multiple fields.
- **Parameter**: the value(s) for the field(s).
- **Returns**: a collection of domain entities — array, list, sequence, idiomatic to the stack. **An empty collection when nothing matches is a valid return value, not an error.**
- A multi-row method must never be named `findBy*`. The `Many` segment is part of the contract and signals expected cardinality at every call site.

### 3. `search`

Retrieves a collection of domain entities matching a dynamic combination of filter clauses, with pagination and sorting.

- **Name**: `search` or the project's idiomatic equivalent.
- **Parameters**: a list of filter clauses, pagination parameters (page number and page size), and a list of sort clauses.
- **Returns**: a paginated result containing the collection of domain entities and the total count of matching entities.
- **Use `search` only when the filter or sort fields are not known a priori** — for example, dynamic UI listings, admin tables. When the filter fields are fixed and known at definition time, use `findManyBy<Field>` with named parameters instead.
- One `search` method per repository. Express filter criteria as filter clauses that reference an attribute, a comparison operator, and a value. This avoids creating a separate method for each filter combination.
- When no entities match, return a paginated result with an empty collection and a total count of zero, **never an error**.

The search operation combines filtering, pagination, and sorting in a single method:

- **Filtering**: a list of filter clauses, each referencing an attribute of the domain entity, a comparison operator (e.g., `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`), and a value.
- **Pagination**: a page number and a page size. The return type must include both the collection of domain entities and the total count of matching entities so the caller can compute the total number of pages.
- **Sorting**: a list of sort clauses, each specifying an attribute name and a direction (ascending or descending).

### 4. `countBy<Field>` (numeric aggregation)

Returns the number of domain entities matching one or more fields combined with AND, OR, or both.

- **Naming**: `countBy<Field>` for one field; `countBy<Field1>And<Field2>`, `countBy<Field1>Or<Field2>`, and combinations of AND and OR for multiple fields. There is no `countManyBy*` form: `count` is intrinsically about cardinality, so the single-vs-multi distinction does not apply. AND/OR combinators are allowed for any field count.
- **Parameter**: the value(s) for the field(s).
- **Returns**: a non-negative integer idiomatic to the stack (`number`, `int`, `Int`).
- **Contract**: `countBy<Field>(args)` must return the same number that `findManyBy<Field>(args).length` would return for the same arguments — same predicate, same semantics. Where a `findBy<Field>` exists for a unique field, `countBy<Field>` must return `0` or `1` according to whether the entity is present.
- **Implementation**: free, and **encouraged to use the engine's native aggregation** (`COUNT(*)` in SQL, `prisma.model.count`, `countDocuments` in MongoDB, etc.). Forced delegation to `findManyBy*` is not required because the cost would be O(n) — loading every matching row in memory just to count it defeats the purpose of having a separate aggregation operation.
- **Verification when not delegating**: tests must verify that `countBy<Field>(args)` equals `findManyBy<Field>(args).length` (or `findBy<Field>(args) !== null ? 1 : 0` for unique fields) on a representative set of inputs. The contract is enforced by tests, not by implementation form.
- **An empty result is `0`, never an error.**
- **Forbidden**: a `countBy<Field>` whose predicate visibly diverges from the corresponding `findManyBy<Field>` (for example, a hidden status filter). That is no longer a "count derived from find" — it is a different operation and must be renamed accordingly, or the dynamic filter must be moved to `search`.

### 5. `existsBy<Field>` (single-row exists) / `existManyBy<Field>` (multi-row exists)

Returns whether at least one domain entity exists matching a criterion.

- **Naming**: `existsBy<Field>` (verb in third-person singular: "does it exist") for the single-row form; `existManyBy<Field>` (verb in plural, **without the trailing `s`**: "do they exist") for the multi-row form. The presence/absence of the `s` is semantic, not stylistic.
- **Combinator rules**: same as `findBy*` / `findManyBy*` — single-row admits only AND between fields; multi-row admits AND, OR, and combinations.
- **Parameter**: identical to the corresponding `countBy*` method.
- **Returns**: a boolean idiomatic to the stack (`boolean`, `bool`).
- **Implementation requirement**: every `existsBy*` / `existManyBy*` method **must delegate** to the corresponding `countBy*` of the same repository:
  - `existsBy<Field>(args)` returns `countBy<Field>(args) > 0`.
  - `existManyBy<Field>(args)` returns `countBy<Field>(args) > 0`.
  - Running an independent query is forbidden. The reason: the boolean contract is bound to the count contract — same filters, same domain semantics. Delegating prevents the two from diverging over time, and `count` already encapsulates the engine-native aggregation, so there is no performance reason to bypass it.
- **A negative result is never an error.** `false` is a valid return value.

### 6. `create`

Persists a new domain entity and returns the created entity.

- **Name**: `create` or the project's idiomatic equivalent.
- **Parameter**: the domain entity to persist.
- **Returns**: the created domain entity. The returned entity must reflect the state after persistence, including any identity or field assigned during creation.

### 7. `update`

Persists changes to an existing domain entity and returns the updated entity.

- **Name**: `update` or the project's idiomatic equivalent.
- **Parameter**: the domain entity with updated state.
- **Returns**: the updated domain entity. The returned entity must reflect the state after persistence.

### 8. `deleteById`

Removes a domain entity by its identity.

- **Name**: `deleteById` or the project's idiomatic equivalent (e.g., `delete_by_id`).
- **Parameter**: the entity's identity value.
- **Returns**: nothing (void, unit, `None`, or the project's empty equivalent).
- **Idempotent**: deleting a non-existent id is a valid outcome, not an error.

## Forbidden Operations

The following operations or implementations must not appear on a repository. Each has a single canonical replacement.

- **`save`** — ambiguous. Replace with explicit `create` and `update`.
- **`getBy*` / `getById` that throws when the entity does not exist** — pushes absence handling onto exceptions. Replace with `findBy*` returning an absence-permitting type. The caller decides whether absence is an error in its use case.
- **`findBy<Field>` whose return type is a collection** — multi-row query with single-row naming. Rename to `findManyBy<Field>`.
- **`existsBy*` / `existManyBy*` that does not delegate to the corresponding `countBy*`** — must call `countBy<Field>` and return `> 0`.
- **`countBy<Field>` whose predicate diverges from the corresponding `findManyBy<Field>`** — that is a different operation; rename it explicitly or move the dynamic filter to `search`.
- **`existsWith*`, `hasBy*`, `countMany*`, and other non-canonical names** — rename to follow the `existsBy*` / `existManyBy*` / `countBy*` conventions, including the singular/plural `s` rule for `exists` / `exist`.

## Error Model

Repository operations are allowed to produce errors **only** for infrastructure failures. Any other outcome is a valid return value.

**Infrastructure failures (allowed):**

- The database is unreachable, the connection is lost, or the operation times out.
- The persistence engine reports an integrity violation: foreign-key broken, unique-constraint duplicated, NOT NULL constraint violated, deadlock detected.
- Serialization or deserialization fails when mapping between domain types and persistence representations.
- Transport-level failures: driver error, connection pool exhausted, transaction aborted by the engine.
- Any uncaught exception originating in the underlying infrastructure layer.

**Domain outcomes (never errors):**

- `findBy*` does not find a row → returns an absence value.
- `findManyBy*` / `search` does not find any rows → returns an empty collection / a page with total 0.
- `countBy*` finds nothing → returns `0`.
- `existsBy*` / `existManyBy*` finds nothing → returns `false`.
- `deleteById` is called with an id that does not exist → succeeds (idempotent).

The error type a repository signature exposes (`RepositoryError` or equivalent) must describe **only** infrastructure categories. Domain-shaped error names — `UserNotFoundError`, `OrderInvalidError`, `EmailAlreadyTakenError`, `OrderCannotBeCancelledError` — **must not appear in repository signatures**. They belong in the entry point or business-logic layer, which translates the repository's return value into a domain error when the use case requires it.

## Detection Workflow

1. Find repository interfaces and classes used by business-logic entry points.

2. Check for `save`, `persist`, `upsert`, or any method that conflates creation and update — flag for split into `create` / `update`.

3. Check single-row queries.
   - Verify `findBy*` returns an absence-permitting type and never throws on not-found.
   - Verify single-row queries combine fields with AND only.

4. Check multi-row queries.
   - Verify multi-row queries are named `findManyBy*`, never `findBy*` with a collection return type.
   - Verify they return an empty collection (not an error, not null) when nothing matches.

5. Check `search`.
   - Verify it accepts filter clauses, pagination, and sort clauses.
   - Verify it returns a paginated result with collection and total count.
   - Verify it returns an empty result (not an error) when nothing matches.

6. Check `countBy*`.
   - Verify it returns a non-negative integer.
   - Verify the predicate matches the corresponding `findManyBy*` (same fields, same combinators).
   - When the implementation does not delegate to `findManyBy*`, verify a test exists that asserts `countBy*(args)` equals `findManyBy*(args).length` for representative inputs.
   - Flag `countBy*` whose predicate diverges silently from `findManyBy*`.

7. Check existence operations.
   - Verify they are named `existsBy*` (singular form) or `existManyBy*` (plural form, no trailing `s` on the verb).
   - Verify the implementation delegates to the corresponding `countBy*` and returns `> 0`. Flag any independent query.
   - Flag any `existsWith*`, `hasBy*`, or other non-canonical names.

8. Check write operations.
   - Verify `create` accepts a domain entity and returns the created one.
   - Verify `update` accepts a domain entity and returns the updated one.
   - Verify `deleteById` accepts an identity, returns nothing, and is idempotent.

9. Check the error type.
   - Verify the repository's error type lists only infrastructure categories.
   - Flag any domain-shaped error name in a repository signature (`*NotFoundError`, `*AlreadyTakenError`, `*InvalidError`, etc.).

## Writing or Changing Repository Interfaces

1. Define the operations the entry point needs.
   - Start from the business-logic entry point's requirements.
   - Add only the operations that are needed. Not every repository needs every operation.

2. Name each operation by the canonical pattern.
   - `findBy<Field>` for single-row, `findManyBy<Field>` for multi-row.
   - `search` for dynamic listings.
   - `countBy<Field>` for numeric aggregation (AND/OR allowed, no `countManyBy*` form).
   - `existsBy<Field>` / `existManyBy<Field>` for booleans (with the singular/plural `s` rule), implemented as `countBy<Field> > 0`.
   - `create`, `update`, `deleteById` for writes.

3. Choose return types that respect the error model.
   - Single-row find: absence-permitting type (`T | null`, `Optional<T>`, etc.).
   - Multi-row find / search: collection / paginated result (empty when nothing matches).
   - Count: non-negative integer.
   - Existence: boolean.
   - Errors only for infrastructure — never for domain outcomes.

4. Follow the project's naming convention.
   - Adapt to the project's casing style: `findById`, `find_by_id`, `FindById`.
   - Adapt to the project's collection types, error handling, and result conventions.

5. Add operations incrementally.
   - Add a repository operation only when a business-logic entry point needs it.
   - Do not pre-populate repositories with operations that no entry point uses yet.

## Delegation to Execution Context

When the project follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), repository methods do not receive the transaction as a parameter. The repository implementation retrieves the transaction from the execution context internally. When the transaction from the execution context is `undefined` or `null`, the repository must create a new standalone transaction for that operation. All other rules in this standard still apply: the same operations, naming conventions, return types, error model, and the no-save rule.

## Examples

TypeScript with execution context:

```ts
type SortDirection = 'asc' | 'desc'

type SortClause<T> = {
  attribute: keyof T
  direction: SortDirection
}

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'

type FilterClause<T> = {
  attribute: keyof T
  operator: FilterOperator
  value: unknown
}

type PaginatedResult<T> = {
  items: T[]
  totalCount: number
}

interface OrderRepository {
  findById(orderId: OrderId): ResultAsync<Order | null, RepositoryError>
  findManyByCustomerId(customerId: CustomerId): ResultAsync<Order[], RepositoryError>
  search(
    filters: FilterClause<Order>[],
    pageNumber: number,
    pageSize: number,
    sortBy: SortClause<Order>[],
  ): ResultAsync<PaginatedResult<Order>, RepositoryError>
  countById(orderId: OrderId): ResultAsync<number, RepositoryError>
  countByCustomerId(customerId: CustomerId): ResultAsync<number, RepositoryError>
  existsById(orderId: OrderId): ResultAsync<boolean, RepositoryError>
  existManyByCustomerId(customerId: CustomerId): ResultAsync<boolean, RepositoryError>
  create(order: Order): ResultAsync<Order, RepositoryError>
  update(order: Order): ResultAsync<Order, RepositoryError>
  deleteById(orderId: OrderId): ResultAsync<void, RepositoryError>
}
```

A correct implementation uses the engine's native count aggregation and derives existence from count:

```ts
class PrismaOrderRepository implements OrderRepository {
  // ... findById, findManyByCustomerId, etc.

  countById(orderId: OrderId): ResultAsync<number, RepositoryError> {
    // Native aggregation — no entities materialized.
    return ResultAsync.fromPromise(
      this.prisma.order.count({ where: { id: orderId } }),
      (error) => new RepositoryError(error),
    )
  }

  countByCustomerId(customerId: CustomerId): ResultAsync<number, RepositoryError> {
    return ResultAsync.fromPromise(
      this.prisma.order.count({ where: { customerId } }),
      (error) => new RepositoryError(error),
    )
  }

  existsById(orderId: OrderId): ResultAsync<boolean, RepositoryError> {
    return this.countById(orderId).map((n) => n > 0)
  }

  existManyByCustomerId(customerId: CustomerId): ResultAsync<boolean, RepositoryError> {
    return this.countByCustomerId(customerId).map((n) => n > 0)
  }
}
```

Not this:

```ts
interface OrderRepository {
  // Bad: throws on not-found instead of returning an absence value
  findById(orderId: OrderId): ResultAsync<Order, OrderNotFoundError>
  // Bad: multi-row with single-row naming
  findByCustomerId(customerId: CustomerId): ResultAsync<Order[], RepositoryError>
  // Bad: ambiguous `save`
  save(order: Order): ResultAsync<Order, RepositoryError>
  // Bad: domain-shaped error in a repository signature
  update(order: Order): ResultAsync<Order, OrderInvalidError>
}

class BadOrderRepository implements OrderRepository {
  // Bad: existsBy* runs its own query instead of delegating to countBy*
  existsById(orderId: OrderId): ResultAsync<boolean, RepositoryError> {
    return ResultAsync.fromPromise(
      this.prisma.order.findUnique({ where: { id: orderId } }),
      (error) => new RepositoryError(error),
    ).map((r) => r !== null)
  }

  // Bad: countBy* with a hidden domain filter ("active") that does not match findManyByCustomerId
  countByCustomerId(customerId: CustomerId): ResultAsync<number, RepositoryError> {
    return ResultAsync.fromPromise(
      this.prisma.order.count({
        where: { customerId, status: { not: 'cancelled' } },
      }),
      (error) => new RepositoryError(error),
    )
  }
}
```

TypeScript (explicit passing, for languages without execution context):

```ts
interface OrderRepository {
  findById(transaction: Transaction, orderId: OrderId): ResultAsync<Order | null, RepositoryError>
  findManyByCustomerId(transaction: Transaction, customerId: CustomerId): ResultAsync<Order[], RepositoryError>
  search(
    transaction: Transaction,
    filters: FilterClause<Order>[],
    pageNumber: number,
    pageSize: number,
    sortBy: SortClause<Order>[],
  ): ResultAsync<PaginatedResult<Order>, RepositoryError>
  countById(transaction: Transaction, orderId: OrderId): ResultAsync<number, RepositoryError>
  countByCustomerId(transaction: Transaction, customerId: CustomerId): ResultAsync<number, RepositoryError>
  existsById(transaction: Transaction, orderId: OrderId): ResultAsync<boolean, RepositoryError>
  existManyByCustomerId(transaction: Transaction, customerId: CustomerId): ResultAsync<boolean, RepositoryError>
  create(transaction: Transaction, order: Order): ResultAsync<Order, RepositoryError>
  update(transaction: Transaction, order: Order): ResultAsync<Order, RepositoryError>
  deleteById(transaction: Transaction, orderId: OrderId): ResultAsync<void, RepositoryError>
}
```

Not this:

```ts
interface OrderRepository {
  save(transaction: Transaction, order: Order): ResultAsync<Order, RepositoryError>
}
```

Python:

```py
@dataclass(frozen=True)
class SortClause(Generic[T]):
    attribute: str
    direction: Literal["asc", "desc"]

@dataclass(frozen=True)
class FilterClause(Generic[T]):
    attribute: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "contains"]
    value: object

@dataclass(frozen=True)
class PaginatedResult(Generic[T]):
    items: list[T]
    total_count: int

class OrderRepository(Protocol):
    def find_by_id(self, tx: Transaction, order_id: OrderId) -> Order | None: ...
    def find_many_by_customer_id(self, tx: Transaction, customer_id: CustomerId) -> list[Order]: ...
    def search(
        self,
        tx: Transaction,
        filters: list[FilterClause[Order]],
        page_number: int,
        page_size: int,
        sort_by: list[SortClause[Order]],
    ) -> PaginatedResult[Order]: ...
    def count_by_id(self, tx: Transaction, order_id: OrderId) -> int: ...
    def count_by_customer_id(self, tx: Transaction, customer_id: CustomerId) -> int: ...
    def exists_by_id(self, tx: Transaction, order_id: OrderId) -> bool: ...
    def exist_many_by_customer_id(self, tx: Transaction, customer_id: CustomerId) -> bool: ...
    def create(self, tx: Transaction, order: Order) -> Order: ...
    def update(self, tx: Transaction, order: Order) -> Order: ...
    def delete_by_id(self, tx: Transaction, order_id: OrderId) -> None: ...
```

Not this:

```py
class OrderRepository(Protocol):
    def save(self, tx: Transaction, order: Order) -> Order: ...
```

Kotlin:

```kt
enum class SortDirection { ASC, DESC }

data class SortClause<T>(
    val attribute: String,
    val direction: SortDirection,
)

enum class FilterOperator { EQ, NEQ, GT, GTE, LT, LTE, CONTAINS }

data class FilterClause<T>(
    val attribute: String,
    val operator: FilterOperator,
    val value: Any,
)

data class PaginatedResult<T>(
    val items: List<T>,
    val totalCount: Int,
)

interface OrderRepository {
    fun findById(tx: Transaction, orderId: OrderId): Order?
    fun findManyByCustomerId(tx: Transaction, customerId: CustomerId): List<Order>
    fun search(
        tx: Transaction,
        filters: List<FilterClause<Order>>,
        pageNumber: Int,
        pageSize: Int,
        sortBy: List<SortClause<Order>>,
    ): PaginatedResult<Order>
    fun countById(tx: Transaction, orderId: OrderId): Int
    fun countByCustomerId(tx: Transaction, customerId: CustomerId): Int
    fun existsById(tx: Transaction, orderId: OrderId): Boolean
    fun existManyByCustomerId(tx: Transaction, customerId: CustomerId): Boolean
    fun create(tx: Transaction, order: Order): Order
    fun update(tx: Transaction, order: Order): Order
    fun deleteById(tx: Transaction, orderId: OrderId)
}
```

Not this:

```kt
interface OrderRepository {
    fun save(tx: Transaction, order: Order): Order
}
```

## Review Questions

When reading or reviewing code, ask:

- Does this repository define a `save` method? If so, replace it with explicit `create` and `update`.
- Does each `findBy*` operation return an absence-permitting type (`T | null`, `Optional<T>`, etc.) instead of throwing on not-found?
- Does each multi-row query use `findManyBy<Field>` naming (never `findBy<Field>` with a collection return)?
- Does each `countBy<Field>` use the engine's native aggregation, and does its predicate match the corresponding `findManyBy<Field>` (same fields, same combinators)?
- When `countBy*` does not delegate to `findManyBy*`, is there a test asserting that `countBy*(args)` equals `findManyBy*(args).length` on representative inputs?
- Is the `existsBy*` / `existManyBy*` naming applied with the singular/plural `s` rule (`exists` vs `exist`)?
- Does each `existsBy*` / `existManyBy*` implementation delegate to the corresponding `countBy*` of the same repository (returning `countBy* > 0`), instead of running its own query or delegating to `findBy*` / `findManyBy*`?
- Does `create` return the created domain entity, and does `update` return the updated one?
- Does `deleteById` return nothing and treat a missing id as a valid outcome?
- Does `search` accept filter clauses, pagination, and sort clauses, and return a paginated result with both the collection and the total count?
- Do the repository's error types describe only infrastructure concerns (connectivity, integrity, serialization, transport, timeouts) and never domain concerns (not-found, invalid, taken, etc.)?

If any repository operation violates these conventions, apply this standard.

## Report the Outcome

When finishing the task:

- state which repository interfaces were identified or changed
- state which operations were added, renamed, or corrected
- state whether any `save` method was split into `create` and `update`
- state which return types were corrected to match the absence/empty/zero/boolean conventions
- state whether any `countBy*` was added, and whether its predicate aligns with the corresponding `findManyBy*`
- state whether any `existsBy*` / `existManyBy*` implementations were rewritten to delegate to `countBy*`
- state whether any domain-shaped error types were removed from repository signatures
