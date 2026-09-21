# Ensure Authorized Requester for Business Logic Entry Points

## Goal

Every business-logic entry point that requires authorization must include an `ensure requester is authorized` business constraint, placed after authentication and before any business operation runs.

This constraint follows the `ensure ...` formalism. Restate the rule as:

- `ensure requester is authorized`

Translate that formulation into the syntax, naming, and control-flow conventions of the language in use. The function name is always the same generic phrasing across entry points; the action-specific authorization policy lives inside the function body.

This constraint must be a module-private function, defined inside the same module as the business-logic entry point it protects. It is not exported, not reused across modules, and not accessible to other entry points.

On success the constraint returns a unit-equivalent value (no business data). On failure it returns an error indicating that the requester is not authorized to perform the action.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines a business-logic entry point that must only run for requesters with permission to perform its action
- checks roles, permissions, capabilities, ownership, tenancy, scopes, or policy decisions before executing business logic
- protects a business operation from execution by an authenticated but unauthorized requester
- extracts authorization verification logic into a helper, method, policy, or validator inside business logic

## Relationship to Other Standards

This standard is a specialization of the general [Ensure Business Constraints for Business Logic](business-logic-ensure-business-constraints.md) standard. All rules in that standard apply here. This standard adds specificity about what the constraint checks, where it must appear, what it is named, and where it must live:

- The constraint always expresses `ensure requester is authorized`, using that exact generic phrasing translated into the local naming style.
- The constraint must be a module-private function in the same module as the entry point.
- The constraint must be placed after `ensure requester is authenticated` and before any other business constraint, business operation, or data mutation.
- The constraint verifies authorization for the specific action of the entry point, not identity authentication, generic role membership, or unrelated business rules.
- The constraint returns a unit-equivalent value on success, in line with the general [Ensure Business Constraints for Business Logic](business-logic-ensure-business-constraints.md) standard.

This standard is the authorization counterpart of [Ensure Authenticated Requester for Business Logic Entry Points](business-logic-ensure-authenticated-requester.md). Authentication answers *"who is this requester?"*; authorization answers *"is this requester allowed to perform this entry point's action?"*. Keep the two checks separate.

## Ensure Rule

1. Name the constraint with the fixed generic phrasing.
   - Use the exact name `ensure requester is authorized`, translated into the local naming style: `ensureRequesterIsAuthorized`, `ensure_requester_is_authorized`, `EnsureRequesterIsAuthorized`, or the closest local equivalent.
   - Do not vary the function name per entry point. The name is generic; the body is action-specific.
   - Do not use action-specific names such as `ensureRequesterCanCreateReservation` or generic non-`ensure ...` names such as `checkPermissions`, `hasAccess`, or `isAuthorized`.

2. Define the constraint as module-private inside the entry point's module.
   - The function lives in the same file or module as the business-logic entry point it protects.
   - Use the language's idiomatic visibility for module-private functions: no `export`, leading underscore, `private`, package-private, file-internal, or the project's local convention.
   - Do not export this function from the module. Do not place it in a shared module for reuse across entry points.
   - Each entry point's module has its own `ensure requester is authorized` function, tailored to its own action. Two entry points never share the same function.

3. Place this constraint after authentication and before any business operation.
   - It runs after `ensure requester is authenticated` so the requester id is available.
   - It runs before any other business constraint that depends on authorization, before any data mutation, and before any business operation.

4. Encode the action-specific policy inside the function body.
   - The body checks whether the requester is allowed to perform this entry point's specific action.
   - Use the requester id, the input fields of the command or query, and any project-level policy primitives to evaluate the rule.
   - The body may delegate to a shared policy, rule engine, or domain service if the project provides one. The module-private function still wraps that delegation under the generic name.

5. The constraint returns a unit-equivalent value on success.
   - Use the unit-equivalent value of the language or project: `void`, `unit`, `undefined`, `None`, or the success side of a result wrapper.
   - Do not return booleans, roles, policies, permissions, or any other data from this constraint.

6. The constraint fails with an error when the requester is not authorized.
   - Use the project's error convention, such as an error value, thrown domain error, result error, or equivalent failure construct.
   - Make the error correspond to the specific violation: the requester is not authorized to perform that action.
   - Distinguish this error from the unauthenticated-requester error so callers and observability can tell the two apart.

7. Keep the constraint focused on authorization for this action only.
   - Do not mix authentication, eligibility, availability, or unrelated business rules into this constraint.
   - Use separate `ensure ...` constraints for those concerns.

