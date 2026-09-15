#!/usr/bin/env gjs
// Runs the matcher against real-world statusArea ids without a live shell.
// Usage: gjs tests/match.test.js   (or `make test`)

const GLib = imports.gi.GLib;

imports.searchPath.unshift(GLib.get_current_dir());

const { looksLikeSlack } = imports.lib.hideSlackCore;

const CASES = [
    // [shouldHide, statusArea id, fake actor]
    [true, 'appindicator-legacy:Slack:331804', { accessible_name: 'Slack' }],
    [true, 'appindicator-legacy:slack:331804', { accessible_name: 'slack' }],
    [true, 'appindicator-org.kde.StatusNotifierItem-1-1', { accessible_name: 'Slack' }],
    [true, 'slackIndicator', {}],
    [false, 'appindicator-legacy:flameshot:10686', { accessible_name: 'flameshot' }],
    [false, 'appindicator-legacy:docker-desktop:4242', { accessible_name: 'Docker Desktop' }],
    [false, 'appindicator-legacy:AnyDesk:777', { accessible_name: 'AnyDesk' }],
    [false, 'dateMenu', { accessible_name: 'Clock' }],
    [false, 'aggregateMenu', { accessible_name: 'System' }],
    [false, 'a11y', {}],
    [false, 'keyboard', {}],
    [false, 'appindicator-legacy:Slick:1', { accessible_name: 'Slick' }],
];

let failures = 0;

for (const [expected, id, actor] of CASES) {
    const got = looksLikeSlack(id, actor);
    const ok = got === expected;
    if (!ok)
        failures++;
    print(`${ok ? 'ok  ' : 'FAIL'}  hide=${got} (expected ${expected})  ${id}`);
}

print('');
print(failures === 0
    ? `All ${CASES.length} cases passed.`
    : `${failures}/${CASES.length} cases FAILED.`);

if (failures > 0)
    imports.system.exit(1);
