# Automated Testing

## Goal

A test earns its place by **failing when the behaviour it describes breaks**, and not otherwise.

The test that never fails costs more than no test: it takes time to write, time to read, time to maintain, and it spends the credibility of the suite — because a suite that stays green through a real regression teaches everyone to stop trusting green.

## What Counts as In Scope

Any test being written, reviewed or repaired, at any level.

This standard is where the organization's testing rules live, and it grows as they are decided. Today it covers **what a test asserts and how its doubles are built**. It does not yet cover which tests to write, where each kind runs, or what a suite is expected to include — when those are decided, they belong here.

## Do Not Test the Double

A double stands in for a collaborator. Asserting on the double asserts on the arrangement, and the arrangement always agrees with itself.

The common shape, in component tests: a child is replaced by a double that **renders its props**, and the test then looks for that output in the DOM. What it verifies is that the double renders what it was given. It passes with the real child deleted.

Assert on **what the subject handed over** instead — that the collaborator was given this data, this shape, these values — and leave what the collaborator does with it to the collaborator's own tests.

**Avoid doubling what does not need it.** A simple child, a pure function, a value object: using the real thing is cheaper to write and fails for real reasons. Reach for a double when the collaborator is slow, non-deterministic, remote, or hard to drive into the state you need.

**Keep a double as simple as the test needs.** A double that simulates internal state, loading phases or timing is a second implementation, maintained forever, and wrong in ways nobody notices. For a callback, expose the smallest way to invoke it and nothing else.

## Cover the Failures, Not Only the Happy Path

For anything with more than one outcome, the paths that are **not** the happy one are where the defects live: the rejected input, the missing record, the unauthorised requester, the collaborator that failed. A test suite that only proves the good case documents an intention, not a behaviour.

**Coverage is a signal, not a goal.** A percentage says which lines ran, never whether anything was verified — and pursued as a target it produces exactly the tests this standard exists to prevent.

## Review Questions

- Would this test pass if the implementation it names were deleted?
- Does it assert what a caller can observe, or how the subject is built inside?
- Does it assert on a double instead of on what the subject produced?
- Is there a double where the real collaborator would have done?
- Does the double simulate behaviour nobody asked it to simulate?
- Does the test say which situation it is in, or does it restate how that situation is assembled?
- Are the failure paths covered, or only the happy one?

## Report the Outcome

When finishing the task, state:

- which behaviours the new tests pin down, and which failure paths among them;
- anything doubled, and why the real collaborator would not do;
- any test you changed rather than fixed the code, and why that was the right way round.
