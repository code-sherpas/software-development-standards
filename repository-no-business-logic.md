# Repository No Business Logic

## Goal

Repositories must contain no business logic. A repository is a persistence gateway — it persists and retrieves domain entities exactly as instructed by its caller.

A repository's responsibility is limited to:

- translating between domain types and persistence representations
- executing persistence operations — create, update, find, delete
- mapping query parameters to persistence queries

A repository must not:

- validate business rules or enforce domain invariants
- make domain decisions based on the data it reads or writes
- transform domain state — that is the entity's or domain service's responsibility
- filter or exclude results based on business criteria not expressed by the caller
- trigger side effects that represent business behavior

Business logic belongs in domain entities, aggregate roots, domain services, or business-logic entry points. The repository is infrastructure — it does what it is told.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- implements a repository method — create, update, find, delete, or equivalent
- adds conditional logic inside a repository that depends on business rules
- adds validation, invariant checks, or domain decisions inside a repository
- adds data transformation that represents a business operation inside a repository
- filters query results inside a repository based on business criteria not specified by the caller

## The Rule

1. A repository persists and retrieves exactly what it is asked to.
   - A create or update operation persists the entity as provided — it does not modify, validate, or reject it based on business rules.
   - A find operation returns the data matching the caller's criteria — it does not filter, transform, or enrich the result based on business rules.
   - A delete operation removes what the caller specifies — it does not check whether deletion is allowed by business rules.

2. No business rule validation in repositories.
   - Do not check domain invariants before saving — that is the entity's responsibility.
   - Do not validate business constraints before deleting — that is the entry point's responsibility.
   - Do not reject operations based on domain state — that decision belongs to the domain layer.

3. No domain state transformation in repositories.
   - Do not modify entity fields, recalculate values, or apply defaults that represent business logic.
   - The only transformation a repository performs is the technical mapping between domain types and persistence representations — this is infrastructure, not business logic.

4. No business-driven filtering in repositories.
   - Repository query methods accept explicit criteria from the caller — IDs, field values, pagination parameters.
   - Do not add implicit filters based on business rules that the caller did not request — for example, silently excluding soft-deleted records or filtering by status unless the caller explicitly asks for it.

5. No domain side effects in repositories.
   - Do not emit domain events, send notifications, update audit logs with business meaning, or trigger any behavior that represents a business concern.
   - Infrastructure-level concerns such as database-level audit columns managed by the persistence technology are acceptable — they are not business logic.

## Detection Workflow

1. Read the repository implementation.
   - Examine each method — create, update, find, delete, and any custom query methods.

2. Look for conditional logic that depends on business rules.
   - If-statements, guards, or branches that check domain state and alter behavior are a signal.
   - Ask: would this condition exist in a repository for a completely different domain entity? If not, it is likely business logic.

3. Look for data transformation beyond persistence mapping.
   - If the repository modifies entity state before saving or after reading — beyond converting between domain and persistence types — it may contain business logic.

4. Look for implicit filtering.
   - If a find method excludes results that the caller did not ask to exclude, the filter may represent a business rule.

5. Look for side effects.
   - If saving or deleting triggers additional behavior beyond the persistence operation, check whether that behavior is a business concern.

## Delegation to Execution Context

When the project follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), the repository implementation retrieves the transaction from the execution context instead of receiving it as a parameter. The repository method signature does not include the transaction. When the transaction from the execution context is `undefined` or `null`, the repository must create a new standalone transaction for that operation. All other rules in this standard still apply: the repository must contain no business logic.

## Examples

Correct — repository does only persistence (with execution context):

```ts
class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(order: Order): ResultAsync<Order, RepositoryError> {
    const client = getExecutionContext()?.transaction ?? this.prisma;
    // maps Order to persistence representation and creates — nothing else
    return ResultAsync.fromPromise(
      client.order.create({
        data: toPersistence(order),
      }),
      (error) => new RepositoryError(error),
    ).map(() => order)
  }

  findById(orderId: OrderId): ResultAsync<Order | null, RepositoryError> {
    const client = getExecutionContext()?.transaction ?? this.prisma;
    // queries and maps back to domain type — nothing else
    return ResultAsync.fromPromise(
      client.order.findUnique({ where: { id: orderId } }),
      (error) => new RepositoryError(error),
    ).map((record) => record ? toDomain(record) : null)
  }
}
```

