
/*:
 * @target MZ
 * @plugindesc Locks a character to a specific animation pattern.
 * @author MGraymoon
 *
 * @command LockPattern
 * @text Lock Pattern
 * @arg character
 * @type number
 * @min -1
 * @default -1
 * @text Character ID (-1 = Player, 0 = This Event)
 *
 * @arg pattern
 * @type number
 * @min 0
 * @max 2
 * @default 1
 * @text Pattern (0 = Left, 1 = Middle, 2 = Right)
 *
 * @command UnlockPattern
 * @text Unlock Pattern
 * @arg character
 * @type number
 * @min -1
 * @default -1
 * @text Character ID (-1 = Player, 0 = This Event)
 *
 * @command SetLockedPattern
 * @text Change Locked Pattern
 * @arg character
 * @type number
 * @min -1
 * @default -1
 * @text Character ID (-1 = Player, 0 = This Event)
 *
 * @arg pattern
 * @type number
 * @min 0
 * @max 2
 * @default 1
 * @text Pattern (0 = Left, 1 = Middle, 2 = Right)
 */

(() => {
    "use strict";

    const pluginName = "MG_CharacterPatternLock";

    function getCharacter(id) {
        if (id === -1) return $gamePlayer;
        if (id === 0) return $gameMap.event($gameMap._interpreter.eventId());
        return $gameMap.event(id);
    }

    const _updatePattern = Game_CharacterBase.prototype.updatePattern;
    Game_CharacterBase.prototype.updatePattern = function() {
        if (this._mgLockedPattern !== undefined) {
            this.setPattern(this._mgLockedPattern);
        } else {
            _updatePattern.call(this);
        }
    };

    PluginManager.registerCommand(pluginName, "LockPattern", args => {
        const character = getCharacter(Number(args.character));
        if (!character) return;

        character._mgLockedPattern = Number(args.pattern);
        character.setPattern(character._mgLockedPattern);
    });

    PluginManager.registerCommand(pluginName, "SetLockedPattern", args => {
        const character = getCharacter(Number(args.character));
        if (!character) return;

        character._mgLockedPattern = Number(args.pattern);
        character.setPattern(character._mgLockedPattern);
    });

    PluginManager.registerCommand(pluginName, "UnlockPattern", args => {
        const character = getCharacter(Number(args.character));
        if (!character) return;

        delete character._mgLockedPattern;
    });
})();
