#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UUID="$(python3 -c 'import json; print(json.load(open("'"$ROOT"'/metadata.json"))["uuid"])')"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
SHELL_MAJOR="$(gnome-shell --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo 0)"

mkdir -p "$DEST/lib"
cp "$ROOT/metadata.json" "$DEST/metadata.json"

if [[ "${SHELL_MAJOR}" -ge 45 ]]; then
  cp "$ROOT/extension-esm.js" "$DEST/extension.js"
  cp "$ROOT/lib/hideSlackCore.esm.js" "$DEST/lib/hideSlackCore.esm.js"
  echo "Installed ESM loader (GNOME ${SHELL_MAJOR}) → ${DEST}"
else
  cp "$ROOT/extension.js" "$DEST/extension.js"
  cp "$ROOT/lib/hideSlackCore.js" "$DEST/lib/hideSlackCore.js"
  echo "Installed legacy loader (GNOME ${SHELL_MAJOR}) → ${DEST}"
fi

echo
echo "GNOME does not pick up newly installed extensions at runtime."
echo "Next:"
echo "  1. Restart GNOME Shell:"
echo "       X11     -> Alt+F2, type 'r', Enter"
echo "       Wayland -> log out / log in"
echo "  2. gnome-extensions enable ${UUID}"
echo "  3. Open Slack and confirm the top-panel icon is hidden"
