#!/usr/bin/env bash
# Validates consistency of AI governance docs.
# Run: bash tools/check-ai-governance.sh
# Returns exit code 1 if any issues found.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_MD="$ROOT/AGENTS.md"
SKILLS_DIR="$ROOT/.ai/skills"
CODEX_SKILLS_DIR="$ROOT/.codex/skills"
SPECS_DIR="$ROOT/.ai/specs"

errors=0

echo "=== AI Governance Consistency Check ==="
echo ""

# 1. Every skill dir in .ai/skills/ must have a SKILL.md
echo "Checking .ai/skills/ directories..."
for dir in "$SKILLS_DIR"/*/; do
  skill_name="$(basename "$dir")"
  if [ ! -f "$dir/SKILL.md" ]; then
    echo "  ERROR: $dir missing SKILL.md"
    errors=$((errors + 1))
  fi
done

# 2. Every skill in .ai/skills/ must be referenced in AGENTS.md skill table
echo "Checking skills are listed in AGENTS.md..."
for dir in "$SKILLS_DIR"/*/; do
  skill_name="$(basename "$dir")"
  if ! grep -q "\`$skill_name\`" "$AGENTS_MD" 2>/dev/null; then
    echo "  ERROR: skill '$skill_name' exists in .ai/skills/ but not referenced in AGENTS.md"
    errors=$((errors + 1))
  fi
done

# 3. Every skill path in AGENTS.md shared table must exist on disk
echo "Checking AGENTS.md skill paths exist..."
grep -o '\.ai/skills/[^|`]*SKILL\.md' "$AGENTS_MD" 2>/dev/null | sed 's/ *$//' | while read -r path; do
  if [ ! -f "$ROOT/$path" ]; then
    echo "  ERROR: AGENTS.md references $path but file does not exist"
    # Cannot increment errors in subshell, use marker file
    touch "$ROOT/.ai-gov-check-fail"
  fi
done
if [ -f "$ROOT/.ai-gov-check-fail" ]; then
  rm -f "$ROOT/.ai-gov-check-fail"
  errors=$((errors + 1))
fi

# 4. .codex/skills/ should not contain full skill content (only pointers)
echo "Checking .codex/skills/ for duplicated content..."
if [ -d "$CODEX_SKILLS_DIR" ]; then
  for dir in "$CODEX_SKILLS_DIR"/*/; do
    if [ -d "$dir/references" ]; then
      echo "  WARNING: $dir has references/ — should be pointer only, not duplicated content"
      errors=$((errors + 1))
    fi
    if [ -f "$dir/SKILL.md" ]; then
      line_count=$(wc -l < "$dir/SKILL.md" | tr -d ' ')
      if [ "$line_count" -gt 15 ]; then
        echo "  WARNING: $(basename "$dir")/SKILL.md has $line_count lines — expected a short pointer (<15 lines)"
        errors=$((errors + 1))
      fi
    fi
  done
fi

# 5. Stale draft specs (older than 90 days)
echo "Checking for stale draft specs..."
if [ -d "$SPECS_DIR" ]; then
  for spec in "$SPECS_DIR"/SPEC-*.md; do
    [ -f "$spec" ] || continue
    if grep -qi "^\\*\\*Status\\*\\*:.*Draft" "$spec" 2>/dev/null; then
      file_age_days=$(( ( $(date +%s) - $(stat -f %m "$spec" 2>/dev/null || stat -c %Y "$spec" 2>/dev/null) ) / 86400 ))
      if [ "$file_age_days" -gt 90 ]; then
        echo "  WARNING: $(basename "$spec") is a Draft and $file_age_days days old — review or archive"
        errors=$((errors + 1))
      fi
    fi
  done
fi

# 6. Plans older than 30 days
echo "Checking for stale plans..."
PLANS_DIR="$ROOT/.ai/plans"
if [ -d "$PLANS_DIR" ]; then
  for plan in "$PLANS_DIR"/*.md; do
    [ -f "$plan" ] || continue
    plan_name="$(basename "$plan")"
    [ "$plan_name" = "README.md" ] && continue
    file_age_days=$(( ( $(date +%s) - $(stat -f %m "$plan" 2>/dev/null || stat -c %Y "$plan" 2>/dev/null) ) / 86400 ))
    if [ "$file_age_days" -gt 30 ]; then
      echo "  WARNING: plan '$plan_name' is $file_age_days days old — review or delete"
      errors=$((errors + 1))
    fi
  done
fi

echo ""
if [ "$errors" -gt 0 ]; then
  echo "FAILED: $errors issue(s) found"
  exit 1
else
  echo "PASSED: all checks OK"
  exit 0
fi
