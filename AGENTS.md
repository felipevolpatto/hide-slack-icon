# AGENTS.md

This project is a GNOME Shell extension. Before editing code, read `CLAUDE.md` (rules, 42 vs 45+ loaders, DoD).

Operational summary:

- Source: this repository. Runtime: `~/.local/share/gnome-shell/extensions/hide-slack-icon@felipevolpatto.github.io` via `make install`.
- Current host: Ubuntu 22.04 / GNOME 42 → legacy `extension.js`.
- Mirror logic changes in `lib/hideSlackCore.js` and `lib/hideSlackCore.esm.js`.
- `disable()` must remove the timer and restore the icon.
