#!/usr/bin/env bash
# PostToolUse hook (Write|Edit) for Arcade Vault: runs Prettier then ESLint --fix
# on the file that was just written. Exits 2 (blocking) with the ESLint report
# on stderr when errors survive --fix, so Claude sees them in the same turn.
set -u

INPUT="$(cat)"
FILE="$(echo "$INPUT" | jq -r '.tool_response.filePath // .tool_input.file_path // empty')"

[ -z "$FILE" ] && exit 0
[ -f "$FILE" ] || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

case "$FILE" in
  "$ROOT"/*) ;;
  *) exit 0 ;;
esac

case "$FILE" in
  "$ROOT"/node_modules/*|"$ROOT"/.next/*) exit 0 ;;
esac

cd "$ROOT" || exit 0

npx --no-install prettier --write --ignore-unknown "$FILE" >/dev/null 2>&1

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

LINT_OUTPUT="$(npx --no-install eslint --fix --cache --no-warn-ignored "$FILE" 2>&1)"

if [ -n "$LINT_OUTPUT" ]; then
  echo "$LINT_OUTPUT" >&2
  exit 2
fi

exit 0