Not this — business logic inside the repository:

```ts
class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(order: Order): ResultAsync<Order, RepositoryError> {
    const client = getExecutionContext()?.transaction ?? this.prisma;
    // Bad: validating a business rule before saving
    if (order.items.length === 0) {
      return errAsync(new RepositoryError('Order must have at least one item'))
    }
    // Bad: transforming domain state
    const orderWithTotal = { ...order, total: calculateTotal(order.items) }
    return ResultAsync.fromPromise(
      client.order.create({
        data: toPersistence(orderWithTotal),
      }),
      (error) => new RepositoryError(error),
    ).map(() => orderWithTotal)
  }

  findManyByCustomerId(customerId: CustomerId): ResultAsync<Order[], RepositoryError> {
    const client = getExecutionContext()?.transaction ?? this.prisma;
    // Bad: implicit business filter — "not cancelled" is a domain concept
    // the caller did not ask for. The repo must return every order for
    // the customer; the entry point decides which statuses to include.
    return ResultAsync.fromPromise(
      client.order.findMany({
        where: { customerId, status: { not: 'cancelled' } },
      }),
      (error) => new RepositoryError(error),
    ).map((records) => records.map(toDomain))
  }
}
```

Correct — repository does only persistence (explicit passing, for languages without execution context):

```ts
class PrismaOrderRepository implements OrderRepository {
  create(transaction: Transaction, order: Order): ResultAsync<Order, RepositoryError> {
    // maps Order to persistence representation and inserts — nothing else
    return ResultAsync.fromPromise(
      transaction.order.create({
        data: toPersistence(order),
      }),
      (error) => new RepositoryError(error),
    ).map(() => order)
  }

  findById(transaction: Transaction, orderId: OrderId): ResultAsync<Order | null, RepositoryError> {
    // queries and maps back to domain type — nothing else
    return ResultAsync.fromPromise(
      transaction.order.findUnique({ where: { id: orderId } }),
      (error) => new RepositoryError(error),
    ).map((record) => record ? toDomain(record) : null)
  }
}
```

Not this — business logic inside the repository:

```ts
class PrismaOrderRepository implements OrderRepository {
  create(transaction: Transaction, order: Order): ResultAsync<Order, RepositoryError> {
    // Bad: validating a business rule before saving
    if (order.items.length === 0) {
      return errAsync(new RepositoryError('Order must have at least one item'))
    }
    // Bad: transforming domain state
    const orderWithTotal = { ...order, total: calculateTotal(order.items) }
    return ResultAsync.fromPromise(
      transaction.order.create({
        data: toPersistence(orderWithTotal),
      }),
      (error) => new RepositoryError(error),
    ).map(() => orderWithTotal)
  }

  findManyByCustomerId(transaction: Transaction, customerId: CustomerId): ResultAsync<Order[], RepositoryError> {
    // Bad: implicit business filter — "not cancelled" is a domain concept
    // the caller did not ask for. The repo must return every order for
    // the customer; the entry point decides which statuses to include.
    return ResultAsync.fromPromise(
      transaction.order.findMany({
        where: { customerId, status: { not: 'cancelled' } },
      }),
      (error) => new RepositoryError(error),
    ).map((records) => records.map(toDomain))
  }
}
```

## Review Questions

When reading or reviewing code, ask:

- Does this repository method validate any business rule or domain invariant?
- Does this repository method transform domain state beyond persistence mapping?
- Does this repository method filter results based on business criteria not specified by the caller?
- Does this repository method trigger side effects that represent business behavior?
- If this logic were removed from the repository, would the repository still fulfill its persistence responsibility?

If any business logic is found inside a repository, extract it to the appropriate domain layer — entity, domain service, or entry point.

## Report the Outcome

When finishing the task:

- state which repository methods were reviewed or changed
- state whether any business logic was found inside the repository
- state where the extracted business logic was moved — entity, domain service, or entry point
- state that the repository now contains only persistence operations and type mapping
