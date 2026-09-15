'use strict';

const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const { createHideSlack } = Me.imports.lib.hideSlackCore;

let controller = null;

function init() {
    return {
        enable,
        disable,
    };
}

function enable() {
    if (controller)
        return;
    controller = createHideSlack(Main, GLib);
    controller.enable();
}

function disable() {
    if (!controller)
        return;
    controller.disable();
    controller = null;
}
