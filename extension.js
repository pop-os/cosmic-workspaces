const __DEBUG__ = true;

const { Gio, Meta, Shell, Clutter, GObject, Graphene, St } = imports.gi;
const WindowManager = imports.ui.windowManager;
const Main = imports.ui.main;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Util = Self.imports.util;
const OverviewControlsOverride = Self.imports.overviewControls;
const WorkspacesViewOverrides = Self.imports.workspacesView;
const WorkspaceThumbnailOverrides = Self.imports.workspaceThumbnail;
const WorkspaceSwitcherPopupOverride = Self.imports.workspaceSwitcherPopup;
const DashOverride = Self.imports.dash;
const Gestures = Self.imports.gestures;
const Background = imports.ui.background;
const WorkspaceOverrides = Self.imports.workspace;

function init() {
}

function enable() {
    if (__DEBUG__) global.log("[VERTICAL-OVERVIEW] starting overrides");
    global.vertical_overview = {};
    global.vertical_overview.GSFunctions = {};
    bindSettings();

    const settings_schema = Gio.SettingsSchemaSource.get_default().lookup('org.gnome.shell.extensions.pop-cosmic', true);
    global.vertical_overview.workspace_picker_left = true;
    if (settings_schema !== null) {
        const settings = new Gio.Settings({ settings_schema: settings_schema });
        global.vertical_overview.cosmic_settings = settings;
        settings.connect('changed::workspace-picker-left', (settings, label) => {
            global.vertical_overview.workspace_picker_left = settings.get_boolean(label);
	});
        global.vertical_overview.workspace_picker_left = settings.get_boolean('workspace-picker-left');
    }

    OverviewControlsOverride.override();
    WorkspacesViewOverrides.override();
    WorkspaceThumbnailOverrides.override();
    WorkspaceOverrides.override();
    Gestures.override();
    DashOverride.override();
    WorkspaceSwitcherPopupOverride.override();

    //this is the magic function that switches the internal layout to vertical
    global.workspace_manager.override_workspace_layout(Meta.DisplayCorner.TOPLEFT, true, -1, 1);

    //rebinding keys is necessary because bound functions don't update if the prototype for that function is changed
    rebind_keys(Main.overview._overview._controls);


    if (__DEBUG__) global.log("[VERTICAL_OVERVIEW] enabled");
}

function disable() {
    if (__DEBUG__) global.log("[VERTICAL-OVERVIEW] resetting overrides");

    OverviewControlsOverride.reset();
    WorkspacesViewOverrides.reset();
    WorkspaceOverrides.reset();
    WorkspaceThumbnailOverrides.reset();
    Gestures.reset();
    DashOverride.reset(true);
    WorkspaceSwitcherPopupOverride.reset();

    rebind_keys(Main.overview._overview._controls);

    global.workspaceManager.override_workspace_layout(Meta.DisplayCorner.TOPLEFT, false, 1, -1);

    delete global.vertical_overview.cosmic_settings;

    for (var key in global.vertical_overview.settings.signals) {
        Util.unbindSetting(key);
    };

    delete global.vertical_overview;
    if (__DEBUG__) global.log("[VERTICAL-OVERVIEW] disabled");
}

function bindSettings() {
    let controlsManager = Main.overview._overview._controls;

    Util.bindSetting('left-offset', (settings, label) => {
        controlsManager.layoutManager.leftOffset = settings.get_int(label);
    });

    Util.bindSetting('right-offset', (settings, label) => {
        controlsManager.layoutManager.rightOffset = settings.get_int(label);
    });

    Util.bindSetting('scaling-workspace-background', (settings, label) => {
        if (settings.get_boolean(label)) {
            WorkspaceOverrides.scalingWorkspaceBackgroundOverride();
        } else {
            WorkspaceOverrides.scalingWorkspaceBackgroundReset();
        }
    });

    Util.bindSetting('static-background', (settings, label) => {
        if (settings.get_boolean(label)) {
            WorkspaceOverrides.staticBackgroundOverride();
        } else {
            WorkspaceOverrides.staticBackgroundReset();
        }
    });

    Util.bindSetting('workspace-peek-distance', (settings, label) => {
        global.vertical_overview.workspacePeek = settings.get_int(label);
    });

    Util.bindSetting('dash-to-panel-left-right-fix', (settings, label) => {
        global.vertical_overview.misc_dTPLeftRightFix = settings.get_boolean(label);
    });

    Util.bindSetting('default-old-style', (settings, label) => {
        global.vertical_overview.default_old_style_enabled = settings.get_boolean(label);
        DashOverride.dash_old_style();
        WorkspaceThumbnailOverrides.thumbnails_old_style();
    });

    Util.bindSetting('old-style', (settings, label) => {
        global.vertical_overview.old_style_enabled = settings.get_boolean(label);
        DashOverride.dash_old_style();
        WorkspaceThumbnailOverrides.thumbnails_old_style();
    });

    Util.bindSetting('panel-in-overview', (settings, label) => {
        if (settings.get_boolean(label)) {
            if (global.vertical_overview.panel_signal_found) {
                global.vertical_overview.panel_signal.disconnected = true;
            } else {
                const callbackString = "()=>{this.add_style_pseudo_class('overview');}";
                let i = 0;
                while (i < Main.overview._signalConnections.length) {
                    const signal = Main.overview._signalConnections[i];
                    if (signal.name == 'showing') {
                        if (signal.callback.toString().replace(/[\ \n]/g, "") == callbackString) {
                            global.vertical_overview.panel_signal = signal;
                            global.vertical_overview.panel_signal_found = true;
                            signal.disconnected = true;
                            break;
                        }
                    }
                    i++;
                }
            }
        } else {
            if (global.vertical_overview.panel_signal_found) {
                global.vertical_overview.panel_signal.disconnected = false;
            }
        }
    });
}

function rebind_keys(self) {
    Main.wm.removeKeybinding('shift-overview-up');
    Main.wm.removeKeybinding('shift-overview-down');

    Main.wm.addKeybinding('shift-overview-up',
        new Gio.Settings({ schema_id: WindowManager.SHELL_KEYBINDINGS_SCHEMA }),
        Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
        () => self._shiftState(Meta.MotionDirection.UP));

    Main.wm.addKeybinding('shift-overview-down',
        new Gio.Settings({ schema_id: WindowManager.SHELL_KEYBINDINGS_SCHEMA }),
        Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
        () => self._shiftState(Meta.MotionDirection.DOWN))
}
