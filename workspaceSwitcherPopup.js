const { Clutter, St } = imports.gi;

const { ExtensionState } = imports.misc.extensionUtils;
const OverviewControls = imports.ui.overviewControls;
const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const Main = imports.ui.main;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Util = Self.imports.util;

function override() {
    global.vertical_overview.GSFunctions['WorkspaceSwitcherPopup'] = Util.overrideProto(WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype, WorkspaceSwitcherPopupOverride);
}

function reset() {
    Util.overrideProto(WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype, WorkspaceSwitcherPopupOverride);
}

var WorkspaceSwitcherPopupOverride = {
    _redisplay: function() {
        // Move OSD to the side of the screen coresponding to the workspace picker location
        this._list.set_vertical(true);
        if (global.vertical_overview.workspace_picker_left) {
            this.set_x_align(Clutter.ActorAlign.START);
        } else {
            this.set_x_align(Clutter.ActorAlign.END);
        }
        this.set_y_align(Clutter.ActorAlign.CENTER);

        // translate x by dock width if picker and dock are on the same side
        const cosmicDock = Util.getDock();
        if (cosmicDock) {
            const mainDock = cosmicDock.stateObj.dockManager.mainDock
            const picker_left = global.vertical_overview.workspace_picker_left;
            const dashWidth = mainDock.width;

            if (mainDock.get_height() > mainDock.get_y()) {
                const dock_left = mainDock.get_x() <= 0
                if (dock_left && picker_left)  {
                    this.set_translation(dashWidth,0,0);
                } else if (!dock_left && !picker_left) {
                    this.set_translation(-dashWidth,0,0);
                }
            }
        }

        let workspaceManager = global.workspace_manager;
        this._list.destroy_all_children();

        for (let i = 0; i < workspaceManager.n_workspaces; i++) {
            const indicator = new St.Bin({
                style_class: 'ws-switcher-indicator',
            });

            if (i === this._activeWorkspaceIndex)
                indicator.add_style_pseudo_class('active');

            this._list.add_actor(indicator);
        }
    }

} 