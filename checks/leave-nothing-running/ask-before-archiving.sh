#!/usr/bin/env bash
# The check of «Leave Nothing Running» for archiving a Claude Desktop session:
# an agent does not archive the sessions it started while their task is still
# open without the person saying so. checks/checks.tsv runs it on
# `PreToolUse`; the contract every check keeps is in the README's «Automated
# checks». The rule lives in the standard, not here: the message below says
# only what was found and what to decide, and the runner puts the standard's
# name and link in front of it.
#
# Measured 2026-11-17: `mcp__ccd_session_mgmt__archive_session` archives, with
# the session it names, the idle sessions that one started that have no pull
# request of their own, whether their task is done or not, and archiving stops
# their process and cleans up their worktree. Idle is not done: one may be
# waiting for the person's answer. The interface lets the person choose which
# go; the tool, which an agent can call in auto mode without asking, does not.
#
# The hook input says which tool is about to run and nothing about the state
# of the sessions it would archive, so this check reports every call to
# `archive_session`, finished children or not. The runner turns the finding
# into a question to the person — on `PreToolUse`, a `permissionDecision` of
# `ask`, which, measured 2026-11-17, is asked in auto mode too. Any other tool
# gets nothing.
set -u

tool="$(jq -r '.tool_name // empty' 2>/dev/null)"
[ "$tool" = "mcp__ccd_session_mgmt__archive_session" ] || exit 0

printf '%s\n' "This call archives a Claude Desktop session, and with it the idle sessions that one started that have no pull request of their own, whether their task is done or not. The person is asked to confirm it. Before they answer, list those sessions (list_sessions with linked: true) and tell the person which have finished their task and which are still open, and what each open one is waiting for, so they can decide which may be archived."
exit 0
