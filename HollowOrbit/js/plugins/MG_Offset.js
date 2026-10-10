
/*:
 * @target MZ
 * @plugindesc Adds adjustable Y offsets to the player and events.
 * @author MGraymoon
 *
 * @command SetYOffset
 * @text Set Y Offset
 * @desc Changes the vertical offset of the player or an event.
 *
 * @arg target
 * @text Target
 * @type select
 * @option Player
 * @value player
 * @option Event
 * @value event
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 * @desc The event ID to modify. Only used when Target is Event.
 *
 * @arg yOffset
 * @text Y Offset
 * @type number
 * @default 0
 * @desc Vertical offset in pixels. Negative values move the sprite up.
 *
 * @command ResetYOffset
 * @text Reset Y Offset
 * @desc Restores the original note-based offset, or 0 for the player.
 *
 * @arg target
 * @text Target
 * @type select
 * @option Player
 * @value player
 * @option Event
 * @value event
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 1
 * @default 1
 * @desc The event ID to reset. Only used when Target is Event.
 */

(() => {
    const pluginName = document.currentScript.src
        .split("/")
        .pop()
        .replace(/\.js$/, "");

    PluginManager.registerCommand(
        pluginName,
        "SetYOffset",
        args => {
            const target = args.target === "event"
                ? $gameMap.event(Number(args.eventId))
                : $gamePlayer;

            if (!target) return;

            target._mgYOffset = Number(args.yOffset) || 0;
        }
    );

    PluginManager.registerCommand(
        pluginName,
        "ResetYOffset",
        args => {
            const target = args.target === "event"
                ? $gameMap.event(Number(args.eventId))
                : $gamePlayer;

            if (!target) return;

            delete target._mgYOffset;
        }
    );

    const _Sprite_Character_updatePosition =
        Sprite_Character.prototype.updatePosition;

    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);

        const character = this._character;
        if (!character) return;

        let yOffset = 0;

        if (character._mgYOffset !== undefined) {
            // Use the runtime offset when one has been set.
            yOffset = character._mgYOffset;
        } else if (character instanceof Game_Event) {
            // Otherwise, preserve the event's original note tag.
            yOffset = Number(
                character.event().meta.YOffset || 0
            );
        }

        this.y += yOffset;
    };
})();
