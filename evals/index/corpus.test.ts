import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CASES_DIR,
  indexEntries,
  readCorpus,
  scopeChangeFindings,
  scopeSection,
  type Corpus,
  type ExpectedCase,
} from "./corpus.ts";
import { workingTree } from "./scope-changes.ts";

// Why this test exists.
//
// The standards index test asks an agent that read only the index to choose
// the standards a case needs, and fails when it misses one the reference
// labels expect. That test is only as good as its corpus: a standard with no
// case is never tested, a case that names a standard that no longer exists
// tests nothing, and a standard whose scope grew keeps passing on the cases
// of its old scope. This test keeps the corpus whole on every change; the
// check of what a change owes the corpus, scope-changes.ts, runs in the merge
// queue against the queue's base, and its rule is tested here too.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const KINDS = ["description", "description+code"];
const ROLES = [
  "refine",
  "to-increments",
  "ship-increments",
  "fix-error",
  "build-prototype",
  "increment-builder",
  "increment-reviewer",
  "increment-verifier",
  "none",
];
// Every standard is expected in at least this many cases, in different shapes.
const MINIMUM_CASES = 2;

function frontMatter(text: string): Record<string, string> | undefined {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!block) return undefined;
  return Object.fromEntries(
    block[1].split("\n").map(function field(line) {
      const separator = line.indexOf(":");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).replace(/#.*/, "").trim()];
    }),
  );
}

describe("the corpus of the standards index test", () => {
  const corpus = readCorpus(workingTree(ROOT));
  const names = [...corpus.standards.keys()];

  it("has cases and a standard to test them against", () => {
    assert.ok(corpus.cases.size > 0, `no case in ${CASES_DIR}/`);
    assert.ok(names.length > 0);
  });

  describe("every case", () => {
    for (const [id, text] of corpus.cases) {
      it(`${id} says what it is and whose brief it runs under`, () => {
        const fields = frontMatter(text);
        assert.ok(fields, `${id}.md starts with a front matter`);
        assert.equal(fields.id, id, `${id}.md declares its own id`);
        assert.ok(KINDS.includes(fields.kind), `${id}.md has a kind among ${KINDS.join(", ")}`);
        assert.ok(ROLES.includes(fields.role), `${id}.md has a role among ${ROLES.join(", ")}`);
        assert.ok(text.slice(text.indexOf("\n---\n") + 5).trim().length > 0, `${id}.md has a body`);
      });
    }

    it("has its expected standards, and nothing else does", () => {
      assert.deepEqual(Object.keys(corpus.expected).sort(), [...corpus.cases.keys()].sort());
    });
  });

  describe("every label", () => {
    for (const [id, entry] of Object.entries(corpus.expected)) {
      it(`of ${id} names a standard that exists, once, with its reason and source`, () => {
        const expected = entry.expected.map(function nameOf(item) {
          return item.standard;
        });
        for (const name of [...expected, ...entry.near_miss]) {
          assert.ok(corpus.standards.has(name), `${id} names ${name}, which is not a standard`);
        }
        assert.equal(new Set(expected).size, expected.length, `${id} expects a standard twice`);
        for (const near of entry.near_miss) {
          assert.ok(!expected.includes(near), `${id} has ${near} both expected and as a near miss`);
        }
        for (const item of entry.expected) {
          assert.ok(item.reason.trim().length > 0, `${id} expects ${item.standard} without a reason`);
          assert.match(item.source, /^(unanimous|decision \d+)$/, `${id}: source of ${item.standard}`);
        }
      });
    }
  });

  describe("every standard", () => {
    for (const name of names) {
      const standard = corpus.standards.get(name)!;
      it(`${name} declares its scope, has one index entry and is expected in ${MINIMUM_CASES} cases`, () => {
        assert.ok(standard.scope, `${name}.md has a section whose heading starts «## What Counts as»`);
        assert.ok(standard.indexEntry, `README.md's index links ${name}.md`);
        const expectedIn = Object.entries(corpus.expected).filter(function expects([, entry]) {
          return entry.expected.some(function isStandard(item) {
            return item.standard === name;
          });
        });
        assert.ok(
          expectedIn.length >= MINIMUM_CASES,
          `${name} is expected in ${expectedIn.length} case(s); it needs ${MINIMUM_CASES}`,
        );
      });
    }

    it("is linked once from the index, and the index links nothing else", () => {
      const readme = workingTree(ROOT).read("README.md")!;
      const entries = indexEntries(readme);
      for (const [name, lines] of entries) {
        assert.ok(corpus.standards.has(name), `README.md's index links ${name}.md, which does not exist`);
        assert.equal(lines.length, 1, `README.md's index links ${name}.md ${lines.length} times`);
      }
      const count = /^## Index \((\d+) standards\)$/m.exec(readme);
      assert.ok(count, "README.md has «## Index (<n> standards)»");
      assert.equal(Number(count[1]), names.length, "the index heading counts every standard");
    });
  });
});

