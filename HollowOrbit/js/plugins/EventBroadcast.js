//=============================================================================
// EventBroadcast.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Broadcasts a self-switch (and optional position) to nearby tagged events. v1.0.0
 * @author MGraymoon
 * @base SelfVariable
 * @orderAfter SelfVariable
 *
 * @command broadcast
 * @text Broadcast To Nearby Tagged Events
 * @desc Turns on a self-switch (and optionally stores a position) on every nearby event carrying a given event tag.
 *
 * @arg range
 * @type number
 * @decimals 2
 * @text Range (tiles)
 * @desc Only events within this many tiles of the center event are affected.
 * @default 5
 *
 * @arg tag
 * @type string
 * @text Event Tag
 * @desc Matches events tagged with <et: this text> (a SelfVariable.js event tag) on their first page.
 * @default enemy
 *
 * @arg selfSwitch
 * @type select
 * @option A
 * @option B
 * @option C
 * @option D
 * @text Self-Switch
 * @desc The self-switch to turn ON for every matching event.
 * @default A
 *
 * @arg centerEventId
 * @type number
 * @min -1
 * @text Center Event ID
 * @desc Event to measure range from. 0 = the event running this command, -1 = the player.
 * @default 0
 *
 * @arg setPosition
 * @type boolean
 * @text Store Position?
 * @desc If ON, also writes X/Y into two self variables on each matching event.
 * @default false
 *
 * @arg positionSourceEventId
 * @type number
 * @min -1
 * @text Position Source Event ID
 * @desc Whose X/Y to store on matches. 0 = same as Center Event ID, -1 = the player.
 * @default 0
 *
 * @arg xVariableId
 * @type variable
 * @text X Self-Variable ID
 * @desc Self variable (see SelfVariable.js) on each matching event that will receive the X coordinate.
 * @default 1
 *
 * @arg yVariableId
 * @type variable
 * @text Y Self-Variable ID
 * @desc Self variable (see SelfVariable.js) on each matching event that will receive the Y coordinate.
 * @default 2
 *
 * @param debugMode
 * @type boolean
 * @text Debug Logging
 * @desc If ON, prints a detailed breakdown to the console every time the broadcast command runs.
 * @default false
 *
 * @help EventBroadcast.js
 *
 * -----------------------------------------------------------------------
 * Requires
 * -----------------------------------------------------------------------
 * unagiootoro's SelfVariable.js, placed ABOVE this plugin in the Plugin
 * Manager list. This plugin uses SelfVariable's event-tag parsing
 * (<et: tag> comments) and its self-variable API.
 *
 * -----------------------------------------------------------------------
 * What it does
 * -----------------------------------------------------------------------
 * Plugin Command "Broadcast To Nearby Tagged Events":
 *   1. Finds every event on the current map within [Range] tiles of the
 *      Center Event (0 = whichever event ran the command, -1 = the
 *      player's current position).
 *   2. Among those, keeps only events tagged with <et: yourTag> in a
 *      Comment on their first page, e.g.:
 *          <et: enemy>
 *   3. Turns the chosen self-switch (A/B/C/D) ON for each match.
 *   4. Optionally, stores the X and Y of a "position source" event
 *      (defaults to the same Center Event, but can be a different one —
 *      e.g. the player, or a dedicated noise/marker event) into two
 *      self variables on each matching event, so their own event pages
 *      can react to where the broadcast came from.
 *
 * Range is measured as straight-line (Euclidean) distance in tiles, and
 * correctly accounts for looping maps.
 *
 * Note: if the Center Event itself happens to carry the matching tag,
 * it will also receive the self-switch/self-variables — it isn't
 * excluded automatically. Give it a different (or no) tag if you don't
 * want it to catch its own broadcast.
 *
 * -----------------------------------------------------------------------
 * Debugging
 * -----------------------------------------------------------------------
 * Turn on the "Debug Logging" parameter, open the console (F8 in the
 * playtest window), and run the command again. For every event on the
 * map, it prints its ID, its parsed event tags, its distance from the
 * center event, and exactly why it was skipped (no tag API / wrong tag /
 * out of range) or that it matched. It also prints a summary line and
 * warns you clearly if:
 *   - the Center Event or Position Source Event ID doesn't resolve to
 *     an actual event on the map,
 *   - SelfVariable.js isn't loaded/enabled (event.hasEventTag is
 *     missing), which would silently make every event fail to match,
 *   - zero events matched at all.
 *
 * -----------------------------------------------------------------------
 * Example
 * -----------------------------------------------------------------------
 * A "noise" event calls this with Range 6, Tag "enemy", Self-Switch A,
 * Store Position ON, Position Source Event = 0 (itself). Every event on
 * the map tagged <et: enemy> within 6 tiles turns its self-switch A on
 * and stores the noise's X/Y into self variables 1 and 2. Their event
 * pages can then check self-switch A to enter an "alert" page that
 * reads those self variables to move toward the noise.
 *
 * -----------------------------------------------------------------------
 * Free to use and modify in any project, commercial or non-commercial.
 * -----------------------------------------------------------------------
 */

