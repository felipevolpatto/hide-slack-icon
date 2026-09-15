#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UUID="$(python3 -c 'import json; print(json.load(open("'"$ROOT"'/metadata.json"))["uuid"])')"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
LEGACY_UUID="hide-slack-icon@organisys.local"
LEGACY_DEST="${HOME}/.local/share/gnome-shell/extensions/${LEGACY_UUID}"

remove_one() {
  local uuid="$1"
  local dest="$2"
  gnome-extensions disable "$uuid" 2>/dev/null || true
  if [[ -d "$dest" ]]; then
    rm -rf "$dest"
    echo "Removed ${dest}"
  fi
}

remove_one "$UUID" "$DEST"
remove_one "$LEGACY_UUID" "$LEGACY_DEST"
