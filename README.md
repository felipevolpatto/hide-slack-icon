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

UUID: `hide-slack-icon@felipevolpatto.github.io`

This repository is the **source**. The copy GNOME actually loads lives at:

`~/.local/share/gnome-shell/extensions/hide-slack-icon@felipevolpatto.github.io`

## Installation (this machine)

```bash
make install
```

The script detects `gnome-shell` and copies the matching loader.

GNOME **does not** pick up newly installed extensions at runtime, so:

1. Restart GNOME Shell (X11: `Alt+F2`, type `r`. Wayland: log out / log in).
2. `make enable` (or `gnome-extensions enable hide-slack-icon@felipevolpatto.github.io`).
3. Open Slack and check the top panel.

Uninstall: `make uninstall`.

## Publish to extensions.gnome.org

The Extension Manager **Browse** tab lists [extensions.gnome.org](https://extensions.gnome.org), not GitHub. GitHub is only the project homepage.

1. Create an account at [extensions.gnome.org](https://extensions.gnome.org) (GNOME / GitLab login).
2. Build the review zips (runtime files only; two GNOME ranges, same UUID):

```bash
make pack
```

That writes:

- `dist/hide-slack-icon-gnome42-44.zip`
- `dist/hide-slack-icon-gnome45-47.zip`

3. Upload at [https://extensions.gnome.org/upload/](https://extensions.gnome.org/upload/):
   - First: the 42–44 zip (creates the listing).
   - Then: the 45–47 zip (new version; EGO still serves 42–44 to older shells).
4. Wait for review email. After approval, add screenshots on the extension page (`screenshots/panel-before.png` and `screenshots/panel-after.png`). Browse may take a while to refresh.

Do not zip this whole git tree. `make pack` already excludes docs, tests, and install scripts.

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