## Input Convention

The authorization constraint needs at least the requester identity and any inputs required to evaluate the policy for the action (for example, a target resource id, tenant id, or owner id).

When the project follows [Execution Context for Business Logic Entry Points](business-logic-entry-point-execution-context.md), the constraint retrieves the requester identity from the execution context and accepts only the action-specific inputs as parameters. The command or query type does not need to carry the requester identity.

When the project does not follow that standard, the constraint receives the requester id as an explicit parameter, typically the requester id returned by `ensure requester is authenticated`. Pass the action-specific inputs explicitly as well. Do not reach outside the entry point's input or the prior authentication result to obtain authorization-relevant data.

## Determining Whether an Entry Point Requires Authorization

Most business-logic entry points that require authentication also require authorization. Some genuinely do not — for example, an entry point that any authenticated requester is allowed to invoke without further restriction.

Apply this standard when at least one of the following holds for the entry point:

- The action operates on resources owned by, or scoped to, a specific requester, tenant, or organization.
- The action requires a role, permission, capability, scope, or policy decision beyond being authenticated.
- The action is restricted by business rules that depend on the requester's identity or relationship to the resource.

If none of these hold and the entry point is genuinely open to any authenticated requester, document that decision explicitly in the entry point and skip this constraint. Do not treat the absence of an authorization check as a default; it must be a deliberate, justified choice.

## Detection Workflow

1. Find business-logic entry points first.
   - Identify command handlers, query handlers, and other business-logic entry points.
   - Determine which entry points must restrict execution to requesters with permission for the specific action.

2. Check for the presence of the authorization constraint.
   - Look for an `ensure requester is authorized` function or its local equivalent in the same module as the entry point.
   - Verify that it is module-private, not exported, and not shared across modules.
   - Verify that it is invoked after authentication and before any business operation.

3. Check the constraint shape.
   - Verify that the function uses the fixed generic name, not an action-specific or unrelated name.
   - Verify that success returns a unit-equivalent value.
   - Verify that failure produces an error indicating the requester is not authorized.

4. Check the constraint focus.
   - Verify that the body encodes the specific authorization policy for this entry point's action.
   - Verify that it does not also check authentication, availability, eligibility, or unrelated rules.

5. Prefer semantic classification to syntax alone.
   - Do not classify a check as the authorization constraint only because it appears after authentication.
   - Classify it by whether it verifies that the requester is allowed to perform the action.

## Writing or Changing the Authorization Constraint

1. Name the constraint with the fixed generic phrasing.
   - Translate `ensure requester is authorized` into the local naming convention.
   - Do not vary the name per entry point.

2. Define it as module-private in the entry point's module.
   - Place the function in the same file or module as the entry point it protects.
   - Use the language's idiomatic module-private visibility.
   - Do not export it. Do not move it to a shared utilities module.

3. Place the call after authentication and before any business operation.
   - After `ensure requester is authenticated`.
   - Before any other business constraint that depends on the requester being authorized, before data reads that should be policy-filtered, and before any data mutation.

4. Return a unit-equivalent value on success.
   - Do not return booleans, roles, policies, or any other data from this constraint.
   - Let the absence of error mean the requester is authorized.

5. Return or raise a meaningful error on failure.
   - Use an error type or value that explains that the requester is not authorized to perform the action.
   - Keep this error distinct from the unauthenticated-requester error.

6. Encode the action-specific policy in the body.
   - Express the policy in business terms: ownership, role, capability, scope, tenancy, relationship, or whichever rule the entry point requires.
   - Delegate to shared policy primitives, rule engines, or domain services where the project provides them, but keep the module-private wrapper as the single entry-point-side call site.

7. Do not share the function across entry points.
   - If two entry points need the same authorization rule, each module still defines its own `ensure requester is authorized` function and may delegate to a shared policy primitive.
   - The shared primitive is not the constraint; the module-private function is.

## Examples

TypeScript with execution context and neverthrow:

