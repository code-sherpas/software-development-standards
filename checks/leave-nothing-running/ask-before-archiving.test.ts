import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// Why this test exists.
//
// This is the automated check of «Leave Nothing Running» for archiving a
// Claude Desktop session: on 2026-11-17 `archive_session` was measured to
// archive, with the session it names, the idle sessions that one started,
// whether their task was done or not. The check must speak up before every
// call to that tool and stay silent before any other — a check that misses
// the call lets an open task be archived unseen, and one that speaks for
// other tools has the person asked about everything. It reads the hook's own
// `tool_name`, so a tool whose arguments merely mention the archive tool is
// not mistaken for it. Turning the finding into a question to the person is
// the runner's job, tested where the runner lives.

const CHECK = join(dirname(fileURLToPath(import.meta.url)), "ask-before-archiving.sh");
const ARCHIVE = "mcp__ccd_session_mgmt__archive_session";

function runCheck(input: string): { status: number | null; output: string; errors: string } {
  const result = spawnSync("bash", [CHECK], { input, encoding: "utf8" });
  return { status: result.status, output: result.stdout, errors: result.stderr };
}

function preToolUse(toolName: string, toolInput: object = {}): string {
  return JSON.stringify({
    session_id: "821b8d62-63eb-4657-a5fc-9b5ecec50eb8",
    hook_event_name: "PreToolUse",
    tool_name: toolName,
    tool_input: toolInput,
  });
}

describe("ask-before-archiving check", () => {
  it("reports a call that archives a session", () => {
    const { status, output } = runCheck(preToolUse(ARCHIVE, { session_id: "local_abc" }));

    assert.equal(status, 0);
    // What was found, not the rule: the runner puts the standard's name and
    // link in front of it.
    assert.match(output, /^This call archives a Claude Desktop session, and with it the idle sessions that one started/);
    // What the agent has to do before the person answers.
    assert.match(output, /list_sessions with linked: true/);
    assert.match(output, /which have finished their task and which are still open/);
  });

  for (const [description, input] of [
    ["another tool runs", preToolUse("Bash", { command: "ls" })],
    ["another session tool runs", preToolUse("mcp__ccd_session_mgmt__list_sessions", { linked: true })],
    [
      "another tool's arguments only mention the archive tool",
      preToolUse("Bash", { command: `echo '{"tool_name":"${ARCHIVE}"}'` }),
    ],
    ["the input has no tool", JSON.stringify({ session_id: "x", hook_event_name: "Stop" })],
    ["the input is not JSON", "not json"],
    ["there is no input", ""],
  ] as const) {
    it(`reports nothing, and does not fail, when ${description}`, () => {
      const { status, output, errors } = runCheck(input);

      assert.equal(status, 0, errors);
      assert.equal(output, "");
    });
  }
});
