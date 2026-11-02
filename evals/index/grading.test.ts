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

  it("misses a standard when any one of its runs leaves it out", () => {
    const result = grade(expected, [
      { chosen: ["refunds", "invoices"] },
      { chosen: ["refunds"] },
      { chosen: ["refunds", "invoices", "payments"] },
    ]);
    assert.deepEqual(result, { missed: ["invoices"], extra: ["payments"] });
  });

  it("misses every standard in a run that failed, so a failure never passes", () => {
    const result = grade(expected, [{ chosen: ["refunds", "invoices"] }, { chosen: [], error: "refusal" }]);
    assert.deepEqual(result.missed, ["refunds", "invoices"]);
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
