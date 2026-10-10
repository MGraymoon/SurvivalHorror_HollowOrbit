//=============================================================================
// DotMove_Crouch.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adds a Crouch state (hold Ctrl) with reduced speed and per-actor idle/move sprites. v1.1.0
 * @author YourName
 * @orderAfter DotMove_DiagonalSprites
 *
 * @param crouchKey
 * @text Crouch Key
 * @type text
 * @desc The Input.keyMapper name to hold for crouching. "control" (Ctrl) is mapped by default in MZ.
 * @default control
 *
 * @param crouchSpeedChange
 * @text Crouch Speed Change
 * @type number
 * @min -6
 * @max 6
 * @decimals 0
 * @desc Added to move speed while crouching. Dashing adds +1, so use a negative value here (e.g. -1 or -2).
 * @default -1
 *
 * @param disableDashWhileCrouching
 * @text Disable Dash While Crouching
 * @type boolean
 * @desc If ON, holding the dash button while crouching does nothing — crouch always wins over sprint.
 * @default true
 *
 * @param defaultCrouchIdleName
 * @text Default Crouch Idle — File
 * @type file
 * @dir img/characters
 * @desc Fallback sheet used while crouching/idle for any actor that has no <crouchIdle> notetag. Leave blank for none.
 * @default
 *
 * @param defaultCrouchIdleIndex
 * @text Default Crouch Idle — Index
 * @type number
 * @min 0
 * @max 7
 * @desc Index (0-7) within the Default Crouch Idle sheet.
 * @default 0
 *
 * @param defaultCrouchMoveName
 * @text Default Crouch Moving — File
 * @type file
 * @dir img/characters
 * @desc Fallback sheet used while crouching/moving for any actor with no <crouchMove> notetag. Blank reuses the idle default.
 * @default
 *
 * @param defaultCrouchMoveIndex
 * @text Default Crouch Moving — Index
 * @type number
 * @min 0
 * @max 7
 * @desc Index (0-7) within the Default Crouch Moving sheet.
 * @default 0
 *
 * @param applyToFollowers
 * @text Apply To Followers
 * @type boolean
 * @desc If ON, each follower uses its OWN actor's crouch sprites/notetags, mirroring the leader's crouch state.
 * @default true
 *
 * @param linkedSwitchId
 * @text Linked Switch (optional)
 * @type switch
 * @desc Optional. A Game Switch that is kept ON while the player is crouching. 0 = don't use a switch.
 * @default 0
 *
 * @help DotMove_Crouch.js
 *
 * -----------------------------------------------------------------------
 * What it does
 * -----------------------------------------------------------------------
 * Holding the Crouch Key (Ctrl by default) puts the player into a crouch
 * state: the opposite of sprinting. While crouching:
 *
 *   - Move speed is reduced by "Crouch Speed Change" (a negative number).
 *   - Dashing is suppressed (configurable) — crouch always overrides sprint.
 *   - The character graphic swaps to a "Crouch Idle" sheet while standing
 *     still, and a "Crouch Moving" sheet while walking.
 *
 * Crouching is automatically cancelled whenever the player can't move
 * (menus open, events running, in a vehicle, etc.), exactly like dashing.
 *
 * -----------------------------------------------------------------------
 * Per-actor crouch sprites (recommended)
 * -----------------------------------------------------------------------
 * Put this in an Actor's note box to give THAT actor its own crouch look,
 * regardless of which plugin defaults are set:
 *
 *     <crouchIdle:FileName,index>
 *     <crouchMove:FileName,index>
 *
 * Example, using character-index 2 of "Actor2" while idle and index 3
 * while moving:
 *
 *     <crouchIdle:Actor2,2>
 *     <crouchMove:Actor2,3>
 *
 * - If <crouchMove> is omitted but <crouchIdle> is present, the idle
 *   sheet is reused for moving too.
 * - If an actor has neither notetag, the plugin falls back to the
 *   "Default Crouch Idle/Moving" parameters below (handy for prototyping
 *   before you've set up every actor, or for a single-character project).
 * - If there's no notetag AND no default parameter set, crouching for
 *   that actor only changes speed — the sprite is left alone.
 *
 * This also means followers automatically show the correct crouch sprite
 * for whichever actor occupies that follower slot — no more "everyone
 * wears the leader's crouch sprite" problem.
 *
 * -----------------------------------------------------------------------
 * Diagonal movement
 * -----------------------------------------------------------------------
 * This plugin only decides WHICH character sheet/index is active. It does
 * not touch facing/frame selection, so it composes cleanly with
 * DotMove_DiagonalSprites.js: if your crouch sheets follow that plugin's
 * layout convention (normal 4-direction block, with the diagonal block
 * in the paired "index + 4" slot), diagonal crouch facing works
 * automatically — no extra setup needed. Just make sure crouch sheets
 * only use character-index 0-3 if you want diagonal frames for them
 * too, and keep DotMove_DiagonalSprites above this plugin in the list
 * (it's already set to load after it).
 *
 * -----------------------------------------------------------------------
 * Reading crouch state in events
 * -----------------------------------------------------------------------
 * Script call (works anywhere, e.g. a Conditional Branch > Script):
 *
 *     $gamePlayer.isCrouching()
 *
 * returns true/false. If you'd rather not use script calls, set the
 * "Linked Switch" parameter to a Game Switch ID — that switch is turned
 * ON automatically whenever the player is crouching and OFF otherwise,
 * so event pages can just check the switch like normal.
 *
 * -----------------------------------------------------------------------
 * Free to use and modify in any project, commercial or non-commercial.
 * -----------------------------------------------------------------------
 */

(() => {
    'use strict';

    const pluginName = "DotMove_Crouch";
    const parameters = PluginManager.parameters(pluginName);

    const crouchKey = String(parameters['crouchKey'] || 'control');
    const crouchSpeedChange = Number(parameters['crouchSpeedChange'] || -1);
    const disableDashWhileCrouching = String(parameters['disableDashWhileCrouching'] || 'true') === 'true';

    const defaultIdleName = String(parameters['defaultCrouchIdleName'] || '');
    const defaultIdleIndex = Number(parameters['defaultCrouchIdleIndex'] || 0);
    const defaultMoveNameRaw = String(parameters['defaultCrouchMoveName'] || '');
    const defaultMoveName = defaultMoveNameRaw !== '' ? defaultMoveNameRaw : defaultIdleName;
    const defaultMoveIndex = defaultMoveNameRaw !== ''
        ? Number(parameters['defaultCrouchMoveIndex'] || 0)
        : defaultIdleIndex;

    const hasDefaultSprites = defaultIdleName !== '' || defaultMoveName !== '';

    const applyToFollowers = String(parameters['applyToFollowers'] || 'true') === 'true';
    const linkedSwitchId = Number(parameters['linkedSwitchId'] || 0);

    //-------------------------------------------------------------------
    // Actor notetag parsing: <crouchIdle:File,index> / <crouchMove:File,index>
    // Parsed lazily and cached per actor data entry.
    //-------------------------------------------------------------------
    function parseCrouchNotetag(rawValue) {
        if (!rawValue) return null;
        const parts = String(rawValue).split(',');
        const name = (parts[0] || '').trim();
        if (name === '') return null;
        const index = parts.length > 1 ? Number(parts[1].trim()) || 0 : 0;
        return { name, index };
    }

    function actorCrouchSprites(actorData) {
        if (!actorData) return null;
        if (actorData._crouchSpritesParsed) return actorData._crouchSpritesCache;
        const idle = parseCrouchNotetag(actorData.meta.crouchIdle);
        const move = parseCrouchNotetag(actorData.meta.crouchMove) || idle;
        const cache = (idle || move) ? { idle, move } : null;
        actorData._crouchSpritesParsed = true;
        actorData._crouchSpritesCache = cache;
        return cache;
    }

    // Resolves the {name, index} to use for a given actorId + moving state,
    // falling back to the plugin-wide defaults when the actor has no
    // notetags of its own, and returning null when nothing applies (in
    // which case the caller should keep the character's normal sprite).
    function resolveCrouchSprite(actorId, moving) {
        const actorData = $dataActors ? $dataActors[actorId] : null;
        const perActor = actorCrouchSprites(actorData);
        if (perActor) {
            const entry = moving ? perActor.move : perActor.idle;
            if (entry) return entry;
        }
        if (hasDefaultSprites) {
            return moving
                ? { name: defaultMoveName, index: defaultMoveIndex }
                : { name: defaultIdleName, index: defaultIdleIndex };
        }
        return null;
    }

    //-------------------------------------------------------------------
    // Game_CharacterBase: generic crouch flag, readable on any character.
    //-------------------------------------------------------------------
    Game_CharacterBase.prototype.isCrouching = function() {
        return false;
    };

    //-------------------------------------------------------------------
    // Game_Player: drives the crouch state from input.
    //-------------------------------------------------------------------
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this._crouching = false;
    };

    Game_Player.prototype.isCrouchButtonPressed = function() {
        return Input.isPressed(crouchKey);
    };

    Game_Player.prototype.updateCrouching = function() {
        if (this.canMove() && !this.isInVehicle()) {
            this._crouching = this.isCrouchButtonPressed();
        } else {
            this._crouching = false;
        }
        if (linkedSwitchId > 0 && $gameSwitches.value(linkedSwitchId) !== this._crouching) {
            $gameSwitches.setValue(linkedSwitchId, this._crouching);
        }
    };

    Game_Player.prototype.isCrouching = function() {
        return this._crouching;
    };

    // Compute the crouch state before the rest of update() runs, so
    // isDashing()/realMoveSpeed()/moveByInput() all see the correct value
    // for this frame.
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        this.updateCrouching();
        _Game_Player_update.call(this, sceneActive);
    };

    // Crouch always wins over sprint.
    if (disableDashWhileCrouching) {
        const _Game_Player_isDashing = Game_Player.prototype.isDashing;
        Game_Player.prototype.isDashing = function() {
            if (this.isCrouching()) {
                return false;
            }
            return _Game_Player_isDashing.call(this);
        };
    }

    // Reduced speed while crouching (the mirror image of the dash bonus).
    //
    // IMPORTANT: core RPG Maker's realMoveSpeed() — which distancePerFrame()
    // (and therefore all actual movement) is based on — reads this._moveSpeed
    // directly instead of calling moveSpeed(). Overriding moveSpeed() alone
    // changes what event commands/plugins that *ask* for the speed see, but
    // never touches how fast the character actually walks. We have to
    // override realMoveSpeed() itself.
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const base = _Game_Player_realMoveSpeed.call(this);
        if (this.isCrouching()) {
            return Math.max(1, base + crouchSpeedChange);
        }
        return base;
    };

    // Swap to the crouch idle/moving sheets, using the party leader's own
    // notetags (falling back to the plugin-wide defaults).
    const _Game_Player_characterName = Game_Player.prototype.characterName;
    Game_Player.prototype.characterName = function() {
        if (this.isCrouching()) {
            const leader = $gameParty.leader();
            if (leader) {
                const info = resolveCrouchSprite(leader.actorId(), this.isMoved());
                if (info) return info.name;
            }
        }
        return _Game_Player_characterName.call(this);
    };

    const _Game_Player_characterIndex = Game_Player.prototype.characterIndex;
    Game_Player.prototype.characterIndex = function() {
        if (this.isCrouching()) {
            const leader = $gameParty.leader();
            if (leader) {
                const info = resolveCrouchSprite(leader.actorId(), this.isMoved());
                if (info) return info.index;
            }
        }
        return _Game_Player_characterIndex.call(this);
    };

    //-------------------------------------------------------------------
    // Followers: each one uses its OWN actor's crouch sprites, mirroring
    // only the leader's crouch state/timing.
    //-------------------------------------------------------------------
    if (applyToFollowers) {
        Game_Follower.prototype.isCrouching = function() {
            return $gamePlayer.isCrouching();
        };

        // $gamePlayer.followers() always holds maxBattleMembers() slots
        // (4 by default) even with a smaller party — the extra slots
        // simply have no actor() assigned, and core's characterName()
        // returns '' for them so they never render. We must keep that
        // guard here too, or those empty slots suddenly get a real
        // sprite and show up as phantom crouching party members.
        const _Game_Follower_characterName = Game_Follower.prototype.characterName;
        Game_Follower.prototype.characterName = function() {
            const actor = this.actor();
            if (actor && this.isCrouching()) {
                const info = resolveCrouchSprite(actor.actorId(), this.isMoved());
                if (info) return info.name;
            }
            return _Game_Follower_characterName.call(this);
        };

        const _Game_Follower_characterIndex = Game_Follower.prototype.characterIndex;
        Game_Follower.prototype.characterIndex = function() {
            const actor = this.actor();
            if (actor && this.isCrouching()) {
                const info = resolveCrouchSprite(actor.actorId(), this.isMoved());
                if (info) return info.index;
            }
            return _Game_Follower_characterIndex.call(this);
        };
    }
})();
