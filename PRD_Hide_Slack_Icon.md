# Product Requirements Document (PRD)
## Project: GNOME extension "Hide Slack Icon" (multi-version)

---

### 1. Overview

Build a custom GNOME Shell extension that works on **Ubuntu 22.04 LTS (GNOME 42)** and newer Ubuntu releases (such as **Ubuntu 24.04 LTS with GNOME 46+**).

The extension must hide **only** the **Slack** icon on the Top Panel, keep every other AppIndicator visible (Docker, AnyDesk, Chrome, and so on), and leave Slack running in the background, reachable from the Dock.

### 2. Multi-version context (GNOME 42 vs GNOME 45+)

GNOME Shell changed module loading between GNOME 44 and GNOME 45:

* **GNOME 42–44 (Ubuntu 22.04):** legacy GJS modules (`const Main = imports.ui.main;`) and global functions (`init()`, `enable()`, `disable()`).
* **GNOME 45+ (Ubuntu 23.10 / 24.04 / 26.04+):** required ECMAScript Modules (ESM) with `import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'` and class syntax (`export default class extends Extension`).

Full compatibility needs `metadata.json` to list every supported shell version and the GNOME ecosystem pattern of a legacy loader plus an ESM loader.

### 3. Scope and technical requirements

* **Supported operating systems:** Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, and newer releases.
* **GNOME Shell versions:** `["42", "43", "44", "45", "46", "47"]`.
* **Language:** JavaScript (ES6+ / ESM).
* **Performance:** the poll (`GLib.timeout_add_seconds`) must not burn CPU and MUST fully destroy timers in the `disable()` cleanup path.

### 4. Solution architecture

#### A. `metadata.json` structure

`metadata.json` must list every shell version the system should accept:

```json
{
  "uuid": "hide-slack-icon@felipevolpatto.github.io",
  "name": "Hide Slack Icon",
  "description": "Hides only the Slack icon from the top panel on Ubuntu 22.04+",
  "shell-version": [ "42", "43", "44", "45", "46", "47" ]
}
```

#### B. `extension.js` architecture

Use version-specific loaders: GNOME 45+ class + ESM, with a separate legacy entry for GNOME 42–44.

**Hide logic:**

1. Start a recurring check (2 second interval) with `GLib.timeout_add_seconds`.
2. Walk actors in `Main.panel.statusArea`.
3. Find any actor/indicator whose identifier or class contains `"slack"` (case-insensitive).
4. Call `.hide()` on the actor found (and its `container` when present).
5. In `disable()`, cancel the timer with `GLib.Source.remove()` and show the actor again with `.show()`.

---

### 5. Development workflow

#### Step 1: Project folder

Develop in this repository. Install into:

`~/.local/share/gnome-shell/extensions/hide-slack-icon@felipevolpatto.github.io`

GNOME does not load the engineering directory directly.

#### Step 2: `metadata.json`

Ship `metadata.json` with `"shell-version": [ "42", "43", "44", "45", "46", "47" ]`.

#### Step 3: Loaders

* GNOME &lt; 45 (Ubuntu 22.04): `init()`, `enable()`, `disable()` with `imports.ui.main`.
* GNOME ≥ 45 (Ubuntu 24.04+): class extending `Extension` from `resource:///org/gnome/shell/extensions/extension.js`.

#### Step 4: Install and test

1. Save files and run `make install`.
2. Restart the session (X11: `Alt+F2` → `r`; Wayland: log out / log in).
3. Enable:

   `gnome-extensions enable hide-slack-icon@felipevolpatto.github.io`
4. Open Slack and confirm the top-panel icon is hidden.

---

### 6. Definition of Done

- [x] `metadata.json` declares GNOME 42 through 47.
- [x] The code works on Ubuntu 22.04 LTS (GNOME 42) and on distributions with GNOME 45+.
- [x] Only the Slack icon is hidden on the top panel.
- [x] Disabling the extension shows the Slack icon again.
- [x] Slack keeps running and stays reachable from the Dock.
