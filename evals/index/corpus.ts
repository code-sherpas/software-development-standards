// The corpus of the standards index test, read from any tree: the working
// tree, or a git revision. Both the static test (corpus.test.ts) and the check
// on a change (scope-changes.ts) read it through here, so they agree on what a
// standard's scope, its index entry and its cases are.

export type Tree = {
  // The paths of the files directly inside a directory, relative to the root.
  list(directory: string): string[];
  // A file's content, or undefined when it does not exist in this tree.
  read(path: string): string | undefined;
};

export type ExpectedEntry = { standard: string; reason: string; source: string };
export type ExpectedCase = { expected: ExpectedEntry[]; near_miss: string[] };

export type Corpus = {
  // Every standard by name (its file name without `.md`), with the text of its
  // «What Counts as» section and its line in the README's index.
  standards: Map<string, { scope: string | undefined; indexEntry: string | undefined }>;
  // Every case by id, with its file's content.
  cases: Map<string, string>;
  // expected.json, or an empty object where the tree has none yet.
  expected: Record<string, ExpectedCase>;
};

export const CASES_DIR = "evals/index/cases";
export const EXPECTED = "evals/index/expected.json";
export const INDEX = "README.md";

// The section every standard declares its scope in: a level-2 heading that
// starts «What Counts as», up to the next level-2 heading.
export function scopeSection(markdown: string): string | undefined {
  const lines = markdown.split("\n");
  const start = lines.findIndex(function isScopeHeading(line) {
    return line.startsWith("## What Counts as");
  });
  if (start === -1) return undefined;
  const length = lines.slice(start + 1).findIndex(function isNextSection(line) {
    return line.startsWith("## ");
  });
  const end = length === -1 ? lines.length : start + 1 + length;
  return lines.slice(start, end).join("\n").trim();
}

// The index lines that link to a standard, by the standard's name.
export function indexEntries(readme: string): Map<string, string[]> {
  const entries = new Map<string, string[]>();
  for (const line of readme.split("\n")) {
    const link = /^- \[[^\]]+\]\(([a-z0-9-]+)\.md\)/.exec(line);
    if (!link) continue;
    entries.set(link[1], [...(entries.get(link[1]) ?? []), line]);
  }
  return entries;
}

export function standardNames(tree: Tree): string[] {
  return tree
    .list("")
    .filter(function isStandard(path) {
      return path.endsWith(".md") && !path.includes("/") && path !== INDEX;
    })
    .map(function nameOf(path) {
      return path.slice(0, -".md".length);
    })
    .sort();
}

export function readCorpus(tree: Tree): Corpus {
  const entries = indexEntries(tree.read(INDEX) ?? "");
  const standards = new Map(
    standardNames(tree).map(function describeStandard(name) {
      return [
        name,
        { scope: scopeSection(tree.read(`${name}.md`) ?? ""), indexEntry: entries.get(name)?.[0] },
      ] as const;
    }),
  );
  const cases = new Map(
    tree
      .list(CASES_DIR)
      .filter(function isCase(path) {
        return /\/C\d+\.md$/.test(path);
      })
      .map(function readCase(path) {
        return [path.slice(CASES_DIR.length + 1, -".md".length), tree.read(path) ?? ""] as const;
      }),
  );
  const expectedText = tree.read(EXPECTED);
  return { standards, cases, expected: expectedText ? JSON.parse(expectedText) : {} };
}

// The ids of the cases that name a standard, as expected or as a near miss.
export function casesOf(corpus: Corpus, standard: string): string[] {
  return Object.entries(corpus.expected)
    .filter(function namesStandard([, entry]) {
      return (
        entry.expected.some(function isStandard(item) {
          return item.standard === standard;
        }) || entry.near_miss.includes(standard)
      );
    })
    .map(function idOf([id]) {
      return id;
    })
    .sort();
}

// What a change from `before` to `after` owes the index test. When a standard
// is added or its scope changes, the same change must update its index entry
// and its cases; otherwise the test with the model would keep passing on the
// cases of the old scope, a false green.
export function scopeChangeFindings(before: Corpus, after: Corpus): string[] {
  const findings: string[] = [];
  for (const [name, now] of after.standards) {
    const then = before.standards.get(name);
    if (then && then.scope === now.scope) continue;
    const what = then ? "its scope («What Counts as») changed" : "it is new";
    if (then && then.indexEntry === now.indexEntry) {
      findings.push(`${name}: ${what}, but its entry in the README's index did not. Update the entry so it says when the standard applies now.`);
    }
    if (!casesChanged(before, after, name)) {
      findings.push(`${name}: ${what}, but none of its cases did. Add or update the cases in ${CASES_DIR}/ and ${EXPECTED} so they cover the new scope.`);
    }
  }
  return findings;
}

// A standard's cases changed when the set of cases that name it, a case
// file among them, or what expected.json says about it differs.
function casesChanged(before: Corpus, after: Corpus, standard: string): boolean {
  const thenIds = casesOf(before, standard);
  const nowIds = casesOf(after, standard);
  if (thenIds.join() !== nowIds.join()) return true;
  return nowIds.some(function caseChanged(id) {
    return (
      before.cases.get(id) !== after.cases.get(id) ||
      JSON.stringify(entryFor(before, id, standard)) !== JSON.stringify(entryFor(after, id, standard))
    );
  });
}

function entryFor(corpus: Corpus, id: string, standard: string): unknown {
  const entry = corpus.expected[id];
  return {
    expected: entry?.expected.find(function isStandard(item) {
      return item.standard === standard;
    }),
    nearMiss: entry?.near_miss.includes(standard),
  };
}
