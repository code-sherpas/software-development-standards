import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// Why this test exists.
//
// A check belongs to the standard it backs: its script lives here, under
// checks/<standard>/, and checks/checks.tsv says when it runs. The plugins that
// run checks — code-sherpas/claude-code-plugins, for Claude Code — know only
// this repository: they read checks.tsv from `main`, download the scripts it
// names and run them. So nothing but this test keeps the two sides together.
// Every line must name a standard that exists, and a script inside that
// standard's own folder, on an event a runner handles. The standard must name
// its scripts, so a reader can get from the rule to its check. And no script
// may sit here unlisted, where no runner would ever run it.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKS = join(ROOT, "checks");
// The events claude-code-plugins' runner handles. A new one needs the runner
// first: what it does with a finding depends on the event.
const EVENTS = ["Stop", "SubagentStop"];
// What the runner accepts as a script path, and nothing else.
const SCRIPT_PATH = /^checks\/[a-z0-9-]+\/[a-z0-9-]+\.sh$/;

type Check = { line: number; event: string; standard: string; script: string };

function manifest(): Check[] {
  return readFileSync(join(CHECKS, "checks.tsv"), "utf8")
    .split("\n")
    .map((text, index) => ({ text, line: index + 1 }))
    .filter(({ text }) => text.trim() !== "" && !text.startsWith("#"))
    .map(({ text, line }) => {
      const fields = text.split("\t");
      assert.equal(fields.length, 3, `checks.tsv:${line} has three TAB-separated fields`);
      const [event, standard, script] = fields;
      return { line, event, standard, script };
    });
}

function scriptsOnDisk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return scriptsOnDisk(path);
    return entry.name.endsWith(".sh") ? [relative(ROOT, path)] : [];
  });
}

describe("the automated checks", () => {
  const checks = manifest();

  it("are listed in checks/checks.tsv", () => {
    assert.ok(checks.length > 0);
  });

  for (const { line, event, standard, script } of checks) {
    describe(`checks.tsv:${line} (${event} → ${script})`, () => {
      it("runs on an event the runner handles", () => {
        assert.ok(EVENTS.includes(event), `${event} is not one of ${EVENTS.join(", ")}`);
      });

      it("backs a standard that exists", () => {
        assert.match(standard, /^[a-z0-9-]+\.md$/);
        assert.ok(existsSync(join(ROOT, standard)), `${standard} does not exist`);
      });

      it("runs a script that exists, in the standard's own folder", () => {
        assert.match(script, SCRIPT_PATH);
        assert.equal(script.split("/")[1], standard.replace(/\.md$/, ""));
        assert.ok(existsSync(join(ROOT, script)), `${script} does not exist`);
      });

      it("is named by the standard it backs", () => {
        assert.ok(
          readFileSync(join(ROOT, standard), "utf8").includes(script),
          `${standard} does not mention ${script}`,
        );
      });
    });
  }

  it("leave no script unlisted, where no runner would run it", () => {
    const listed = new Set(checks.map(({ script }) => script));
    for (const script of scriptsOnDisk(CHECKS)) {
      assert.ok(listed.has(script), `${script} is not in checks/checks.tsv`);
    }
  });
});
