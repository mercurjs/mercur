#!/usr/bin/env bash
set -euo pipefail

# Compare package.json dependency changes between HEAD and base branch
# Usage: ./scripts/check-new-deps.sh <base-ref>

BASE_REF="${1:-origin/main}"

echo "Comparing dependencies against $BASE_REF..."

CHANGED_PKGJSONS=$(git diff --name-only "$BASE_REF"...HEAD -- '**/package.json' | grep -v node_modules || true)

if [ -z "$CHANGED_PKGJSONS" ]; then
  echo "No package.json files changed."
  exit 0
fi

HAS_NEW_DEPS=0

for PKG in $CHANGED_PKGJSONS; do
  if ! git show "$BASE_REF:$PKG" &>/dev/null; then
    echo "::warning::NEW package.json: $PKG (entire file is new)"
    HAS_NEW_DEPS=1
    continue
  fi

  # Extract dependency names from base and head
  BASE_DEPS=$(git show "$BASE_REF:$PKG" | grep -oE '"[^"]+"\s*:\s*"[^"]+"' | grep -v '"name"\|"version"\|"description"\|"license"\|"author"\|"private"\|"type"\|"main"\|"module"\|"types"' | sort || true)
  HEAD_DEPS=$(cat "$PKG" | grep -oE '"[^"]+"\s*:\s*"[^"]+"' | grep -v '"name"\|"version"\|"description"\|"license"\|"author"\|"private"\|"type"\|"main"\|"module"\|"types"' | sort || true)

  NEW_DEPS=$(comm -13 <(echo "$BASE_DEPS") <(echo "$HEAD_DEPS") || true)

  if [ -n "$NEW_DEPS" ]; then
    echo ""
    echo "::warning::$PKG has new/changed dependencies:"
    echo "$NEW_DEPS" | while read -r line; do
      echo "  + $line"
    done
    HAS_NEW_DEPS=1
  fi
done

if [ "$HAS_NEW_DEPS" -eq 1 ]; then
  echo ""
  echo "New or changed dependencies detected. Please review carefully."
fi
