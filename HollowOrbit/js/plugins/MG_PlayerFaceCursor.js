//=============================================================================
// PlayerFaceCursor.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Player character always faces the mouse cursor. v1.1.0
 * @author YourName
 *
 * @param disableSwitchId
 * @text Disable Switch ID
 * @type switch
 * @desc While this switch is ON, cursor-facing is turned off and normal
 * movement-based facing takes over. Set to 0 to leave the feature always on.
 * @default 0
 *
 * @param deadzone
 * @text Deadzone (pixels)
 * @type number
 * @min 0
 * @desc If the cursor is within this many pixels of the player's
 * center, facing won't update (prevents jitter). Default: 4
 * @default 4
 *
 * @param diagonal
 * @text Allow Diagonal Facing
 * @type boolean
 * @desc If ON, uses 8-direction facing (1,3,7,9) instead of 4.
 * Requires the DotMove_DiagonalSprites plugin (loaded above this one)
 * with diagonal sprites enabled for the player; otherwise has no visual effect.
 * @default false
 *
 * @param disableDuringEvents
 * @text Disable During Events
 * @type boolean
 * @desc If ON, cursor-facing pauses while an event is running or a
 * message is on screen, so cutscenes aren't affected.
 * @default true
 *
 * @help PlayerFaceCursor.js
 *
 * -----------------------------------------------------------------------
 * What it does
 * -----------------------------------------------------------------------
 * Normally, the player sprite's facing direction is tied to whichever
 * direction they last moved. This plugin decouples that: every frame,
 * it points the player toward the current mouse cursor position instead,
 * regardless of movement direction (including strafing, being pushed,
 * or standing still).
 *
 * -----------------------------------------------------------------------
 * Notes
 * -----------------------------------------------------------------------
 * - If the player has "Direction Fix" enabled (via event command or a
 *   plugin), this plugin respects that and won't override it.
 * - Works alongside normal keyboard/gamepad movement. You can move with
 *   the keyboard while facing tracks the mouse.
 * - The player's LOGICAL direction (used for collision checks, event
 *   front-touch triggers, etc.) always stays cardinal (2/4/6/8), no
 *   matter what. Diagonal facing is purely a display effect, applied via
 *   DotMove_DiagonalSprites' setSpriteDirection()/hasDiagonalSprite()
 *   API. Without that plugin installed and enabled for the player, the
 *   "Allow Diagonal Facing" option quietly has no visible effect — the
 *   player just faces the nearest cardinal direction, same as before.
 * - Touch/click-to-move is unaffected by this plugin; it only concerns
 *   which way the player *faces*, not how they path.
 *
 * -----------------------------------------------------------------------
 * Plugin Commands
 * -----------------------------------------------------------------------
 * None. Use the "Disable Switch ID" parameter if you need to toggle the
 * behavior on/off from events (e.g. during a scripted cutscene).
 *
 * -----------------------------------------------------------------------
 * Free to use and modify in any project, commercial or non-commercial.
 * -----------------------------------------------------------------------
 */

(() => {
    'use strict';

    const pluginName = "MG_PlayerFaceCursor";
    const parameters = PluginManager.parameters(pluginName);
    const disableSwitchId = Number(parameters['disableSwitchId'] || 0);
    const deadzone = Number(parameters['deadzone'] || 4);
    const useDiagonal = String(parameters['diagonal'] || 'false') === 'true';
    const disableDuringEvents = String(parameters['disableDuringEvents'] || 'true') === 'true';

    function isTrackingBlocked() {
        if (disableSwitchId > 0 && $gameSwitches.value(disableSwitchId)) {
            return true;
        }
        if (disableDuringEvents) {
            if ($gameMap.isEventRunning()) return true;
            if ($gameMessage.isBusy()) return true;
        }
        return false;
    }

    function directionFromDelta(dx, dy) {
        // Angle in degrees, 0 = right, increasing clockwise (screen space).
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        if (useDiagonal) {
            // 8 equal 45°-wide sectors, each centered on its direction
            // (e.g. "right" covers -22.5° to +22.5°).
            const DIRS8 = [6, 3, 2, 1, 4, 7, 8, 9];
            const index = Math.floor(((angle + 22.5) % 360) / 45);
            return DIRS8[index];
        } else {
            // 4 equal 90°-wide sectors, each centered on its direction.
            const DIRS4 = [6, 2, 4, 8];
            const index = Math.floor(((angle + 45) % 360) / 90);
            return DIRS4[index];
        }
    }

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        this.updateFaceCursor();
    };

    Game_Player.prototype.updateFaceCursor = function() {
        if (this._directionFix) return;
        if (isTrackingBlocked()) return;
        if (!TouchInput) return;

        // Player's on-screen position. screenY() returns the position of the
        // character's feet, so we lift it up roughly to the sprite's center.
        const px = this.screenX();
        const py = this.screenY() - $gameMap.tileHeight() / 2;

        const dx = TouchInput.x - px;
        const dy = TouchInput.y - py;

        if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return;

        const direction = directionFromDelta(dx, dy);
        const isDiagonal = [1, 3, 7, 9].includes(direction);

        // The logical/collision direction must always stay cardinal —
        // other systems (event front-touch triggers, collision-axis
        // math, etc.) assume this. Diagonal facing is display-only.
        let cardinalDirection = direction;
        if (isDiagonal) {
            const horz = (direction === 3 || direction === 9) ? 6 : 4;
            const vert = (direction === 7 || direction === 9) ? 8 : 2;
            cardinalDirection = Math.abs(dx) > Math.abs(dy) ? horz : vert;
        }
        this.setDirection(cardinalDirection);

        const hasDiagonalSprite = this.hasDiagonalSprite && this.hasDiagonalSprite();
        if (useDiagonal && hasDiagonalSprite && isDiagonal) {
            // Provided by the DotMove_DiagonalSprites plugin: shows the
            // real diagonal frame without touching the logical direction.
            this.setSpriteDirection(direction);
        } else if (this.clearSpriteDirection) {
            this.clearSpriteDirection();
        }
    };
})();
