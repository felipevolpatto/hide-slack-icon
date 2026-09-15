/**
 * Shared hide-Slack logic for GNOME 45+ (ESM).
 * Keep in sync with lib/hideSlackCore.js.
 */

export const POLL_SECONDS = 2;
const SLACK_RE = /slack/i;

function textBlob(id, actor) {
    const parts = [String(id || '')];

    try {
        if (actor?.get_name)
            parts.push(String(actor.get_name() || ''));
    } catch (_e) {}

    try {
        if (actor?.style_class)
            parts.push(String(actor.style_class));
    } catch (_e) {}

    try {
        if (actor?.accessible_name)
            parts.push(String(actor.accessible_name));
    } catch (_e) {}

    return parts.join(' ');
}

export function looksLikeSlack(id, actor) {
    return SLACK_RE.test(textBlob(id, actor));
}

export function createHideSlack(Main, GLib) {
    let timeoutId = 0;
    const hiddenActors = new Set();

    // PanelMenu.Button wraps itself in `container` (an St.Bin) with no
    // visibility binding, so the container must be hidden too or the panel
    // keeps reserving its slot.
    function hideActor(actor) {
        try {
            actor.hide?.();
            hiddenActors.add(actor);
        } catch (_e) {}
    }

    function scan() {
        const area = Main.panel?.statusArea;
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

            hiddenActors.forEach(actor => {
                try {
                    actor.show?.();
                } catch (_e) {}
            });
            hiddenActors.clear();
        },
    };
}
