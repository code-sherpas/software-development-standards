# Built-In Temporal Types

## Goal

Represent temporal values with built-in or standard-library temporal types that match their real meaning.

Use `date`-like types for calendar dates, `time`-like types for wall-clock times, and `datetime`-like types for date-and-time values. Do not represent temporal values as generic strings, numbers, or loose objects when the language or standard library already provides an appropriate temporal type.

When timezone semantics matter, use a representation that preserves a geographic timezone, such as an IANA timezone like `America/Mexico_City` or `Europe/Berlin`. A fixed offset such as `-06:00` or `+01:00` is not a geographic timezone and is not enough to model daylight saving time transitions.

## What Counts as In Scope

Apply this standard to code that does one or more of these things:

- defines date, time, datetime, timestamp, schedule, deadline, or recurrence fields
- defines temporal parameters or return types
- parses or serializes temporal values
- maps temporal values to persistence or transport boundaries
- calculates or compares temporal values
- stores or exposes timezone information
- models business or integration concepts that depend on calendar or clock semantics

## Temporal Type Rule

1. Use the most precise built-in temporal type the stack provides for the actual meaning of the value.
   - Use a date-only type for calendar dates without a clock time.
   - Use a time-only type for wall-clock times without a date.
   - Use a datetime type for values that include both date and time.
   - Do not collapse these meanings into one generic text type when built-in temporal types exist.

2. Preserve geographic timezone semantics when timezone matters.
   - Use a built-in or standard-library representation that can carry a geographic timezone when the stack provides one.
   - Prefer timezone identifiers with real timezone rules, such as IANA zone IDs.
   - Do not treat a numeric UTC offset as an equivalent replacement for a geographic timezone.

3. If the stack separates the date-time from the timezone identifier, keep both explicitly — and decide first which date-time it is.
   - For an **instant** that must also remember where it happened, use the built-in timezone-aware type for the instant, normalized to UTC per [UTC Zoned Temporal Types](utc-zoned-temporal-types.md), and store the geographic timezone as an explicit identifier next to it.
   - For a **civil time** — a wall-clock time a person chose in a place — store the local date-time without an offset, using the stack's local date-time type, and the geographic timezone as an explicit identifier next to it. See "Civil Times Chosen by a Person" below.
   - Store the timezone as an IANA zone identifier when that is how the stack preserves timezone rules.

4. Keep offsets as boundary details, not as the source of timezone truth.
   - Offsets may appear in serialized formats or protocol payloads when required by the boundary.
   - Do not use the offset alone as the durable representation of a timezone-aware business value.

## Civil Times Chosen by a Person

Some date-times are not instants. When a person schedules a lesson for "Tuesday at 18:00 in Madrid", what they fixed is the reading on Madrid's clock. The instant it corresponds to depends on Madrid's timezone rules, and those rules change — countries adopt, drop or move daylight saving time, sometimes with weeks of notice. A value stored as an instant keeps the instant and silently moves the meeting to 17:00 or 19:00 local time. Nobody chose that.

So a civil time is stored as what the person chose, and the instant is derived from it:

1. **Store the local date-time and the geographic timezone, and no instant as the source of truth.** Use the stack's local (offset-free) date-time type for the first and an IANA zone identifier for the second — `2026-11-03T18:00` and `Europe/Madrid`. Derive the instant when it is needed, with the timezone rules in force at that moment. A derived instant may be cached for querying and sorting, as long as it is recomputed when the rules change and is never treated as the original.
2. **Accept only a canonical IANA zone identifier.** A runtime that resolves a string to a timezone usually accepts much more than IANA zones: fixed offsets such as `+01:00`, legacy abbreviations such as `EST`, aliases such as `US/Eastern`, or different casing. Reject a fixed offset — it is not a geographic timezone — and store the canonical identifier the runtime resolves to, so that two equal timezones compare equal.
3. **Resolve the local times a daylight saving transition makes invalid when the value is written, not when it is read.** A local time that does not exist (skipped by a spring-forward transition) is rejected or explicitly adjusted at input. A local time that occurs twice (repeated by a fall-back transition) is disambiguated by an explicit, documented policy. Reading a stored civil time must not fail: if a rules change later makes a stored local time invalid, the reader resolves it by the same policy and the record stays readable — one unreadable value must not take down every list it appears in.
4. **Keep instants and civil times apart.** Compare, sort and filter on the derived instant; display in the timezone the product decides — the civil time's own timezone, or the viewer's — and say which.

Examples of civil times: scheduled lessons, appointments, recurring meetings, opening hours, the time a reminder fires "every day at 9:00". Examples of instants: `createdAt`, `paidAt`, a lease or token expiry, the end of a timer that is already running.

The test: if the rules of the person's timezone changed before the value comes due, should it still read the same on their clock? If yes, it is a civil time. If it should still happen at the same absolute moment — or it already happened — it is an instant.

## Detection Workflow

1. Determine the real temporal meaning first.
   - Identify whether the value is a calendar date, a wall-clock time, a datetime, an instant, a schedule, or a timezone-aware business timestamp.
   - Check whether the value must survive timezone conversions or daylight saving time transitions correctly.

2. Detect built-in temporal support in the stack.
   - Identify the native or standard-library temporal types available in the language.
   - Follow the project's established conventions for importing, constructing, storing, and serializing those types.

3. Trace timezone semantics end to end.
   - Identify where timezone information enters the system.
   - Identify whether the code preserves a geographic timezone ID or only an offset.
   - Verify that timezone-aware values keep the information needed to reproduce the correct local time across daylight saving time changes.

## Writing or Changing Temporal Code

1. Match the type to the meaning.
   - Choose the built-in temporal type that matches the actual semantics of the field or parameter.
   - Avoid using a datetime where only a date or time is intended.

2. Keep timezone-aware values explicitly geographic.
   - Use a zoned datetime built-in when the stack supports it.
   - If the stack does not provide a single built-in zoned type, keep the built-in temporal value together with a geographic timezone identifier.

3. Keep parsing and serialization explicit.
   - Parse external strings into built-in temporal types as early as practical.
   - Serialize back to boundary formats only at the boundary.
   - Preserve the geographic timezone identifier whenever the value is meant to remain timezone-aware.

4. Protect daylight saving time correctness.
   - Verify that recurring local times, deadlines, schedules, and user-facing times still resolve correctly when daylight saving time rules change the offset.
   - Do not assume the current offset is enough to reconstruct future or past local times in a geographic region.

## Review Questions

When reading or reviewing code, ask:

- What real temporal concept does this value represent: date, time, datetime, instant, or timezone-aware local time?
- Is the code using a built-in or standard-library temporal type that matches that meaning?
- If timezone matters, is a geographic timezone preserved?
- Is the code relying on an offset where a real timezone identifier is required?
- Is this date-time an instant, or a civil time a person chose in a place? If it is a civil time, is it stored as a local date-time plus an IANA zone, with the instant derived rather than stored as the truth?
- Does the code accept only canonical IANA zone identifiers, rejecting fixed offsets and storing the canonical form?
- Are skipped and repeated local times resolved when the value is written, and can every stored civil time still be read if the rules change?
- Would changing this code risk losing daylight saving time correctness or collapsing a temporal type into a generic string?

If the answer is yes, apply this standard.

## Report the Outcome

When finishing the task:

- state which temporal values or types were identified or changed
- state which built-in or standard-library temporal types were used, and why
- state how geographic timezone handling was implemented or preserved
- state which date-times were classified as instants and which as civil times, and why
