import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { createHideSlack } from './lib/hideSlackCore.esm.js';

export default class HideSlackIconExtension extends Extension {
    enable() {
        this._controller = createHideSlack(Main, GLib);
        this._controller.enable();
    }

    disable() {
        this._controller?.disable();
        this._controller = null;
    }
}
