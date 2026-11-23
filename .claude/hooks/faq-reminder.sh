#!/usr/bin/env bash
#
# Remind the model to write what it has learned into the FAQ, at the two moments
# it is most likely to lose it.
#
# WHY A HOOK AND NOT A CLAUDE.md LINE
# A CLAUDE.md instruction is read once, at the top of the session, and then
# competes with everything that follows. The two moments that actually matter
# arrive late:
#
#   1. Just before compaction. Whatever was learned and not written down is
#      about to be summarised away. This is the single highest-value reminder
#      in the whole session, and nothing in the prompt fires at that point --
#      only the PreCompact hook does.
#   2. During a long session. An hour of work accumulates far more than anyone
#      remembers to flush at the end.
#
# USAGE
#   faq-reminder.sh precompact   # PreCompact hook: plain stdout IS the answer
#   faq-reminder.sh periodic     # UserPromptSubmit hook: JSON additionalContext,
#                                # and only once per interval
#
# Wire it up in a project's .claude/settings.json -- see hooks/README.md.
#
# Verified against Claude Code 2.1.330: `PreCompact` takes a trigger of
# "auto" or "manual" and treats plain text as the hook's answer;
# `UserPromptSubmit` injects `hookSpecificOutput.additionalContext`.

set -uo pipefail

# How long between periodic reminders. 60 minutes by default; set to 0 to
# disable the periodic one without unwiring it.
INTERVAL_MINUTES="${FAQ_REMINDER_INTERVAL_MINUTES:-60}"

# One stamp per project, so two repos open at once do not silence each other.
project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/faq-reminder"
stamp="$state_dir/$(printf '%s' "$project_dir" | tr -c 'A-Za-z0-9' '-').stamp"

# A reminder is worthless in a project with no FAQ tree: say nothing rather
# than nag about a directory that does not exist.
faq_dir=""
for candidate in "$project_dir/.claude/faqs" "$project_dir/faqs"; do
  if [ -d "$candidate" ]; then
    faq_dir="$candidate"
    break
  fi
done
[ -n "$faq_dir" ] || exit 0

# The FAQ is a two-way discipline: READ it before acting on an assumption, and
# WRITE to it after learning something. A reminder that covers only the write
# half lets the expensive failure through -- guessing at a procedure the project
# already documented.

write_half() {
  local span="$1"
  cat <<EOF
Write anything learned ${span} into the FAQ at ${faq_dir#"$project_dir"/}
before it is lost: a new pitfall, a changed procedure, an approach that was
tried and rejected, an environment gotcha, a correction to an existing entry.

  - search_faqs("<the topic>") to find the entry that should hold it, or to
    confirm none does.
  - Edit that file under ${faq_dir#"$project_dir"/}, or add one.
EOF
}

nothing_to_do_is_fine() {
  local subject="$1"
  cat <<EOF

${subject} is a correct answer.
Say so in one line and carry on -- do not invent an entry to satisfy this
reminder, do not rewrite an entry that is already correct, and do not re-read
entries you have already read this session.
EOF
}

# PreCompact: the knowledge is about to be summarised away. Flushing it is the
# whole point; consulting can wait for the next prompt.
compaction_message() {
  cat <<EOF
The conversation is about to be compacted.

EOF
  write_half "this session"
  nothing_to_do_is_fine "Nothing to add"
}

# Periodic: mid-session, so BOTH halves apply -- and the read half comes first,
# because the next thing that happens is more work, and work started from a
# guess is what the FAQ exists to prevent.
periodic_message() {
  local minutes="$1"
  cat <<EOF
It has been ${minutes}+ minutes since the last FAQ check.

Consult the FAQ MCP for whatever you are working on NOW, before acting on
training data or an assumption: environment setup, build and test commands,
architecture and why it is shaped that way, and approaches already tried and
rejected are all in there.

  - search_faqs("<what you are about to do>") -- BM25 across every entry.
  - get_faq("<title>") when you already know which entry you want.

Query first, act second. If a tool result contradicts what you were about to
assume, the FAQ wins.

EOF
  write_half "since then"
  nothing_to_do_is_fine "Nothing to consult and nothing to add"
}

case "${1:-}" in
  precompact)
    # PreCompact: plain text on stdout is the hook's answer. Always fires --
    # compaction is precisely when unwritten knowledge disappears.
    compaction_message
    ;;

  periodic)
    [ "$INTERVAL_MINUTES" -gt 0 ] 2>/dev/null || exit 0
    now=$(date +%s)
    last=0
    [ -f "$stamp" ] && last=$(cat "$stamp" 2>/dev/null || echo 0)
    case "$last" in
      ''|*[!0-9]*) last=0 ;;
    esac
    # First prompt of a session sets the clock rather than firing immediately:
    # a reminder before any work has happened is pure noise.
    if [ "$last" -eq 0 ]; then
      mkdir -p "$state_dir" && printf '%s' "$now" > "$stamp"
      exit 0
    fi
    if [ $(( (now - last) / 60 )) -lt "$INTERVAL_MINUTES" ]; then
      exit 0
    fi
    mkdir -p "$state_dir" && printf '%s' "$now" > "$stamp"
    python3 -I -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": sys.stdin.read(),
}}))
' <<< "$(periodic_message "$INTERVAL_MINUTES")"
    ;;

  *)
    echo "usage: $0 {precompact|periodic}" >&2
    exit 2
    ;;
esac
