import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { indexChanges, type Corpus } from "./corpus.ts";
import { grade, hookInstruction } from "./grading.ts";

// The test with the model costs some 900,000 tokens a run, so what decides
// whether it runs, what it sends and how it judges an answer is tested here,
// without the model.

describe("an answer of the model", () => {
  const expected = {
    expected: [
      { standard: "refunds", reason: "r", source: "unanimous" },
      { standard: "invoices", reason: "r", source: "unanimous" },
    ],
    near_miss: ["payments"],
  };

  it("misses a standard that most runs leave out, and blocks", () => {
    const result = grade(expected, [{ chosen: ["refunds"] }, { chosen: ["refunds"] }, { chosen: ["refunds", "invoices"] }]);
    assert.deepEqual(result, { missed: ["invoices"], unstable: [], errored: false, extra: [] });
  });

  it("reports a standard left out by one run as unstable, without blocking", () => {
    const result = grade(expected, [
      { chosen: ["refunds", "invoices"] },
      { chosen: ["refunds"] },
      { chosen: ["refunds", "invoices", "payments"] },
    ]);
    assert.deepEqual(result, { missed: [], unstable: ["invoices"], errored: false, extra: ["payments"] });
  });

  it("blocks a case with a run that gave no answer, so a failure never passes", () => {
    const result = grade(expected, [{ chosen: ["refunds", "invoices"] }, { chosen: ["refunds", "invoices"] }, { chosen: [], error: "refusal" }]);
    assert.equal(result.errored, true);
    assert.deepEqual(result.missed, []);
  });

  it("misses with a single run whatever that run leaves out", () => {
    assert.deepEqual(grade(expected, [{ chosen: ["refunds"] }]).missed, ["invoices"]);
  });
});

describe("the hook's instruction", () => {
  it("is what instruction() prints, with the index's path and the standards' base", () => {
    const script = [
      "instruction() {",
      `  printf '%s' "Read the index: $index. Each one it links is at $base/<file>."`,
      "}",
    ].join("\n");
    assert.equal(
      hookInstruction(script, "/cache/README.md", "https://example.test/main"),
      "Read the index: /cache/README.md. Each one it links is at https://example.test/main/<file>.",
    );
  });

  it("fails loudly when the hook no longer has it", () => {
    assert.throws(() => hookInstruction("echo nothing", "/x", "/y"), /instruction\(\) not found/);
  });
});

describe("whether a change needs the test with the model", () => {
  function corpusOf(standards: Record<string, string>): Corpus {
    return {
      standards: new Map(
        Object.entries(standards).map(([name, indexEntry]) => [name, { scope: "## What Counts as In Scope", indexEntry }]),
      ),
      cases: new Map(),
      expected: {},
    };
  }
  const before = corpusOf({ refunds: "- [Refunds](refunds.md) — Refunds." });

  it("is no when the index did not change, whatever else did", () => {
    assert.deepEqual(indexChanges(before, before), []);
  });

  it("is yes when an entry changed, a standard was added or one was removed", () => {
    assert.deepEqual(indexChanges(before, corpusOf({ refunds: "- [Refunds](refunds.md) — Refunds and credit notes." })), [
      "refunds's index entry changed",
    ]);
    assert.deepEqual(
      indexChanges(before, corpusOf({ ...{ refunds: "- [Refunds](refunds.md) — Refunds." }, invoices: "- [Invoices](invoices.md) — I." })),
      ["invoices is new"],
    );
    assert.deepEqual(indexChanges(before, corpusOf({})), ["refunds was removed"]);
  });
});