```ts
// create-reservation-command-handler.ts

function ensureRequesterIsAuthorized(
  command: CreateReservationCommand,
): ResultAsync<void, RequesterIsNotAuthorized> {
  const ctx = getExecutionContext();
  const requesterId = ctx.requesterId;

  // policy specific to creating a reservation, using requesterId and command fields

  if (!isAllowed) {
    return errAsync(new RequesterIsNotAuthorized());
  }

  return okAsync(undefined);
}

export function createReservationCommandHandler(
  command: CreateReservationCommand,
): ResultAsync<CreateReservationCommandHandlerSuccess, CreateReservationCommandHandlerError> {
  return ensureRequesterIsAuthenticated()
    .andThen((requesterId) =>
      ensureRequesterIsAuthorized(command).map(() => requesterId),
    )
    .andThen((requesterId) => {
      // other business constraints and business logic using requesterId
    });
}
```

TypeScript with neverthrow (explicit passing, for languages without execution context):

```ts
// cancel-order-command-handler.ts

function ensureRequesterIsAuthorized(
  requesterId: RequesterId,
  command: CancelOrderCommand,
): ResultAsync<void, RequesterIsNotAuthorized> {
  // policy specific to cancelling an order, using requesterId and command.orderId
}

export function cancelOrderCommandHandler(
  command: CancelOrderCommand,
): ResultAsync<CancelOrderCommandHandlerSuccess, CancelOrderCommandHandlerError> {
  return ensureRequesterIsAuthenticated(command.requesterId)
    .andThen((requesterId) =>
      ensureRequesterIsAuthorized(requesterId, command).map(() => requesterId),
    )
    .andThen((requesterId) => {
      // other business constraints and business logic using requesterId
    });
}
```

TypeScript with exceptions:

```ts
// cancel-order-command-handler.ts

async function ensureRequesterIsAuthorized(
  requesterId: RequesterId,
  command: CancelOrderCommand,
): Promise<void> {
  // policy specific to cancelling an order
  // throw RequesterIsNotAuthorized if not allowed
}

export async function cancelOrderCommandHandler(
  command: CancelOrderCommand,
): Promise<CancelOrderCommandHandlerSuccess> {
  const requesterId = await ensureRequesterIsAuthenticated(command.requesterId);
  await ensureRequesterIsAuthorized(requesterId, command);
  // other business constraints and business logic using requesterId
}
```

Python (leading underscore marks module-private):

```py
# cancel_order_command_handler.py

def _ensure_requester_is_authorized(
    requester_id: RequesterId,
    command: CancelOrderCommand,
) -> None:
    # policy specific to cancelling an order
    # raise RequesterIsNotAuthorized if not allowed
    ...

def cancel_order_command_handler(
    command: CancelOrderCommand,
) -> CancelOrderCommandHandlerSuccess:
    requester_id = ensure_requester_is_authenticated(command.requester_id)
    _ensure_requester_is_authorized(requester_id, command)
    # other business constraints and business logic using requester_id
```

Kotlin (file-internal visibility marks module-private):

```kt
// CancelOrderCommandHandler.kt

private fun ensureRequesterIsAuthorized(
    requesterId: RequesterId,
    command: CancelOrderCommand,
) {
    // policy specific to cancelling an order
    // throw RequesterIsNotAuthorized if not allowed
}

fun cancelOrderCommandHandler(
    command: CancelOrderCommand,
): CancelOrderCommandHandlerSuccess {
    val requesterId = ensureRequesterIsAuthenticated(command.requesterId)
    ensureRequesterIsAuthorized(requesterId, command)
    // other business constraints and business logic using requesterId
}
```

## Review Questions

When reading or reviewing code, ask:

- Does this entry point require an authorization check beyond authentication?
- Is there an `ensure requester is authorized` function or its local equivalent in the same module as the entry point?
- Is the function module-private and not exported or shared across modules?
- Does the function use the fixed generic name rather than an action-specific or unrelated name?
- Is it invoked after authentication and before any business operation or data mutation?
- Does the body encode the specific authorization policy for this entry point's action?
- Does it return a unit-equivalent value on success?
- Does it produce an error distinct from the unauthenticated-requester error when the requester is not allowed to perform the action?
- Does it avoid mixing in authentication, eligibility, availability, or unrelated business rules?
- If the entry point intentionally has no authorization check, is that decision explicit and justified?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which entry points were identified or changed
- state where the `ensure requester is authorized` constraint was added or verified
- state how the name was translated into the local language convention and how module-private visibility was applied
- state that the function lives in the same module as the entry point and is not shared across modules
- state that the constraint returns a unit-equivalent value on success and which failure error shape was used
- state that the constraint is placed after authentication and before any business operation at the entry point
- state any entry point that was intentionally left without an authorization check and the reason