(() => {
    'use strict';

    const pluginName = "EventBroadcast";
    const parameters = PluginManager.parameters(pluginName);
    const debugMode = String(parameters['debugMode'] || 'false') === 'true';

    function log(...msgs) {
        if (debugMode) console.log('[EventBroadcast]', ...msgs);
    }

    // Resolves a raw ID argument to a character (Game_Event or $gamePlayer)
    // plus a human-readable label for logging.
    //   -1  -> the player
    //    0  -> fallbackId (usually "the event running this command")
    //   >0  -> that event ID
    function resolveCharacter(rawId, fallbackId) {
        const id = rawId === 0 ? fallbackId : rawId;
        if (id === -1) {
            return { char: $gamePlayer, label: 'player', id: -1 };
        }
        const char = $gameMap.event(id);
        return { char, label: `event ${id}`, id };
    }

    PluginManager.registerCommand(pluginName, "broadcast", function(args) {
        const range = Number(args.range);
        const tag = String(args.tag);
        const selfSwitch = String(args.selfSwitch);
        const setPosition = args.setPosition === "true";
        const xVariableId = Number(args.xVariableId);
        const yVariableId = Number(args.yVariableId);

        if (debugMode) console.groupCollapsed('[EventBroadcast] broadcast()');
        log('raw args:', args);

        const center = resolveCharacter(Number(args.centerEventId), this.eventId());
        log(`center resolved to ${center.label} (this.eventId() = ${this.eventId()})`);
        if (!center.char) {
            console.warn(`[EventBroadcast] Center ${center.label} not found on this map — aborting. ` +
                `Check "Center Event ID" (0 = the event running this command, but that only works if this ` +
                `command is actually called FROM a map event, not a common event with no calling event, ` +
                `and not a battle event; -1 = the player).`);
            if (debugMode) console.groupEnd();
            return;
        }
        log(`center: ${center.label} x=${center.char.x} y=${center.char.y}`);

        const rawPositionSourceId = Number(args.positionSourceEventId);
        const positionSource = rawPositionSourceId === 0
            ? center
            : resolveCharacter(rawPositionSourceId, center.id);
        if (setPosition && !positionSource.char) {
            console.warn(`[EventBroadcast] Position Source ${positionSource.label} not found — ` +
                `falling back to the center's position.`);
        }
        const resolvedPositionSource = positionSource.char || center.char;

        const mapId = $gameMap.mapId();
        const srcX = resolvedPositionSource.x;
        const srcY = resolvedPositionSource.y;
        log(`position source: ${positionSource.char ? positionSource.label : center.label} ` +
            `x=${srcX} y=${srcY} (will be stored: ${setPosition})`);
        log(`tag="${tag}" range=${range} selfSwitch=${selfSwitch}`);

        const allEvents = $gameMap.events();
        log(`scanning ${allEvents.length} event(s) on map ${mapId}`);

        if (allEvents.length > 0 && typeof allEvents[0].hasEventTag !== 'function') {
            console.warn('[EventBroadcast] event.hasEventTag() is not a function on this map\'s events. ' +
                'This almost always means SelfVariable.js is missing, disabled, or loaded BELOW ' +
                'EventBroadcast.js in the Plugin Manager list. Every event will fail to match until ' +
                'that\'s fixed.');
        }

        let matchCount = 0;
        for (const event of $gameMap.events()) {
            const id = event.eventId();

            if (typeof event.hasEventTag !== 'function') {
                log(`event ${id}: SKIP - no hasEventTag() method (SelfVariable.js not active)`);
                continue;
            }

            const tags = event.eventTags ? event.eventTags() : undefined;

            if (!event.hasEventTag(tag)) {
                log(`event ${id}: SKIP - tags=[${tags ? tags.join(', ') : '?'}] does not include "${tag}"`);
                continue;
            }

            const dx = event.deltaXFrom(center.char.x);
            const dy = event.deltaYFrom(center.char.y);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > range) {
                log(`event ${id}: SKIP - has tag "${tag}" but distance=${distance.toFixed(2)} > range=${range}`);
                continue;
            }

            log(`event ${id}: MATCH - tags=[${tags.join(', ')}] distance=${distance.toFixed(2)} <= range=${range}`);
            matchCount++;

            $gameSelfSwitches.setValue([mapId, id, selfSwitch], true);
            log(`  -> set self-switch ${selfSwitch} = ON for event ${id}`);

            if (setPosition) {
                if (xVariableId > 0) {
                    event.setSelfVariableValue(xVariableId, srcX);
                    log(`  -> set self-variable ${xVariableId} (X) = ${srcX} for event ${id}`);
                }
                if (yVariableId > 0) {
                    event.setSelfVariableValue(yVariableId, srcY);
                    log(`  -> set self-variable ${yVariableId} (Y) = ${srcY} for event ${id}`);
                }
            }
        }

        if (matchCount === 0) {
            console.warn(`[EventBroadcast] Broadcast finished with 0 matches. Turn on the "Debug Logging" ` +
                `parameter and check the console for why each event was skipped.`);
        } else {
            log(`done - ${matchCount} event(s) matched.`);
        }
        if (debugMode) console.groupEnd();
    });
})();
