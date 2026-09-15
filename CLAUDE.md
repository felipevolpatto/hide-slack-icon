# CLAUDE.md

Instructions for agents (Claude, Cursor, Codex) in this repository.

## What this is

GNOME Shell extension **Hide Slack Icon** (`hide-slack-icon@felipevolpatto.github.io`). Goal: hide **only** the Slack icon on the Top Panel, without touching other AppIndicators and without quitting Slack.

## Host environment

- Ubuntu 22.04.5 LTS, GNOME Shell **42.9**, **X11** session → use the **legacy** loader (`extension.js` + `imports.*`).
- GNOME 45+ uses ESM (`extension-esm.js`). Both loaders must exist and stay equivalent.

GNOME **does not** load this engineering directory. After edits, run `make install` and **restart GNOME Shell** — a newly installed extension is not detected at runtime (`_loadExtensions` only runs at shell boot). On X11: `Alt+F2` → `r`. On Wayland: log out / log in.

## How the Slack icon reaches the panel (found 2026-09-15)

Slack (snap, Electron, X11) **does not** publish a `StatusNotifierItem` on D-Bus. The icon is a **legacy XEmbed tray**, adopted by `appindicatorsupport@rgcjonas.gmail.com` / `ubuntu-appindicators@ubuntu.com`, which registers:

```
Main.panel.statusArea['appindicator-legacy:Slack:<pid>']
```

(`uniqueId` = `legacy:${wm_class}:${pid}`, `accessible_name` = `wm_class` = `Slack`.)

Two consequences:

1. The id **includes the pid**, so it changes every Slack restart. Never hardcode the id — polling plus the regex is what makes this work.
2. `PanelMenu.Button` wraps itself in `this.container = new St.Bin({ child: this })` **without a `visible` binding** (confirmed in GNOME 42 `panelMenu.js`). Hiding only the indicator can leave the slot reserved: hide **`actor.container` as well** and restore both in `disable()`.

## Architecture

```
metadata.json              UUID + shell-version 42–47 (no EGO `version` field)
extension.js               GNOME 42–44 (init/enable/disable)
extension-esm.js           GNOME 45+ (export default class extends Extension)
lib/hideSlackCore.js       shared logic (GJS imports)
lib/hideSlackCore.esm.js   same logic (ESM export)
scripts/install.sh         copies the matching loader to ~/.local/share/gnome-shell/extensions/
scripts/pack.sh            EGO zips in dist/ (42–44 legacy, 45–47 ESM)
```

A single `extension.js` cannot use both `import` and `imports.ui.main`: GJS 42 fails to parse `import`; the 45+ loader requires ESM.

## Implementation rules

1. **Hide scope:** only actors in `Main.panel.statusArea` whose identifier, `style_class`, `accessible_name`, or `get_name()` contains `slack` (case-insensitive). Never hide Docker, AnyDesk, Chrome, flameshot, the clock, or the system menu. Coverage is in `tests/match.test.js` (`make test`).
2. **Timer:** `GLib.timeout_add_seconds` with a **2 second** interval. In `disable()`, **always** `GLib.Source.remove(timeoutId)` and clear the id. No source leak.
3. **Revert:** `disable()` must `.show()` the actors this extension hid.
4. **Dual-core:** any change in `lib/hideSlackCore.js` must be mirrored in `lib/hideSlackCore.esm.js` (and vice versa).
5. **No prefs/schema** at this stage. No settings, extra D-Bus, or CSS.
6. **Do not** hardcode `/usr` paths. UUID only in `metadata.json` (scripts read it from there). Use `hide-slack-icon@felipevolpatto.github.io` (EGO namespace). Never ship `@organisys.local` or a `.local` UUID on EGO.
7. **EGO packs:** `make pack` only. Two zips, same UUID, split `shell-version`. Do not put tests, docs, or `scripts/` in the zip. Do not set `version` in metadata (EGO owns that field).

## Commands

```bash
make test             # matcher without a live shell (gjs)
make pack             # dist/*.zip for extensions.gnome.org
make install          # copy into the extensions directory
make enable
make disable
make uninstall
journalctl /usr/bin/gnome-shell -f
```

Runtime check without Looking Glass (X11): the tray is a 16x16 X window on the panel.

```bash
xwininfo -root -tree | grep -i slack        # find the id, e.g. 0x26000df
xwininfo -id 0x26000df | grep 'Map State'   # IsViewable = visible
```

`org.gnome.Shell.Eval` is **disabled** (unsafe-mode off), so `statusArea` cannot be inspected over D-Bus.

## Definition of Done

Verified 2026-09-15, GNOME 42.9 / X11, Slack snap 260.

- [x] `metadata.json` declares GNOME 42–47
- [x] Legacy loader (22.04) and ESM loader (24.04+) exist and install via `scripts/install.sh`
- [x] Only Slack disappears from the top panel — panel screenshot with and without the extension: flameshot, shields, cube, wifi, volume, mic, and battery intact
- [x] Disabling the extension restores the icon — enable/disable/enable cycle: tray X window `Map State` toggles `IsUnviewable` ↔ `IsViewable`
- [x] Slack keeps running with its window — 7 processes, main window `class="slack"` present
- [x] No JS errors from this extension in `journalctl` (only the update check against extensions.gnome.org, which returns 404 because it is unpublished — cosmetic)

## Do not

- Do not rewrite the extension as ESM-only “because it is modern” — this host is GNOME 42.
- Do not poll faster than 1s or use a busy loop.
- Do not match overly generic substrings (e.g. only `lack`) that would catch other icons.
