import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// Why this test exists.
//
// This is the automated check of «Leave Nothing Running» for servers: a
// process the agent started, still listening on a port when it hands control
// back, takes that port from the next session in another worktree. What it
// must tell apart is narrow. It looks for a server THIS session's agent started,
// through its shell or left detached. That is not another session's server, not
// the person's own, and not what Claude Code runs for itself, such as an MCP
// server. A mistake either way is silent: it never fires, or it points an agent at
// something it must not stop. The process table is injected through
// SERVER_GUARD_PROCESSES, one `pid<TAB>ppid<TAB>session<TAB>command line` per
// line, where the session is the `CLAUDE_CODE_SESSION_ID` in that process's
// environment or `-` for none. The listening sockets are injected through
// SERVER_GUARD_LISTENERS, one `pid<TAB>port` per line. A check reports what it
// finds as plain text on stdout, and nothing otherwise.

const CHECK = join(dirname(fileURLToPath(import.meta.url)), "no-server-left-listening.sh");

const THIS_SESSION = "821b8d62-63eb-4657-a5fc-9b5ecec50eb8";
const ANOTHER_SESSION = "6f7d933c-7253-48f3-87b9-777b429d1987";

/**
 * Two Claude Code sessions, as on a real machine. Claude Code does not carry
 * the session in its own environment: it exports it to what it launches. Its
 * Bash tool runs commands through a shell, and each session runs an MCP server.
 */
const SESSIONS = [
  row(1, 0, "-", "/sbin/init"),
  row(10, 1, "-", "/usr/bin/zsh -l"),
  row(100, 10, "-", "claude --resume abc"),
  row(101, 100, THIS_SESSION, "/usr/bin/zsh -c source /home/someone/.claude/shell-snapshots/snapshot-zsh.sh && eval 'pnpm dev'"),
  row(110, 100, THIS_SESSION, "node /home/someone/.npm/_npx/mcp-server/index.js --port 8931"),
  row(200, 10, "-", "/opt/claude/versions/2.1.312/claude"),
  row(201, 200, ANOTHER_SESSION, "/bin/bash -c eval 'pnpm dev'"),
];

function row(pid: number, ppid: number, session: string, args: string): string {
  return `${pid}\t${ppid}\t${session}\t${args}`;
}

function listening(pid: number, port: number): string {
  return `${pid}\t${port}`;
}

function runCheck(
  processes: string[],
  listeners: string[],
  input: object = { session_id: THIS_SESSION, hook_event_name: "Stop" },
): { status: number | null; output: string } {
  const result = spawnSync("bash", [CHECK], {
    input: JSON.stringify(input),
    env: {
      ...process.env,
      SERVER_GUARD_PROCESSES: [...SESSIONS, ...processes].join("\n"),
      SERVER_GUARD_LISTENERS: listeners.join("\n"),
    },
    encoding: "utf8",
  });
  assert.equal(result.stderr, "");
  return { status: result.status, output: result.stdout };
}

describe("no-server-left-listening check", () => {
  it("reports a server this session's agent started that is still listening", () => {
    const { status, output } = runCheck(
      [row(102, 101, THIS_SESSION, "node /repo/node_modules/.bin/next dev")],
      [listening(102, 3000)],
    );

    assert.equal(status, 0);
    // What was found, not the rule: the runner puts the standard's name and
    // link in front of it.
    assert.match(output, /^Something this session started is still listening on a port: PID 102 on port 3000 \(node \/repo\/node_modules\/\.bin\/next dev\)\./);
    // A decision, not an order: a server still needed stays up, said in the reply.
    assert.match(output, /If nothing needs it, stop it with its whole tree/);
    assert.match(output, /If you keep it, say in your reply which one, on which port, and why/);
  });

  for (const [description, processes, listeners] of [
    [
      "after it detached from the agent's shell and was left with no parent",
      [row(150, 1, THIS_SESSION, "node server.js")],
      [listening(150, 4000)],
    ],
    [
      "by a child of the agent's command that does not carry the session",
      [row(102, 101, THIS_SESSION, "pnpm dev"), row(103, 102, "-", "vite --port 5173")],
      [listening(103, 5173)],
    ],
    [
      "by a watcher a supervisor started for the agent",
      [row(102, 101, THIS_SESSION, "nodemon server.js"), row(103, 102, THIS_SESSION, "node server.js")],
      [listening(103, 8080)],
    ],
    [
      "by a session whose Claude Code runs from its versions directory",
      [],
      [listening(201, 3000)],
    ],
  ] as const) {
    it(`reports a server started ${description}`, () => {
      const input =
        description.startsWith("by a session whose")
          ? { session_id: ANOTHER_SESSION, hook_event_name: "Stop" }
          : undefined;
      const { output } = runCheck([...processes], [...listeners], input);

      assert.match(output, /^Something this session started is still listening on a port/);
    });
  }

  for (const [description, processes, listeners] of [
    ["nothing listens", [], []],
    ["it belongs to another session", [row(202, 201, ANOTHER_SESSION, "node dev")], [listening(202, 3001)]],
    [
      "another session's server runs inside this one's process tree",
      [row(102, 101, ANOTHER_SESSION, "node other.js")],
      [listening(102, 3002)],
    ],
    ["no ancestor says which session started it", [row(300, 1, "-", "postgres -D /var/lib/postgres")], [listening(300, 5432)]],
    ["it is an MCP server Claude Code runs for this session", [], [listening(110, 8931)]],
    [
      "it is something an MCP server of this session launched",
      [row(111, 110, THIS_SESSION, "node mcp-worker.js")],
      [listening(111, 9000)],
    ],
    [
      "it is Playwright's browser",
      [row(112, 101, "-", "/home/someone/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome --remote-debugging-port=9222")],
      [listening(112, 9222)],
    ],
    ["it is Claude Code itself", [], [listening(100, 45123)]],
  ] as const) {
    it(`reports nothing when ${description}`, () => {
      const { status, output } = runCheck([...processes], [...listeners]);

      assert.equal(status, 0);
      assert.equal(output, "");
    });
  }

  it("names every server this session left listening, each with all its ports, and none of the others", () => {
    const { output } = runCheck(
      [
        row(105, 101, THIS_SESSION, "node api.js"),
        row(104, 101, THIS_SESSION, "vite"),
        row(202, 201, ANOTHER_SESSION, "node dev"),
      ],
      [listening(105, 4000), listening(104, 24678), listening(104, 5173), listening(202, 3000), listening(104, 5173)],
    );

    assert.match(output, /PID 104 on port 5173, 24678 \(vite\); PID 105 on port 4000 \(node api\.js\)\. Decide/);
  });

  it("reads this machine's real process table and sockets without failing, on Linux and on macOS", () => {
    // Nothing injected: `ps`, `lsof` or `ss`, and `/proc` or `ps -E`, run for
    // real. A session that cannot exist owns no server, so it reports nothing.
    const result = spawnSync("bash", [CHECK], {
      input: JSON.stringify({ session_id: "no-such-session", hook_event_name: "Stop" }),
      env: { ...process.env, SERVER_GUARD_PROCESSES: "", SERVER_GUARD_LISTENERS: "" },
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
  });
});
