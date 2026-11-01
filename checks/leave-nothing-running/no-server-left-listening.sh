#!/usr/bin/env bash
# The check of «Leave Nothing Running» for servers: an agent does not hand
# control back with a process it started still listening on a TCP port — a
# development server, a watcher with a live-reload port, a preview, a mock.
# checks/checks.tsv says when it runs, and the README's «Automated checks» says
# what every check keeps to. The rule lives in the standard: this script reports
# what it found and what to decide, and the runner puts the standard's name and
# link in front of it.
#
# A port left taken is paid by whoever comes next: another session in another
# worktree of the same repository starts the same server on the same port, and
# fails, or worse, talks to this session's server and its stale code.
#
# Ownership is by mechanism, as in no-browser-left-open.sh, next to this file:
# a listening process belongs to the session named by the nearest of its
# ancestors, itself included, that carries `CLAUDE_CODE_SESSION_ID`. Claude Code
# exports that variable to everything it launches. A process with no such
# ancestor is nobody's here and is never pointed at, and neither is another
# session's.
#
# What Claude Code runs for itself is not the agent's to stop: an MCP server
# and whatever it launches, a language server. They hang straight from the
# Claude Code process without a shell in between, whereas whatever the agent
# runs goes through the shell of its Bash tool, or is left with no parent at
# all after it detached. Playwright's browsers are not this check's: a
# visible one is no-browser-left-open.sh's, and a headless one may be an e2e
# run on purpose.
#
# For no-server-left-listening.test.ts, next to this file,
# `SERVER_GUARD_PROCESSES` replaces the process table — one `pid<TAB>ppid<TAB>
# session id or -<TAB>command line` per line — and `SERVER_GUARD_LISTENERS`
# replaces the listening sockets, one `pid<TAB>port` per line.
set -u

input="$(cat)"
session="$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
session="${session:-${CLAUDE_CODE_SESSION_ID:-}}"
[ -n "$session" ] || exit 0

if [ -n "${SERVER_GUARD_PROCESSES:-}" ]; then
  table="$SERVER_GUARD_PROCESSES"
  listeners="${SERVER_GUARD_LISTENERS:-}"
else
  table="$(ps -eo pid=,ppid=,args= | awk '{ pid = $1; ppid = $2; $1 = ""; $2 = ""; sub(/^  /, ""); print pid "\t" ppid "\t?\t" $0 }')"
  if command -v lsof > /dev/null 2>&1; then
    listeners="$(lsof -nP -iTCP -sTCP:LISTEN -Fpn 2>/dev/null | awk '
      /^p/ { pid = substr($0, 2) }
      /^n/ { port = $0; sub(/.*:/, "", port); print pid "\t" port }')"
  else
    listeners="$(ss -ltnpH 2>/dev/null | awk '{
      port = $4; sub(/.*:/, "", port)
      rest = $0
      while (match(rest, /pid=[0-9]+/)) {
        print substr(rest, RSTART + 4, RLENGTH - 4) "\t" port
        rest = substr(rest, RSTART + RLENGTH)
      }
    }')"
  fi
fi
listeners="$(printf '%s\n' "$listeners" | awk -F '\t' '$1 ~ /^[0-9]+$/ && $2 ~ /^[0-9]+$/' | sort -t "$(printf '\t')" -k1,1n -k2,2n -u)"
[ -n "$listeners" ] || exit 0

# The session a process was launched by, as its environment says; empty when
# it says none or cannot be read.
session_of() {
  local pid="$1" recorded
  recorded="$(printf '%s\n' "$table" | awk -F '\t' -v pid="$pid" '$1 == pid { print $3; exit }')"
  case "$recorded" in
    "?") ;;
    "-" | "") return ;;
    *) printf '%s' "$recorded"; return ;;
  esac
  if [ -r "/proc/$pid/environ" ]; then
    # Readable by mode is not readable: the kernel refuses the environment of
    # a process this user cannot trace, such as `systemd --user`.
    { tr '\0' '\n' < "/proc/$pid/environ"; } 2>/dev/null | sed -n 's/^CLAUDE_CODE_SESSION_ID=//p' | head -1
  else
    ps -E -ww -o command= -p "$pid" 2>/dev/null | tr ' ' '\n' | sed -n 's/^CLAUDE_CODE_SESSION_ID=//p' | head -1
  fi
}

parent_of() {
  printf '%s\n' "$table" | awk -F '\t' -v pid="$1" '$1 == pid { print $2; exit }'
}

command_of() {
  printf '%s\n' "$table" | awk -F '\t' -v pid="$1" '$1 == pid { print $4; exit }'
}

# The name of the program a command line runs, without its directory.
program_of() {
  command_of "$1" | awk '{ name = $1; sub(/.*\//, "", name); print name }'
}

# Whether this session's agent started <pid>, rather than another session, the
# person, or Claude Code for itself.
started_by_this_agent() {
  local pid="$1" owner="" top parent
  case "$(command_of "$pid")" in *ms-playwright*) return 1 ;; esac
  [ "$(program_of "$pid")" = "claude" ] && return 1
  for _ in $(seq 1 64); do
    [ -n "$pid" ] && [ "$pid" -gt 1 ] || return 1
    owner="$(session_of "$pid")"
    [ -n "$owner" ] && break
    pid="$(parent_of "$pid")"
  done
  [ "$owner" = "$session" ] || return 1
  # Up to the highest ancestor that still carries this session: what Claude Code
  # itself launched, or what was left without a parent.
  top="$pid"
  for _ in $(seq 1 64); do
    parent="$(parent_of "$top")"
    [ -n "$parent" ] && [ "$parent" -gt 1 ] || break
    [ "$(session_of "$parent")" = "$session" ] || break
    top="$parent"
  done
  parent="$(parent_of "$top")"
  if [ -n "$parent" ] && [ "$(program_of "$parent")" = "claude" ]; then
    case "$(program_of "$top")" in
      sh | bash | zsh | dash | fish | ksh) return 0 ;;
      *) return 1 ;;
    esac
  fi
  return 0
}

found=""
for pid in $(printf '%s\n' "$listeners" | cut -f1 | sort -n -u); do
  started_by_this_agent "$pid" || continue
  ports="$(printf '%s\n' "$listeners" | awk -F '\t' -v pid="$pid" '$1 == pid { print $2 }' | paste -sd ',' - | sed 's/,/, /g')"
  what="$(command_of "$pid" | cut -c1-80)"
  [ -n "$what" ] || what="$(ps -o args= -p "$pid" 2>/dev/null | cut -c1-80)"
  found="${found:+$found; }PID $pid on port $ports (${what})"
done
[ -n "$found" ] || exit 0

printf '%s\n' "Something this session started is still listening on a port: ${found}. Decide before ending the turn. If nothing needs it, stop it with its whole tree, since a supervisor or a watcher starts again what you kill, and check that the port is free. If you keep it, say in your reply which one, on which port, and why."
