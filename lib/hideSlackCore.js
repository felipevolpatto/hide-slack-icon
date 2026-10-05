'use strict';

/**
 * Shared hide-Slack logic for GNOME 42–44 (GJS `imports`).
 * Keep in sync with lib/hideSlackCore.esm.js.
 */

var POLL_SECONDS = 2;
var SLACK_RE = /slack/i;

function _textBlob(id, actor) {
    const parts = [String(id || '')];

    try {
        if (actor && actor.get_name)
            parts.push(String(actor.get_name() || ''));
    } catch (_e) {}

    try {
        if (actor && actor.style_class)
            parts.push(String(actor.style_class));
    } catch (_e) {}

    try {
        if (actor && actor.accessible_name)
            parts.push(String(actor.accessible_name));
    } catch (_e) {}

    // Snap Slack no longer uses the legacy XEmbed tray
    // (`appindicator-legacy:Slack:<pid>`). It registers a StatusNotifierItem
    // whose statusArea key is `appindicator-:<bus>/StatusNotifierItem` and
    // whose Title / accessible name are empty. The word "slack" lives on the
    // indicator id (`Slack_status_icon_1`) and on IconThemePath (`snap.slack`).
    try {
        const indicator = actor && actor._indicator;
        if (indicator) {
            if (indicator.id)
                parts.push(String(indicator.id));
            if (indicator.title)
                parts.push(String(indicator.title));
            if (indicator.accessibleName)
                parts.push(String(indicator.accessibleName));
            const themePath = indicator._proxy && indicator._proxy.IconThemePath;
            if (themePath)
                parts.push(String(themePath));
        }
    } catch (_e) {}

    return parts.join(' ');
}

function looksLikeSlack(id, actor) {
    return SLACK_RE.test(_textBlob(id, actor));
}

function createHideSlack(Main, GLib) {
    let timeoutId = 0;
    const hiddenActors = new Set();
    const stayHidden = new Map();

    // AppIndicators sets `visible = true` again whenever the SNI status is
    // Active. Keep the actor hidden until disable(), then disconnect so
    // show() is not undone.
    function bindStayHidden(actor) {
        if (!actor || stayHidden.has(actor) || !actor.connect)
            return;

        try {
            const signalId = actor.connect('notify::visible', () => {
                try {
                    if (actor.visible && actor.hide)
                        actor.hide();
                } catch (_e) {}
            });
            stayHidden.set(actor, signalId);
        } catch (_e) {}
    }

    // PanelMenu.Button wraps itself in `container` (an St.Bin) with no
    // visibility binding, so the container must be hidden too or the panel
    // keeps reserving its slot.
    function hideActor(actor) {
        try {
            if (actor.hide)
                actor.hide();
            hiddenActors.add(actor);
            bindStayHidden(actor);
        } catch (_e) {}
    }

    function scan() {
        const area = Main.panel && Main.panel.statusArea;
        if (!area)
            return GLib.SOURCE_CONTINUE;

        for (const id in area) {
            const actor = area[id];
            if (!actor || !looksLikeSlack(id, actor))
                continue;

            hideActor(actor);
            if (actor.container)
                hideActor(actor.container);
        }

        return GLib.SOURCE_CONTINUE;
    }

    return {
        enable() {
            scan();
            timeoutId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                POLL_SECONDS,
                scan
            );
        },

        disable() {
            if (timeoutId) {
                GLib.Source.remove(timeoutId);
                timeoutId = 0;
            }

            stayHidden.forEach((signalId, actor) => {
                try {
                    if (actor.disconnect)
                        actor.disconnect(signalId);
                } catch (_e) {}
            });
            stayHidden.clear();

            hiddenActors.forEach(actor => {
                try {
                    if (actor.show)
                        actor.show();
                } catch (_e) {}
            });
            hiddenActors.clear();
        },
    };
}
