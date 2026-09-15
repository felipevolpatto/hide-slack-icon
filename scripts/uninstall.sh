#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UUID="$(python3 -c 'import json; print(json.load(open("'"$ROOT"'/metadata.json"))["uuid"])')"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

if [[ -d "$DEST" ]]; then
  rm -rf "$DEST"
  echo "Removed ${DEST}"
else
  echo "Nothing to remove at ${DEST}"
fi

gnome-extensions disable "$UUID" 2>/dev/null || true
