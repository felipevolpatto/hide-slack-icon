#!/usr/bin/env bash
# Build extensions.gnome.org zips: one legacy (GNOME 42–44), one ESM (45–47).
# Each zip contains only runtime files. Upload them as successive versions
# of the same UUID; EGO serves the zip whose shell-version matches the user.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${ROOT}/dist"
UUID="$(python3 -c 'import json; print(json.load(open("'"$ROOT"'/metadata.json"))["uuid"])')"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$DIST"

write_metadata() {
  local dest="$1"
  shift
  python3 - "$ROOT/metadata.json" "$dest" "$@" <<'PY'
import json, sys
src_path, dest = sys.argv[1], sys.argv[2]
shell = sys.argv[3:]
src = json.load(open(src_path))
out = {
    "uuid": src["uuid"],
    "name": src["name"],
    "description": src["description"],
    "shell-version": shell,
    "url": src["url"],
}
with open(dest, "w") as fh:
    json.dump(out, fh, indent=2)
    fh.write("\n")
PY
}

pack_variant() {
  local name="$1"
  local loader="$2"
  local core="$3"
  shift 3
  local versions=("$@")

  local work="${STAGE}/${name}"
  mkdir -p "${work}/lib"
  write_metadata "${work}/metadata.json" "${versions[@]}"
  cp "${ROOT}/${loader}" "${work}/extension.js"
  cp "${ROOT}/${core}" "${work}/lib/$(basename "$core")"

  (cd "$work" && zip -qr "${work}/bundle.zip" metadata.json extension.js lib)
  local dest="${DIST}/${name}.zip"
  mv "${work}/bundle.zip" "$dest"
  echo "Wrote ${dest}"
  python3 - "$dest" <<'PY'
import sys, zipfile
path = sys.argv[1]
with zipfile.ZipFile(path) as zf:
    print("  " + "\n  ".join(sorted(zf.namelist())))
PY
}

cd "$ROOT"

pack_variant \
  "hide-slack-icon-gnome42-44" \
  "extension.js" \
  "lib/hideSlackCore.js" \
  42 43 44

pack_variant \
  "hide-slack-icon-gnome45-47" \
  "extension-esm.js" \
  "lib/hideSlackCore.esm.js" \
  45 46 47

echo
echo "Upload at https://extensions.gnome.org/upload/"
echo "  1. ${DIST}/hide-slack-icon-gnome42-44.zip   (first version, GNOME 42–44)"
echo "  2. ${DIST}/hide-slack-icon-gnome45-47.zip   (next version, GNOME 45–47)"
echo "Same UUID: ${UUID}"