describe("what a change owes the corpus", () => {
  function corpusOf(
    standards: Record<string, { scope: string; indexEntry: string }>,
    expected: Record<string, ExpectedCase>,
    cases: Record<string, string> = {},
  ): Corpus {
    return {
      standards: new Map(Object.entries(standards)),
      cases: new Map(Object.entries({ C01: "case one", C02: "case two", ...cases })),
      expected,
    };
  }
  const labelled = (standard: string, reason = "why"): ExpectedCase => ({
    expected: [{ standard, reason, source: "unanimous" }],
    near_miss: [],
  });
  const before = corpusOf(
    { refunds: { scope: "## What Counts as In Scope\n\nRefunds.", indexEntry: "- [Refunds](refunds.md) — Refunds." } },
    { C01: labelled("refunds"), C02: labelled("refunds") },
  );

  it("is nothing when no scope changed", () => {
    assert.deepEqual(scopeChangeFindings(before, before), []);
  });

  it("is the index entry and the cases when a scope changed alone", () => {
    const after = corpusOf(
      { refunds: { scope: "## What Counts as In Scope\n\nRefunds and credit notes.", indexEntry: "- [Refunds](refunds.md) — Refunds." } },
      before.expected,
    );
    const findings = scopeChangeFindings(before, after);
    assert.equal(findings.length, 2);
    assert.match(findings[0], /^refunds: its scope .* index did not/);
    assert.match(findings[1], /^refunds: its scope .* none of its cases did/);
  });

  it("is nothing when a scope changed with its index entry and a case of it", () => {
    const after = corpusOf(
      { refunds: { scope: "## What Counts as In Scope\n\nRefunds and credit notes.", indexEntry: "- [Refunds](refunds.md) — Refunds and credit notes." } },
      before.expected,
      { C02: "case two, now about a credit note" },
    );
    assert.deepEqual(scopeChangeFindings(before, after), []);
  });

  it("counts a new case, or a label's new reason, as the cases changing", () => {
    const standards = { refunds: { scope: "## What Counts as In Scope\n\nRefunds and credit notes.", indexEntry: "- [Refunds](refunds.md) — Refunds and credit notes." } };
    const withNewCase = corpusOf(standards, { ...before.expected, C03: labelled("refunds") }, { C03: "case three" });
    const withNewReason = corpusOf(standards, { C01: labelled("refunds"), C02: labelled("refunds", "a credit note is a refund") });
    assert.deepEqual(scopeChangeFindings(before, withNewCase), []);
    assert.deepEqual(scopeChangeFindings(before, withNewReason), []);
  });

  it("does not count a change to a case that does not name the standard", () => {
    const after = corpusOf(
      {
        refunds: { scope: "## What Counts as In Scope\n\nRefunds and credit notes.", indexEntry: "- [Refunds](refunds.md) — Refunds and credit notes." },
        invoices: { scope: "## What Counts as In Scope\n\nInvoices.", indexEntry: "- [Invoices](invoices.md) — Invoices." },
      },
      { ...before.expected, C03: labelled("invoices") },
      { C03: "case three" },
    );
    const findings = scopeChangeFindings(before, after);
    assert.equal(findings.length, 1);
    assert.match(findings[0], /^refunds: its scope .* none of its cases did/);
  });

  it("asks a new standard for cases, and leaves its index entry to the corpus test", () => {
    const after = corpusOf(
      { ...Object.fromEntries(before.standards), invoices: { scope: "## What Counts as In Scope\n\nInvoices.", indexEntry: "- [Invoices](invoices.md) — Invoices." } },
      before.expected,
    );
    assert.deepEqual(scopeChangeFindings(before, after), [
      `invoices: it is new, but none of its cases did. Add or update the cases in ${CASES_DIR}/ and evals/index/expected.json so they cover the new scope.`,
    ]);
  });
});

describe("a standard's scope", () => {
  it("is its «What Counts as» section, up to the next section", () => {
    const markdown = "# Refunds\n\n## Goal\n\nG.\n\n## What Counts as In Scope\n\nRefunds.\n\n## The Rule\n\nR.\n";
    assert.equal(scopeSection(markdown), "## What Counts as In Scope\n\nRefunds.");
  });

  it("is missing when no section starts «What Counts as»", () => {
    assert.equal(scopeSection("# Refunds\n\n## Scope\n\nRefunds.\n"), undefined);
  });
});
