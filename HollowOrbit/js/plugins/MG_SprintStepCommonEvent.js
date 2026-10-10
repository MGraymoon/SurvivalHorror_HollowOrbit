//-----------------------------------------------------------------------------
// Sprint Step Common Event Addon
//-----------------------------------------------------------------------------
// For: RPG Maker MZ
// Requires: GALV_AutoCommonEventsMZ.js
//-----------------------------------------------------------------------------

var Imported = Imported || {};
Imported.Galv_AutoCommonEvents_SprintStep = true;

var Galv = Galv || {};
Galv.ACE = Galv.ACE || {};

Galv.ACE.SprintStep = Galv.ACE.SprintStep || {};

//-----------------------------------------------------------------------------
// Plugin Parameters
//-----------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc Adds a common event that runs whenever the player takes a step while sprinting.
 * @MGraymoon
 *
 * @param sprintStep
 * @text Sprint Step Common Event
 * @desc Common event ID to run whenever the player successfully takes a step while sprinting. 0 = disabled.
 * @type common_event
 * @default 0
 *
 * @help
 * -----------------------------------------------------------------------------
 * Sprint Step Common Event
 * -----------------------------------------------------------------------------
 *
 * Requires Galv's Auto Common Events MZ.
 *
 * Runs the selected common event whenever the player successfully moves one
 * tile while sprinting/dashing.
 *
 * Walking does not trigger the event.
 *
 * The event is triggered once per successful step, rather than every frame
 * while the player is moving.
 *
 * -----------------------------------------------------------------------------
 */

(() => {
    const pluginName = "MG_SprintStepCommonEvent";
    const params = PluginManager.parameters(pluginName);

    const sprintStepCommonEvent = Number(params["sprintStep"] || 0);

    //-------------------------------------------------------------------------
    // Game_Player
    //-------------------------------------------------------------------------

    const _Game_Player_increaseSteps =
        Game_Player.prototype.increaseSteps;

    Game_Player.prototype.increaseSteps = function() {

        // Store whether the player was sprinting when the step occurred.
        const wasSprinting = this.isDashing();

        // Let RPG Maker perform its normal step processing.
        _Game_Player_increaseSteps.call(this);

        // Trigger the common event only for sprinting steps.
        if (wasSprinting && sprintStepCommonEvent > 0) {
            $gameTemp.reserveCommonEvent(sprintStepCommonEvent);
        }
    };

})();