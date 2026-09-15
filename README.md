# Hide Slack Icon

A GNOME Shell extension that **hides only the Slack icon** on the top panel (AppIndicator / StatusNotifier), leaving Docker, AnyDesk, Chrome, and other indicators untouched. Slack keeps running and stays reachable from the Dock.

See [PRD_Hide_Slack_Icon.md](./PRD_Hide_Slack_Icon.md) for product requirements.

## Compatibility

| Ubuntu | GNOME Shell | Loader |
| --- | --- | --- |
| 22.04 LTS | 42 | `extension.js` (`init` / `enable` / `disable`, `imports.*`) |
| 22.10–23.04 | 43–44 | same legacy loader |
| 23.10 / 24.04+ | 45+ | `extension-esm.js` (`Extension` class, ESM) |

`metadata.json` declares `"shell-version": ["42", "43", "44", "45", "46", "47"]`.

This repository is the **source**. The copy GNOME actually loads lives at:

`~/.local/share/gnome-shell/extensions/hide-slack-icon@organisys.local`

## Installation

```bash
make install
```

The script detects `gnome-shell` and copies the matching loader.

GNOME **does not** pick up newly installed extensions at runtime, so:

1. Restart GNOME Shell (X11: `Alt+F2`, type `r`. Wayland: log out / log in).
2. `make enable` (or `gnome-extensions enable hide-slack-icon@organisys.local`).
3. Open Slack and check the top panel.

Uninstall: `make uninstall`.

## How it works

Every 2 seconds the extension walks `Main.panel.statusArea`, finds actors whose id, `style_class`, `accessible_name`, or `get_name()` contains `"slack"` (case-insensitive), and hides the actor **and its `container`** (`PanelMenu.Button`'s wrapping `St.Bin` has no visibility binding). On `disable()`, the timer is removed with `GLib.Source.remove()` and every actor this extension hid gets `.show()`.

On this host Slack shows up as a legacy XEmbed tray icon with id `appindicator-legacy:Slack:<pid>`. The pid changes every time Slack restarts, which is why polling is used.

## Tests

```bash
make test
```

Runs the matcher with `gjs` against representative ids (Slack, flameshot, Docker, AnyDesk, `dateMenu`, `aggregateMenu`) without a live shell.

## Development

- Shared logic: `lib/hideSlackCore.js` (legacy) and `lib/hideSlackCore.esm.js` (GNOME 45+). **Keep them in sync.**
- Do not commit `~/.local/share/gnome-shell/extensions`.
- Logs: `journalctl /usr/bin/gnome-shell -f` (or `journalctl -f -o cat /usr/bin/gnome-shell`).

Agent instructions: [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md).
