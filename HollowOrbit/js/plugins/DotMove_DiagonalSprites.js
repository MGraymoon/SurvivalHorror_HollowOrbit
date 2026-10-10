//=============================================================================
// DotMove_DiagonalSprites.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Renders true diagonal character graphics with DotMoveSystem. v1.0.0
 * @author YourName
 * @base DotMoveSystem
 * @orderAfter DotMoveSystem
 *
 * @param enablePlayer
 * @text Enable For Player
 * @type boolean
 * @desc If ON, the player character uses its diagonal sprite slots
 * whenever it's actually moving/facing diagonally.
 * @default true
 *
 * @param enableFollowers
 * @text Enable For Followers
 * @type boolean
 * @desc If ON, party followers mirror the player's diagonal-sprite
 * setting (recommended if your follower sheets use the same layout).
 * @default true
 *
 * @help DotMove_DiagonalSprites.js
 *
 * -----------------------------------------------------------------------
 * Requires
 * -----------------------------------------------------------------------
 * unagi ootoro's DotMoveSystem.js, placed ABOVE this plugin in the
 * Plugin Manager list.
 *
 * -----------------------------------------------------------------------
 * What it does
 * -----------------------------------------------------------------------
 * DotMoveSystem lets characters move at any angle, but it always
 * collapses their *facing* to one of the 4 cardinal directions, since
 * vanilla character sheets have no diagonal frames. This plugin adds
 * real diagonal facing, using this sprite sheet convention:
 *
 *   - A character's normal character-index slot holds the usual 4
 *     sub-rows: down, left, right, up (3 frames each) — unchanged.
 *   - The slot immediately below it (index + 4) holds 4 more sub-rows,
 *     in the SAME row order, for the diagonals:
 *       row 0 (down's row)  -> down-left
 *       row 1 (left's row)  -> down-right
 *       row 2 (right's row) -> up-left
 *       row 3 (up's row)    -> up-right
 *
 * Concretely: if a character uses character-index 0 in "People1.png"
 * for its normal 4 directions, index 4 in that same file must contain
 * its diagonal frames. This means only character-index 0-3 can be used
 * for characters that want diagonal sprites (so index+4 stays inside
 * the sheet), giving you up to 4 diagonal-capable characters per file.
 *
 * -----------------------------------------------------------------------
 * Turning it on for specific characters
 * -----------------------------------------------------------------------
 * - Player: controlled by the "Enable For Player" parameter.
 * - Followers: controlled by "Enable For Followers" (mirrors the
 *   player's setting).
 * - Events: put <diagonalSprite> anywhere in the event's Note field
 *   (on the event itself, not a page comment) to opt that event in.
 * - Actors/other characters spawned dynamically: call
 *   character.setDiagonalSprite(true) from a script call.
 *
 * -----------------------------------------------------------------------
 * Free to use and modify in any project, commercial or non-commercial.
 * -----------------------------------------------------------------------
 */

(() => {
    'use strict';

    const pluginName = "DotMove_DiagonalSprites";
    const parameters = PluginManager.parameters(pluginName);
    const enablePlayer = String(parameters['enablePlayer'] || 'true') === 'true';
    const enableFollowers = String(parameters['enableFollowers'] || 'true') === 'true';

    // Numpad-style diagonal direction codes.
    const DIAGONAL_DIRS = new Set([1, 3, 7, 9]);

    // Which sub-row (0-3) each diagonal direction uses within the
    // paired "index + 4" slot. See the layout description above.
    const DIAGONAL_PATTERN_Y = { 1: 0, 3: 1, 7: 2, 9: 3 };

    //-------------------------------------------------------------------
    // Game_CharacterBase: generic opt-in flag + a SEPARATE display
    // direction used only for sprite selection. This deliberately never
    // touches this.direction() / this._direction, because DotMoveSystem
    // relies on that value staying strictly cardinal (2/4/6/8) for things
    // unrelated to graphics: collision-axis math, front-tile event
    // triggers, vehicle landing orientation, etc. Diagonal facing is
    // purely a rendering concern here.
    //-------------------------------------------------------------------
    Game_CharacterBase.prototype.hasDiagonalSprite = function() {
        return !!this._diagonalSprite;
    };

    Game_CharacterBase.prototype.setDiagonalSprite = function(enabled) {
        this._diagonalSprite = !!enabled;
    };

    Game_CharacterBase.prototype.spriteDirection = function() {
        return this._diagonalDisplayDirection || this.direction();
    };

    Game_CharacterBase.prototype.setSpriteDirection = function(d) {
        this._diagonalDisplayDirection = d;
    };

    Game_CharacterBase.prototype.clearSpriteDirection = function() {
        this._diagonalDisplayDirection = null;
    };

    //-------------------------------------------------------------------
    // Player / Followers
    //-------------------------------------------------------------------
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._diagonalSprite = enablePlayer;
    };

    if (enableFollowers) {
        Game_Follower.prototype.hasDiagonalSprite = function() {
            return $gamePlayer.hasDiagonalSprite();
        };
    }

    //-------------------------------------------------------------------
    // Events: opt in via <diagonalSprite> note tag
    //-------------------------------------------------------------------
    Game_Event.prototype.hasDiagonalSprite = function() {
        if (this._diagonalSpriteChecked === undefined) {
            const note = this.event() ? this.event().note : '';
            this._diagonalSpriteChecked = true;
            this._diagonalSprite = /<diagonalSprite>/i.test(note || '');
        }
        return this._diagonalSprite;
    };

    //-------------------------------------------------------------------
    // DotMoveSystem: wrap (not replace) the movement methods so the
    // ORIGINAL logic still runs untouched — including its own
    // this.setDirection(...) calls, which must keep storing a cardinal
    // value. We just piggyback afterward to also record a precise
    // display direction for opted-in characters.
    //-------------------------------------------------------------------
    const Mover = DotMoveSystem.CharacterMover;
    const Utils = DotMoveSystem.DotMoveUtils;

    const _Mover_dotMoveByDeg = Mover.prototype.dotMoveByDeg;
    Mover.prototype.dotMoveByDeg = function(deg, dpf = this._character.distancePerFrame()) {
        _Mover_dotMoveByDeg.call(this, deg, dpf);
        if (this._character.hasDiagonalSprite()) {
            this._character.setSpriteDirection(deg.toDirection8());
        }
    };

    const _Mover_moveToTarget = Mover.prototype.moveToTarget;
    Mover.prototype.moveToTarget = function(targetPoint) {
        const fromPoint = this._character.positionPoint();
        const deg = fromPoint.calcDeg(targetPoint);
        _Mover_moveToTarget.call(this, targetPoint);
        if (this._character.hasDiagonalSprite()) {
            this._character.setSpriteDirection(deg.toDirection8());
        }
    };

    const _Mover_moveDiagonally = Mover.prototype.moveDiagonally;
    Mover.prototype.moveDiagonally = function(horz, vert, moveUnit) {
        _Mover_moveDiagonally.call(this, horz, vert, moveUnit);
        if (this._character.hasDiagonalSprite()) {
            const dir = Utils.horzAndVert2Direction(horz, vert);
            this._character.setSpriteDirection(dir);
        }
    };

    const _Mover_moveStraight = Mover.prototype.moveStraight;
    Mover.prototype.moveStraight = function(dir, moveUnit) {
        _Mover_moveStraight.call(this, dir, moveUnit);
        // A pure cardinal move: drop back to the character's real
        // (cardinal) direction for display too.
        this._character.clearSpriteDirection();
    };

    //-------------------------------------------------------------------
    // Sprite_Character: map diagonal directions to the "index + 4" slot
    //-------------------------------------------------------------------
    const _Sprite_Character_characterBlockY = Sprite_Character.prototype.characterBlockY;
    Sprite_Character.prototype.characterBlockY = function() {
        const character = this._character;
        if (
            !this._isBigCharacter &&
            character &&
            character.hasDiagonalSprite &&
            character.hasDiagonalSprite() &&
            DIAGONAL_DIRS.has(character.spriteDirection())
        ) {
            return _Sprite_Character_characterBlockY.call(this) + 4;
        }
        return _Sprite_Character_characterBlockY.call(this);
    };

    const _Sprite_Character_characterPatternY = Sprite_Character.prototype.characterPatternY;
    Sprite_Character.prototype.characterPatternY = function() {
        const character = this._character;
        if (character && character.hasDiagonalSprite && character.hasDiagonalSprite()) {
            const row = DIAGONAL_PATTERN_Y[character.spriteDirection()];
            if (row !== undefined) return row;
        }
        return _Sprite_Character_characterPatternY.call(this);
    };
})();
