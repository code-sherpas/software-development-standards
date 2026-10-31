# UTC Zoned Temporal Types

## Goal

When the stack supports timezone-aware built-in or standard-library temporal types, use those types and set their timezone to UTC.

Treat this standard as normalization guidance for timezone-aware temporal values. The key question is whether the code can use a built-in temporal type that carries timezone semantics. If it can, represent the value in UTC instead of server-local time, user-local time, or an arbitrary geographic timezone.

**This standard governs instants, not civil times.** An instant is a point on the global timeline whose meaning does not depend on any region's clock rules: when a record was created, when a payment settled, when a lease expires, when a timer ends. Normalizing an instant to UTC loses nothing.

A **civil time** is a wall-clock time a person chose in a place — "Tuesday at 18:00 in Madrid" for a lesson, an appointment, a recurring meeting. What that person fixed is the reading on Madrid's clock, not an instant, and the instant it maps to changes whenever Madrid's rules change between the moment it is stored and the moment it happens. Storing it as a UTC instant keeps the instant and silently moves the meeting. Civil times are out of scope here: they are stored as a local date-time plus a geographic timezone, as [Built-In Temporal Types](built-in-temporal-types.md) describes.

The test: if the rules of the person's timezone changed before the value comes due, should it still read the same on their clock? If yes, it is a civil time. If it should still happen at the same absolute moment — or it already happened — it is an instant, and this standard applies.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines timezone-aware datetime or timestamp fields
- defines temporal parameters or return types that can carry timezone information
- parses or serializes timezone-aware temporal values
- maps timezone-aware values to persistence or transport boundaries
- converts between local time and a normalized stored or exchanged value
- configures default timezones for timezone-aware temporal types

## UTC Rule

1. Use timezone-aware built-in temporal types when the stack provides them.
   - Prefer the native or standard-library temporal type that can carry timezone semantics.
   - Do not fall back to naive local datetimes when a timezone-aware built-in type is available.

2. Use UTC as the timezone.
   - Use the canonical UTC representation provided by the language or standard library.
   - Prefer named UTC constructs such as `UTC`, `Z`, or the standard-library UTC zone object over ad hoc local timezone settings.

3. Normalize at boundaries.
   - Convert external or local values to UTC as they enter the system when the task requires a timezone-aware built-in type.
   - Serialize or persist the normalized UTC value unless the boundary contract explicitly requires another representation.

4. Keep UTC semantics explicit.
   - Make it obvious in types, constructors, helpers, and serialization code that the value is timezone-aware and normalized to UTC.
   - Do not rely on server defaults, process defaults, database session defaults, or ambient local timezone configuration.

## Detection Workflow

1. Determine whether the value can be timezone-aware.
   - Identify whether the field, parameter, or contract represents a datetime or timestamp that the stack can model with a timezone-aware built-in type.
   - Ignore date-only and time-only values that do not carry timezone semantics.
   - Ignore civil times — wall-clock times a person chose in a geographic timezone and that must keep their local reading if that timezone's rules change. They follow [Built-In Temporal Types](built-in-temporal-types.md).

2. Detect built-in timezone-aware support in the stack.
   - Identify the native or standard-library temporal types that support timezone-aware values.
   - Follow the project's established conventions for constructing, storing, and serializing those types.

3. Trace normalization points.
   - Identify where values enter the system from user input, APIs, databases, jobs, or integrations.
   - Identify where local or offset-based inputs must be converted into UTC.
   - Verify that later reads, writes, and comparisons keep the value in UTC.

## Writing or Changing Temporal Code

1. Prefer timezone-aware built-in types over naive ones.
   - Use the built-in timezone-aware temporal type when the stack supports it.
   - Avoid storing the same concept as a naive local datetime plus an implicit timezone assumption.

2. Set or construct values in UTC.
   - Use the standard UTC zone, UTC clock, or UTC constructor path provided by the stack.
   - Avoid local-now helpers or system-default timezone constructors when a UTC alternative exists.

3. Convert only at the edges when needed.
   - Convert from user-facing or boundary-specific representations into UTC near the boundary.
   - Keep the internal timezone-aware representation in UTC once normalized.

4. Keep serialization and persistence aligned.
   - Persist or emit timezone-aware values in a UTC-safe format.
   - Preserve the fact that the stored or exchanged value is UTC.

## Review Questions

When reading or reviewing code, ask:

- Is this value an instant, or a civil time a person chose in a place? Only an instant belongs here.
- Can this value be represented with a built-in timezone-aware temporal type?
- If so, is the code using that type instead of a naive local datetime?
- Is the timezone explicitly UTC?
- Is the code relying on server-local or process-default timezone behavior instead of UTC?
- Would changing this code risk losing UTC normalization for timezone-aware values?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which timezone-aware temporal values or types were identified or changed
- state which built-in or standard-library timezone-aware types were used
- state where UTC construction, normalization, serialization, or persistence was implemented or preserved
