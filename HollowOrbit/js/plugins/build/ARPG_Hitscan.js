/*:
@target MZ
@plugindesc ARPG_Hitscan v1.0.0 - Instant hitscan attacks for ARPG_Core
@author Claude
@base ARPG_Core
@orderAfter ARPG_Core

@param DebugLogging
@text Debug Logging
@type boolean
@default false
@desc If ON, prints a detailed console trace for Setup Hitscan / Stop Hitscan and every repeating shot. See help.

@help
【Summary】
This plugin is an addon for ARPG_Core (by unagi ootoro). It adds a
"hitscan" attack: instead of spawning a Skill Object that travels and
collides over several frames, it instantly traces a line from a muzzle
point out to a maximum range, in a single frame, and applies a skill's
damage effect directly to the FIRST valid battler whose "damage" hit box
lies in that line ("line of effect"). This is the standard building
block for gunplay - hitscan weapons, laser sights, sniper shots, etc.

It stops early at anything that would normally block character movement
(walls, solid/blocking events), unless "Ignore Character Obstacles" is
turned on. It only ever looks for "damage" type hit boxes, i.e. exactly
the hit boxes you already configure with ARPG_Core's own
"Set Hit Box" plugin command - no extra hit box setup is required.

■ Required Plug-ins
This plugin requires ARPG_Core.js (and therefore also DotMoveSystem.js,
DotMoveSystem_FunctionEx.js and SelfVariable.js, which ARPG_Core.js
itself requires). Place ARPG_Hitscan.js below ARPG_Core.js in the plugin
list.

■ Basic usage (as part of a skill)
Just like a Skill Object, a hitscan attack is normally fired from a
skill's Action Common Event, after "Activate Skill":

  Activate Skill
  Hitscan   <- this plugin's command
  (end of action common event)

By default "Hitscan" applies whichever skill is currently being used
(the one "Activate Skill" activated), the same convention used by
ARPG_Core's own "Create Skill Object" and "Apply Skill Effect" commands.
Turn on "Specify Skill" if you'd rather name a specific skill/item
instead.

■ Basic usage (outside the skill flow)
"Hitscan" does not actually require a skill to be "activated" - it will
work from any parallel/autorun event too (e.g. a sentry-gun enemy that
fires on a timer). In that case turn "Specify Skill" ON and pick the
skill/item whose damage formula, elements etc. should be applied.

■ Targeting rule
A hit only counts if the struck battler is alive and is a valid target
for the skill's scope (For One Enemy / For Everyone / For User's Ally,
etc.) relative to the shooter - exactly the same scope check ARPG_Core
uses for collide-attacks and skill objects. Skills scoped only for
allies will only ever hit allies, and vice-versa.

■ Knockback / direction
The damage effect is applied through the same internal mechanism
ARPG_Core uses for collide-attacks, so any knockback caused by the skill
uses the shooter's current 8-direction facing (not the precise firing
angle) - identical to how melee collide-attacks already behave in
ARPG_Core. If you want knockback along the exact firing angle instead,
read the "Firing angle store variable" output and follow up with
ARPG_Core's own "Character Blow Away" command using that value.

■ Piercing
Set "Pierce Count" above 1 to let the shot continue through the first
N battlers it strikes (a railgun/piercing round), instead of stopping
at the first one. Each pierced target only takes damage once.

■ Aiming at the mouse cursor
Set "Angle mode" to "toward mouse cursor" to fire from the shooter
toward wherever the mouse currently is on screen (twin-stick/top-down
shooter style aiming), converted to the exact map point under the
cursor rather than snapping to a tile. This reads the mouse's last
known position, so on a touch-only device, or before the player has
moved the mouse at all in the current session, it will aim at whatever
position was last recorded (usually (0,0)) - it is meant for mouse/PC
play. It has no effect on where the shooter is actually facing/walking.

■ Preview / detection only
Turn "Apply Damage" OFF to use this command purely as a line detector
(e.g. for a laser-sight preview, or so a turret AI can decide whether
to fire) - it will still report what/where it would have hit, but will
not deal any damage.

■ Debug visualization
Turn "Debug Draw" ON to briefly draw the traced line on screen - green
if it reached full range with no hit, orange if it was stopped by
terrain/an obstacle, or red with a dot at the impact point if it struck
a valid target. It fades out and disappears on its own; this is a
debug aid only and has no effect on gameplay. You can also draw a line
yourself from a script call for any other debugging purpose:

  ARPG_HitscanDebug.showLine(x1, y1, x2, y2, {
      color: 0xff3333,   // optional, hex color, default red
      markEnd: true,     // optional, draws a dot at (x2,y2), default false
      duration: 60       // optional, frames until it fully fades, default 60 (~1 second)
  });

x1/y1/x2/y2 are map coordinates in dots/tiles (the same coordinate
space as centerPositionPoint()/positionPoint()), not screen pixels.

■ Repeating fire: "Setup Hitscan" / "Stop Hitscan"
"Setup Hitscan" takes the exact same parameters as "Hitscan", plus an
"Interval" (in frames). Instead of firing once, it starts a background
timer for that shooter that keeps firing the same shot every Interval
frames - the calling event immediately moves on to its next command(s)
while the shots keep going on their own, e.g. a sentry turret that
walks a patrol route while continuously firing:

  Setup Hitscan   <- configure once, starts firing every X frames
  (event goes on to move around, wait, whatever else)

Call "Stop Hitscan" (with the same Shooter specified) to cancel it.
Calling "Setup Hitscan" again for a shooter that already has one
running replaces it with the new settings/interval, rather than
stacking a second timer.

The Origin and Firing angle are both re-evaluated fresh on every shot
(not just once at setup), so e.g. "toward a character" will keep
re-aiming at a moving target, and "shooter's center" will keep
following a moving shooter. If "Specify Skill" is OFF, the shooter's
currently activated skill is also re-checked on every shot.

A repeating Hitscan is NOT saved with the game, and is automatically
stopped (for every shooter) whenever the map changes. If you need one
to persist, re-issue "Setup Hitscan" from an autorun/parallel event
each time the relevant map loads.

■ Debugging repeating fire
Turn on the "Debug Logging" plugin parameter, open the console (F8 in
the playtest window), and run your events again. Every Setup/Stop call
and every repeating shot will print a trace line. A few things that
commonly look like "it's not working" but aren't bugs:

  - "Stop Hitscan" matches shooters by WHICH CHARACTER they resolve to
    (the same event/player/follower), not by which event calls the
    command. Stopping event 5's hitscan works from any event, as long
    as its Shooter specification also resolves to event 5 (e.g.
    "specify event ID" = 5) - it does NOT need to be called by event 5
    itself. If Debug Logging shows Setup and Stop resolving to
    different-looking shooters, that's the mismatch.
  - If "Fire Immediately" is OFF, nothing happens until one full
    Interval has passed after Setup Hitscan runs - this can look like
    it silently failed if you're watching right after calling it.
  - Repeating fire only ticks while the map scene is active (same as
    the event interpreter itself) - it will not fire while a message
    window, the menu, or a battle is up.
  - It will not fire at all if the shooter never resolves (e.g. a
    "specify event ID" pointing at an event that doesn't exist on the
    CURRENT map) - with Debug Logging on this prints a warning instead
    of silently doing nothing.
  - If you're also using SelfVariable.js: pointing "Hit result switch"
    / "Blocked switch" / any of the variable outputs at a switch or
    variable whose database NAME uses SelfVariable's self-switch/self-
    variable prefix is fully supported and recommended when you want
    the result scoped to the specific shooter event (e.g. "did I spot
    the player", not "did ANY turret spot the player"). It's written
    straight to the shooter event's own self-switch/self-variable slot,
    which works correctly even from a repeating background shot. This
    only works when the shooter is an event, though - the player/a
    follower/a vehicle have no self-switch/self-variable slot to write
    to (SelfVariable.js's system is per-EVENT), so using one of these
    IDs with a non-event shooter falls back to a plain switch/variable
    write, which will log a warning and do nothing useful if that ID
    truly is self-switch/self-variable-prefixed.

You can also inspect what's currently running at any time from the
console:

  ARPG_HitscanDebug.listActive()

This prints every shooter with an active repeating hitscan, its
interval, and frames remaining until its next shot - without needing
Debug Logging turned on.

@command Hitscan
@text Hitscan
@desc Instantly checks a straight line for the first battler(s) in it and applies a skill's effect to them.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The character firing the shot.

@arg IsSkillSpecification
@text Specify Skill
@type boolean
@default false
@desc If ON, the skill/item below is used. If OFF, the shooter's currently activated skill is used.

@arg SkillSpecification
@text Skill specification
@type struct<SkillSpecification>
@default {"SkillOrItem":"skill","SkillId":"1","SkillByName":"","SkillIdByVariable":"0","ItemId":"1","ItemByName":"","ItemIdByVariable":"0"}
@desc The skill/item whose effect (damage formula, elements, scope, etc.) will be applied on hit.

@arg OriginSpecification
@text Origin
@type struct<HitscanOriginSpecification>
@default {"Specification":"self","CustomPosition":"{\"X\":\"0\",\"XByVariable\":\"0\",\"Y\":\"0\",\"YByVariable\":\"0\"}","MuzzleOffset":"0","MuzzleOffsetByVariable":"0"}
@desc Where the shot originates from.

@arg AngleSpecification
@text Firing angle
@type struct<HitscanAngleSpecification>
@default {"Mode":"facing","Degree":"0","DegreeByVariable":"0","TargetCharacterSpecification":"{\"CharacterKind\":\"player\",\"CharacterKindByVariable\":\"0\",\"EventIdOrName\":\"1\",\"EventIdByVariable\":\"0\",\"FollowerIndex\":\"1\",\"FollowerIndexByVariable\":\"0\",\"VehicleKind\":\"boat\",\"VehicleKindByVariable\":\"0\"}","Offset":"0","OffsetByVariable":"0"}
@desc Which direction the shot travels in.

@arg Far
@text Range
@type number
@decimals 2
@default 0
@desc Maximum travel distance in dots. 0 means unlimited (spans the whole map).

@arg FarByVariable
@text Range (variable)
@type variable
@default 0
@desc Specify the range by variable instead. 0 disables this.

@arg Width
@text Beam width
@type number
@decimals 2
@default 1
@desc Width of the hit-test box carried along the line (dots).

@arg Height
@text Beam height
@type number
@decimals 2
@default 1
@desc Height of the hit-test box carried along the line (dots).

@arg PierceCount
@text Pierce count
@type number
@min 1
@default 1
@desc Number of battlers the shot can hit before stopping. 1 = stops at the first target (classic hitscan).

@arg IgnoreCharacterObstacles
@text Ignore Character Obstacles
@type boolean
@default false
@desc If ON, the shot passes through solid/blocking characters (it still stops at impassable terrain).

@arg ApplyDamage
@text Apply Damage
@type boolean
@default true
@desc If OFF, this command only reports what it would hit, without applying any effect (useful for laser-sight previews / AI decisions).

@arg HitResultSwitchId
@text Hit result switch
@type switch
@default 0
@desc Switch ID to turn ON if at least one valid target was struck, OFF otherwise. 0 disables this.

@arg BlockedSwitchId
@text Blocked switch
@type switch
@default 0
@desc Switch ID to turn ON if the shot was stopped by terrain/an obstacle without hitting any valid target. 0 disables this.

@arg HitCountVariableId
@text Hit count variable
@type variable
@default 0
@desc Variable ID to store how many valid targets were actually struck. 0 disables this.

@arg HitCharacterKindVariableId
@text First hit character kind variable
@type variable
@default 0
@desc Variable ID to store the character kind (1:player, 2:follower, 3:event, 4:vehicle) of the first target struck. 0 disables this.

@arg HitEventIdVariableId
@text First hit event ID variable
@type variable
@default 0
@desc Variable ID to store the event ID of the first target struck, if it is an event. 0 disables this.

@arg ImpactXVariableId
@text Impact X variable
@type variable
@default 0
@desc Variable ID to store the final X coordinate the shot reached (impact point, or where it stopped). 0 disables this.

@arg ImpactYVariableId
@text Impact Y variable
@type variable
@default 0
@desc Variable ID to store the final Y coordinate the shot reached. 0 disables this.

@arg FiringDegreeVariableId
@text Firing angle store variable
@type variable
@default 0
@desc Variable ID to store the exact angle (degrees, ARPG_Core convention) the shot was fired at. Useful for follow-up Character Blow Away. 0 disables this.

@arg DebugDraw
@text Debug Draw
@type boolean
@default false
@desc If ON, briefly draws the traced line on screen (debug aid only, no gameplay effect). See help.

@arg DebugDrawDuration
@text Debug Draw duration
@type number
@min 1
@default 60
@desc How many frames the debug line takes to fade out. 60 frames = about 1 second.

@command SetupHitscan
@text Setup Hitscan
@desc Starts firing the same Hitscan shot repeatedly, every X frames, until Stop Hitscan is called for the same shooter.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The character firing the shots. Calling Setup Hitscan again for this same shooter restarts/replaces its timer.

@arg Interval
@text Interval (frames)
@type number
@min 1
@default 30
@desc How many frames to wait between each shot. 60 frames = about 1 second.

@arg IntervalByVariable
@text Interval (variable)
@type variable
@default 0
@desc Specify the interval by variable instead. 0 disables this.

@arg FireImmediately
@text Fire Immediately
@type boolean
@default true
@desc If ON, the first shot fires right away when this command runs. If OFF, it waits one full interval before the first shot.

@arg IsSkillSpecification
@text Specify Skill
@type boolean
@default false
@desc If ON, the skill/item below is used. If OFF, the shooter's currently activated skill is used - re-checked on every shot.

@arg SkillSpecification
@text Skill specification
@type struct<SkillSpecification>
@default {"SkillOrItem":"skill","SkillId":"1","SkillByName":"","SkillIdByVariable":"0","ItemId":"1","ItemByName":"","ItemIdByVariable":"0"}
@desc The skill/item whose effect (damage formula, elements, scope, etc.) will be applied on each hit.

@arg OriginSpecification
@text Origin
@type struct<HitscanOriginSpecification>
@default {"Specification":"self","CustomPosition":"{\"X\":\"0\",\"XByVariable\":\"0\",\"Y\":\"0\",\"YByVariable\":\"0\"}","MuzzleOffset":"0","MuzzleOffsetByVariable":"0"}
@desc Where each shot originates from. Re-evaluated every shot (so "shooter's center" tracks a moving shooter).

@arg AngleSpecification
@text Firing angle
@type struct<HitscanAngleSpecification>
@default {"Mode":"facing","Degree":"0","DegreeByVariable":"0","TargetCharacterSpecification":"{\"CharacterKind\":\"player\",\"CharacterKindByVariable\":\"0\",\"EventIdOrName\":\"1\",\"EventIdByVariable\":\"0\",\"FollowerIndex\":\"1\",\"FollowerIndexByVariable\":\"0\",\"VehicleKind\":\"boat\",\"VehicleKindByVariable\":\"0\"}","Offset":"0","OffsetByVariable":"0"}
@desc Which direction each shot travels in. Re-evaluated every shot (so "toward a character" re-aims at a moving target).

@arg Far
@text Range
@type number
@decimals 2
@default 0
@desc Maximum travel distance in dots. 0 means unlimited (spans the whole map).

@arg FarByVariable
@text Range (variable)
@type variable
@default 0
@desc Specify the range by variable instead. 0 disables this.

@arg Width
@text Beam width
@type number
@decimals 2
@default 1
@desc Width of the hit-test box carried along the line (dots).

@arg Height
@text Beam height
@type number
@decimals 2
@default 1
@desc Height of the hit-test box carried along the line (dots).

@arg PierceCount
@text Pierce count
@type number
@min 1
@default 1
@desc Number of battlers each shot can hit before stopping. 1 = stops at the first target (classic hitscan).

@arg IgnoreCharacterObstacles
@text Ignore Character Obstacles
@type boolean
@default false
@desc If ON, shots pass through solid/blocking characters (they still stop at impassable terrain).

@arg ApplyDamage
@text Apply Damage
@type boolean
@default true
@desc If OFF, each shot only reports what it would hit, without applying any effect (useful for laser-sight previews / AI decisions).

@arg HitResultSwitchId
@text Hit result switch
@type switch
@default 0
@desc Switch ID to turn ON if at least one valid target was struck on the latest shot, OFF otherwise. 0 disables this.

@arg BlockedSwitchId
@text Blocked switch
@type switch
@default 0
@desc Switch ID to turn ON if the latest shot was stopped by terrain/an obstacle without hitting any valid target. 0 disables this.

@arg HitCountVariableId
@text Hit count variable
@type variable
@default 0
@desc Variable ID to store how many valid targets the latest shot struck. 0 disables this.

@arg HitCharacterKindVariableId
@text First hit character kind variable
@type variable
@default 0
@desc Variable ID to store the character kind (1:player, 2:follower, 3:event, 4:vehicle) of the first target the latest shot struck. 0 disables this.

@arg HitEventIdVariableId
@text First hit event ID variable
@type variable
@default 0
@desc Variable ID to store the event ID of the first target the latest shot struck, if it is an event. 0 disables this.

@arg ImpactXVariableId
@text Impact X variable
@type variable
@default 0
@desc Variable ID to store the final X coordinate the latest shot reached. 0 disables this.

@arg ImpactYVariableId
@text Impact Y variable
@type variable
@default 0
@desc Variable ID to store the final Y coordinate the latest shot reached. 0 disables this.

@arg FiringDegreeVariableId
@text Firing angle store variable
@type variable
@default 0
@desc Variable ID to store the exact angle (degrees, ARPG_Core convention) the latest shot was fired at. 0 disables this.

@arg DebugDraw
@text Debug Draw
@type boolean
@default false
@desc If ON, briefly draws each traced shot on screen (debug aid only, no gameplay effect). See help.

@arg DebugDrawDuration
@text Debug Draw duration
@type number
@min 1
@default 60
@desc How many frames the debug line takes to fade out. 60 frames = about 1 second.

@command StopHitscan
@text Stop Hitscan
@desc Stops a repeating shot previously started with Setup Hitscan for the same shooter. Does nothing if none is active.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The same shooter that was passed to Setup Hitscan.
*/
/*~struct~HitscanOriginSpecification:
@param Specification
@text Position specification
@type select
@option shooter's center
@value self
@option custom coordinates
@value custom
@default self
@desc Select where the shot's origin point is measured from before the muzzle offset is applied.

@param CustomPosition
@text custom coordinates
@type struct<Position>
@desc Used when "custom coordinates" is selected above.

@param MuzzleOffset
@text Muzzle offset
@type number
@decimals 2
@default 0
@desc Distance (dots) to push the origin forward along the firing angle, e.g. to avoid the shooter hitting itself.

@param MuzzleOffsetByVariable
@text Muzzle offset (variable)
@type variable
@default 0
@desc Specify the muzzle offset by variable instead. 0 disables this.
*/
/*~struct~HitscanAngleSpecification:
@param Mode
@text Angle mode
@type select
@option shooter's facing direction
@value facing
@option fixed angle
@value fixed
@option toward a character
@value toward
@option toward mouse cursor
@value towardMouse
@default facing
@desc Select how the firing angle is determined.

@param Degree
@text Angle
@type number
@decimals 2
@default 0
@desc Used when "fixed angle" is selected above (0 = up, 90 = right, 180 = down, 270 = left).

@param DegreeByVariable
@text Angle (variable)
@type variable
@default 0
@desc Specify the fixed angle by variable instead. 0 disables this.

@param TargetCharacterSpecification
@text Aim target
@type struct<CharacterSpecification>
@desc Used when "toward a character" is selected above.

@param Offset
@text Angle offset
@type number
@decimals 2
@default 0
@desc Added on top of the base angle above. Useful for spread/inaccuracy or firing several shots at different offsets.

@param OffsetByVariable
@text Angle offset (variable)
@type variable
@default 0
@desc Specify the angle offset by variable instead. 0 disables this.
*/

"use strict";
(() => {
    const ARPG_HitscanPluginName = document.currentScript
        ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1])
        : "ARPG_Hitscan";

    const arpgHitscanParams = PluginManager.parameters(ARPG_HitscanPluginName);
    const ARPG_HitscanDebugLogging = String(arpgHitscanParams['DebugLogging'] || 'false') === 'true';

    function arpgHitscanLog(...msgs) {
        if (ARPG_HitscanDebugLogging) console.log('[ARPG_Hitscan]', ...msgs);
    }

    // SelfVariable.js reserves switch/variable IDs whose database NAME
    // starts with its configured prefix as per-event "extended
    // self-switches"/"self variables". Writing one through the generic
    // $gameSwitches.setValue()/$gameVariables.setValue() path makes
    // SelfVariable.js GUESS which event it's for, from a "currently active
    // event" it tracks only while that event's own command (or move route)
    // is actively executing - which a repeating Setup Hitscan shot firing
    // from a background timer never is, so that guess fails and throws.
    //
    // We don't need SelfVariable.js to guess, though - we already KNOW
    // exactly which event fired this shot (subjectCharacter). SelfVariable.js
    // also exposes Game_Event#setExSelfSwitchValue()/#setSelfVariableValue(),
    // which write directly to a GIVEN event's own storage with no "currently
    // active event" lookup involved at all. So: if the output ID is one of
    // SelfVariable's reserved self-switch/self-variable IDs AND the shooter
    // is an event (self-switches/variables are inherently per-EVENT, so
    // there's no equivalent for the player/a follower/a vehicle), write
    // straight to that event instead of going through $gameSwitches/
    // $gameVariables at all. This also fixes a subtler pre-existing issue:
    // previously, calling "Hitscan" for one event from a DIFFERENT event's
    // command (e.g. a controller event shooting "on behalf of" a turret via
    // "specify event ID") would have attributed the self-switch to the
    // CALLING event rather than the actual shooter - this always attributes
    // it to the shooter, which is what you want.
    //
    // Falls back to a plain, try/caught $gameSwitches/$gameVariables write
    // for everything else (normal switches/variables, or a self-switch/
    // self-variable ID used with a non-event shooter) - one misconfigured
    // output shouldn't be able to silently kill results from an otherwise-
    // successful shot (the damage already landed by this point) or stop a
    // repeating timer forever, so that fallback still just warns on failure
    // instead of throwing.
    function arpgHitscanSetSwitchOutput(subjectCharacter, switchId, value, label) {
        if (subjectCharacter instanceof Game_Event &&
            typeof $gameSwitches.isExSelfSwitch === "function" &&
            $gameSwitches.isExSelfSwitch(switchId)) {
            subjectCharacter.setExSelfSwitchValue(switchId, value);
            return;
        }
        try {
            $gameSwitches.setValue(switchId, value);
        } catch (e) {
            console.warn(`[ARPG_Hitscan] Could not set ${label} (switch ${switchId}): ${e.message} ` +
                `This is a self-switch-prefixed switch being used with a non-event shooter (the player/a ` +
                `follower/a vehicle) - SelfVariable.js's self-switches only exist per EVENT, so there's no ` +
                `self-switch slot to write to here. Use a plain switch ID for this parameter instead.`);
        }
    }

    function arpgHitscanSetVariableOutput(subjectCharacter, variableId, value, label) {
        if (subjectCharacter instanceof Game_Event &&
            typeof $gameVariables.isSelfVariable === "function" &&
            $gameVariables.isSelfVariable(variableId)) {
            subjectCharacter.setSelfVariableValue(variableId, value);
            return;
        }
        try {
            $gameVariables.setValue(variableId, value);
        } catch (e) {
            console.warn(`[ARPG_Hitscan] Could not set ${label} (variable ${variableId}): ${e.message} ` +
                `This is a self-variable-prefixed variable being used with a non-event shooter (the player/a ` +
                `follower/a vehicle) - SelfVariable.js's self variables only exist per EVENT, so there's no ` +
                `self-variable slot to write to here. Use a plain variable ID for this parameter instead.`);
        }
    }

    // ---- Pull in the pieces ARPG_Core exports for other plugins to use. ----
    // NOTE: ARPG_Core.js temporarily overrides the global `require` while its own
    // IIFE runs, then restores it - so by the time this plugin runs, `require`
    // is back to normal. `simpleImport` (left as a permanent global by
    // ARPG_Core.js) is the supported way for addon plugins to reach its exports.
    function arpgImport(path) {
        if (typeof simpleImport !== "function") {
            throw new Error("ARPG_Hitscan: ARPG_Core.js was not found/loaded. Make sure ARPG_Hitscan.js is placed below ARPG_Core.js in the plugin list.");
        }
        const module = simpleImport(path);
        if (module == null) {
            throw new Error(`ARPG_Hitscan: could not import "${path}" from ARPG_Core. Make sure ARPG_Hitscan.js is placed below ARPG_Core.js in the plugin list.`);
        }
        return module;
    }

    const HitBox = arpgImport("ARPG_Core/HitBox/HitBox");
    const Degree = arpgImport("CommonLibrary/Degree/Degree");
    const ARPG_Utils = arpgImport("ARPG_Core/ARPG_Utils/ARPG_Utils");
    const PluginParamsParser = arpgImport("CommonLibrary/PluginParamsParser/PluginParamsParser");
    const DotMoveSystem = arpgImport("DotMoveSystem");

    // ---- Debug visualization: draw a fading line on screen for ~1 second. ----
    // Exposed globally so it can also be called from a "Script..." event
    // command or any other plugin: ARPG_HitscanDebug.showLine(x1, y1, x2, y2, opt)
    function arpgHitscanDebugScreenPoint(x, y) {
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        return [$gameMap.adjustX(x) * tw, $gameMap.adjustY(y) * th];
    }

    window.ARPG_HitscanDebug = {
        _pending: [],
        // x1,y1,x2,y2 are map coordinates in dots/tiles (same space as
        // positionPoint()/centerPositionPoint()), not screen pixels.
        showLine(x1, y1, x2, y2, opt = {}) {
            this._pending.push({
                x1, y1, x2, y2,
                color: opt.color != null ? opt.color : 0xff3333,
                markEnd: !!opt.markEnd,
                duration: Math.max(1, opt.duration != null ? opt.duration : 60)
            });
        }
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._arpgHitscanDebugLines = [];
        this._arpgHitscanDebugContainer = new PIXI.Container();
        this.addChild(this._arpgHitscanDebugContainer);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateArpgHitscanDebugLines();
    };

    Spriteset_Map.prototype.updateArpgHitscanDebugLines = function() {
        const pending = window.ARPG_HitscanDebug._pending;
        while (pending.length > 0) {
            const data = pending.shift();
            const graphics = new PIXI.Graphics();
            this._arpgHitscanDebugContainer.addChild(graphics);
            this._arpgHitscanDebugLines.push({ data, graphics, frame: 0 });
        }
        for (let i = this._arpgHitscanDebugLines.length - 1; i >= 0; i--) {
            const entry = this._arpgHitscanDebugLines[i];
            entry.frame++;
            const data = entry.data;
            const t = entry.frame / data.duration;
            if (t >= 1) {
                this._arpgHitscanDebugContainer.removeChild(entry.graphics);
                entry.graphics.destroy();
                this._arpgHitscanDebugLines.splice(i, 1);
                continue;
            }
            const [sx1, sy1] = arpgHitscanDebugScreenPoint(data.x1, data.y1);
            const [sx2, sy2] = arpgHitscanDebugScreenPoint(data.x2, data.y2);
            const alpha = 1 - t;
            const g = entry.graphics;
            g.clear();
            g.lineStyle(2, data.color, alpha);
            g.moveTo(sx1, sy1);
            g.lineTo(sx2, sy2);
            if (data.markEnd) {
                g.beginFill(data.color, alpha);
                g.drawCircle(sx2, sy2, 4);
                g.endFill();
            }
        }
    };

    // ---- Mouse aiming helper. ----
    // Like the engine's own Game_Map.canvasToMapX/Y, but without the
    // Math.floor() those use (they're built for tile-destination touch-move,
    // which needs a whole tile; aiming wants the continuous sub-tile point
    // instead so the angle doesn't "snap" between tiles).
    function arpgHitscanCanvasToMapPoint(canvasX, canvasY) {
        const tileWidth = $gameMap.tileWidth();
        const tileHeight = $gameMap.tileHeight();
        const rawX = ($gameMap._displayX * tileWidth + canvasX) / tileWidth;
        const rawY = ($gameMap._displayY * tileHeight + canvasY) / tileHeight;
        const mapX = $gameMap.roundX(rawX);
        const mapY = $gameMap.roundY(rawY);
        return new DotMoveSystem.DotMovePoint(mapX, mapY);
    }

    // ---- The probe that walks the line and looks for "damage" hit boxes. ----
    class ARPG_HitscanProbe extends Game_Character {
        initialize(...args) {
            super.initialize(...args);
            this.setNoCheckMapValid(true);
            this.setEnableWallSlide(false);
            this._ignoreCharacterObstacles = false;
            this._blocked = false;
        }

        setIgnoreCharacterObstacles(ignore) {
            this._ignoreCharacterObstacles = ignore;
        }

        isBlocked() {
            return this._blocked;
        }

        // Optional obstacle bypass. Falls back to whatever collision rule the
        // rest of the game already uses for character-vs-character blocking.
        checkCollisionTargetCharacter(x, y, d, character) {
            if (this._ignoreCharacterObstacles)
                return false;
            return Game_Character.prototype.checkCollisionTargetCharacter.call(this, x, y, d, character);
        }

        distancePerFrame() {
            return 1;
        }

        findHitOwnerAtCurrentPosition(excludeSet) {
            const results = this.checkHitCharacters(HitBox);
            for (const result of results) {
                const hitBox = result.targetObject;
                if (!(hitBox instanceof HitBox))
                    continue;
                if (hitBox.type !== "damage")
                    continue;
                if (!hitBox.isEnabled())
                    continue;
                const owner = hitBox.owner;
                if (excludeSet.has(owner))
                    continue;
                return owner;
            }
            return void 0;
        }

        // Walks from the current position along `deg` for up to `far` dots,
        // collecting up to `pierceCount` distinct battler owners whose damage
        // hit box the probe passes through. Stops early on invalid map
        // position or on a blocked movement step (wall/obstacle).
        cast(deg, far, pierceCount, excludeSet) {
            const hitOwners = [];
            let loopCount = 0;
            let remainFar = far;
            this._blocked = false;

            let owner = this.findHitOwnerAtCurrentPosition(excludeSet);
            if (owner) {
                hitOwners.push(owner);
                excludeSet.add(owner);
            }

            while (hitOwners.length < pierceCount) {
                if (++loopCount > 2000) {
                    throw new Error("ARPG_Hitscan: endless loop error");
                }
                const pos = this.positionPoint();
                if (!$gameMap.isValid(pos.x, pos.y)) {
                    break;
                }
                if (remainFar <= 0) {
                    break;
                }
                this.dotMoveByDeg(deg.value);
                if (!this.isMovementSucceeded()) {
                    this._blocked = true;
                    break;
                }
                remainFar -= this.distancePerFrame();
                owner = this.findHitOwnerAtCurrentPosition(excludeSet);
                if (owner) {
                    hitOwners.push(owner);
                    excludeSet.add(owner);
                }
            }
            return hitOwners;
        }
    }

    function resolveAngle(interpreter, subjectCharacter, angleSpec) {
        let deg;
        switch (angleSpec.Mode) {
            case "fixed": {
                const value = angleSpec.DegreeByVariable > 0
                    ? $gameVariables.value(angleSpec.DegreeByVariable)
                    : angleSpec.Degree;
                deg = new Degree(value);
                break;
            }
            case "toward": {
                const target = interpreter.findCharacterBySpecification(angleSpec.TargetCharacterSpecification);
                const calculated = subjectCharacter.centerPositionPoint().calcDeg(target.centerPositionPoint());
                deg = new Degree(calculated.value);
                break;
            }
            case "towardMouse": {
                const mousePoint = arpgHitscanCanvasToMapPoint(TouchInput.x, TouchInput.y);
                const calculated = subjectCharacter.centerPositionPoint().calcDeg(mousePoint);
                deg = new Degree(calculated.value);
                break;
            }
            case "facing":
            default:
                deg = Degree.fromDirection(subjectCharacter.direction());
                break;
        }
        const offset = angleSpec.OffsetByVariable > 0
            ? $gameVariables.value(angleSpec.OffsetByVariable)
            : angleSpec.Offset;
        if (offset) {
            deg = deg.add(offset);
        }
        return deg;
    }

    function resolveOrigin(subjectCharacter, originSpec, deg) {
        let pos;
        if (originSpec.Specification === "custom") {
            const x = originSpec.CustomPosition.XByVariable > 0
                ? $gameVariables.value(originSpec.CustomPosition.XByVariable)
                : originSpec.CustomPosition.X;
            const y = originSpec.CustomPosition.YByVariable > 0
                ? $gameVariables.value(originSpec.CustomPosition.YByVariable)
                : originSpec.CustomPosition.Y;
            pos = new DotMoveSystem.DotMovePoint(x, y);
        } else {
            pos = subjectCharacter.centerPositionPoint();
        }
        const muzzleOffset = originSpec.MuzzleOffsetByVariable > 0
            ? $gameVariables.value(originSpec.MuzzleOffsetByVariable)
            : originSpec.MuzzleOffset;
        if (muzzleOffset) {
            // ARPG_Core's Degree convention is a compass bearing: 0 = up,
            // 90 = right, 180 = down, 270 = left.
            const rad = deg.value * Math.PI / 180;
            pos = new DotMoveSystem.DotMovePoint(
                pos.x + Math.sin(rad) * muzzleOffset,
                pos.y - Math.cos(rad) * muzzleOffset
            );
        }
        return pos;
    }

    // Does the actual trace-and-apply work for a single shot. Shared by the
    // one-shot "Hitscan" command and the repeating scheduler below, so both
    // stay in sync by construction instead of by copy-pasting this logic.
    // `interpreter` only needs to expose findArpgSkillBySpecification() (used
    // when IsSkillSpecification is ON) - resolveAngle() also uses it for
    // "toward a character" targets. subjectCharacter is already resolved.
    // Returns true if a shot was actually attempted (shooter+skill valid),
    // false if it bailed out early (used by the scheduler to auto-stop a
    // repeating shot whose shooter has become invalid).
    function performHitscan(interpreter, subjectCharacter, params) {
        if (!subjectCharacter || !subjectCharacter.isBattler()) {
            console.log("ARPG_Hitscan: shooter is not a battler.");
            return false;
        }
        const subjectBattler = subjectCharacter.battler();

        let arpgSkill;
        if (params.IsSkillSpecification) {
            arpgSkill = interpreter.findArpgSkillBySpecification(params.SkillSpecification);
        } else {
            arpgSkill = subjectBattler.usingSkill;
        }
        if (!arpgSkill) {
            console.log("ARPG_Hitscan: no skill to apply. Activate a skill first, or turn on 'Specify Skill'.");
            return false;
        }

        const deg = resolveAngle(interpreter, subjectCharacter, params.AngleSpecification);
        const originPos = resolveOrigin(subjectCharacter, params.OriginSpecification, deg);

        let far = params.FarByVariable > 0 ? $gameVariables.value(params.FarByVariable) : params.Far;
        if (!(far > 0)) {
            far = $gameMap.width() + $gameMap.height();
        }

        const pierceCount = Math.max(1, Math.floor(params.PierceCount || 1));
        const width = params.Width > 0 ? params.Width : 1;
        const height = params.Height > 0 ? params.Height : 1;

        const probe = new ARPG_HitscanProbe();
        // setPositionPoint()/positionPoint() track the box's top-left corner
        // (matching HitBox's Rectangle(x, y, width, height) convention), but
        // `originPos` is a CENTER point (subjectCharacter.centerPositionPoint(),
        // or the custom point, plus the muzzle offset). Convert center -> top
        // left here, the same way ARPG_Core's own "TransparentObjectCast"
        // command does it - otherwise the probe's hit-test box ends up shifted
        // half a tile down-and-right of where it should be, which makes shots
        // fired right/down stop a tile early and shots fired left/up travel a
        // tile too far.
        probe.setPositionPoint(new DotMoveSystem.DotMovePoint(originPos.x - width / 2, originPos.y - height / 2));
        probe.setWidth(width);
        probe.setHeight(height);
        probe.setIgnoreCharacterObstacles(!!params.IgnoreCharacterObstacles);

        const excludeSet = new Set([subjectCharacter]);
        const prevTransparentObject = $gameMap._transparentObject;
        $gameMap._transparentObject = probe;
        $gameTemp.removeUnusedCache();

        let hitOwners = [];
        try {
            hitOwners = probe.cast(deg, far, pierceCount, excludeSet);
        } finally {
            $gameMap._transparentObject = prevTransparentObject;
            $gameTemp.removeUnusedCache();
        }

        const validHits = [];
        for (const owner of hitOwners) {
            if (!owner || !owner.isBattler())
                continue;
            const targetBattler = owner.battler();
            if (targetBattler.isDead())
                continue;
            if (!targetBattler.checkTargetBattler(subjectBattler, arpgSkill))
                continue;
            if (params.ApplyDamage) {
                subjectBattler.applyCollideDamageEffectToTarget(targetBattler, arpgSkill);
            }
            validHits.push(owner);
        }

        if (params.HitResultSwitchId > 0) {
            arpgHitscanSetSwitchOutput(subjectCharacter, params.HitResultSwitchId, validHits.length > 0, "Hit result switch");
        }
        if (params.BlockedSwitchId > 0) {
            arpgHitscanSetSwitchOutput(subjectCharacter, params.BlockedSwitchId,
                probe.isBlocked() && validHits.length === 0, "Blocked switch");
        }
        if (params.HitCountVariableId > 0) {
            arpgHitscanSetVariableOutput(subjectCharacter, params.HitCountVariableId, validHits.length, "Hit count variable");
        }
        const firstHit = validHits[0];
        if (firstHit) {
            if (params.HitCharacterKindVariableId > 0) {
                arpgHitscanSetVariableOutput(subjectCharacter, params.HitCharacterKindVariableId,
                    ARPG_Utils.characterKindValue(firstHit), "First hit character kind variable");
            }
            if (params.HitEventIdVariableId > 0 && firstHit instanceof Game_Event) {
                arpgHitscanSetVariableOutput(subjectCharacter, params.HitEventIdVariableId,
                    firstHit.eventId(), "First hit event ID variable");
            }
        }
        const impactPos = probe.centerPositionPoint();
        if (params.ImpactXVariableId > 0) {
            arpgHitscanSetVariableOutput(subjectCharacter, params.ImpactXVariableId, impactPos.x, "Impact X variable");
        }
        if (params.ImpactYVariableId > 0) {
            arpgHitscanSetVariableOutput(subjectCharacter, params.ImpactYVariableId, impactPos.y, "Impact Y variable");
        }
        if (params.FiringDegreeVariableId > 0) {
            arpgHitscanSetVariableOutput(subjectCharacter, params.FiringDegreeVariableId, deg.value, "Firing angle store variable");
        }

        if (params.DebugDraw) {
            const color = validHits.length > 0 ? 0xff3333 : (probe.isBlocked() ? 0xffaa00 : 0x33ff33);
            window.ARPG_HitscanDebug.showLine(originPos.x, originPos.y, impactPos.x, impactPos.y, {
                color,
                markEnd: validHits.length > 0,
                duration: params.DebugDrawDuration > 0 ? params.DebugDrawDuration : 60
            });
        }
        return true;
    }

    PluginManager.registerCommand(ARPG_HitscanPluginName, "Hitscan", function(args) {
        const params = PluginParamsParser.parse(args);
        const subjectCharacter = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
        performHitscan(this, subjectCharacter, params);
    });

    // ---- Repeating fire: "Setup Hitscan" / "Stop Hitscan". ----
    // One active timer per shooter (Game_Character instance used as the Map
    // key), so starting a new one for the same shooter replaces the old one
    // rather than stacking. Deliberately NOT part of save data - cleared on
    // every map change, and simply won't exist anymore after a load (see
    // help). Ticks once per map frame while the map scene is active, exactly
    // like Game_Map's own interpreter update, so it naturally pauses during
    // messages/menus/battle instead of needing its own pause handling.
    // Human-readable label for a character, for log lines only.
    function arpgHitscanCharacterLabel(character) {
        if (!character) return 'null';
        if (character === $gamePlayer) return 'player';
        if (typeof Game_Follower !== 'undefined' && character instanceof Game_Follower) {
            return `follower(memberIndex=${character._memberIndex})`;
        }
        if (character instanceof Game_Event) {
            return `event ${character.eventId()}`;
        }
        if (typeof Game_Vehicle !== 'undefined' && character instanceof Game_Vehicle) {
            return `vehicle(${character._type})`;
        }
        return character.constructor ? character.constructor.name : String(character);
    }

    const ARPG_HitscanScheduler = {
        _entries: new Map(), // Game_Character -> { interpreter, params, interval, counter }

        start(subjectCharacter, interpreter, params, interval) {
            const replacing = this._entries.has(subjectCharacter);
            this._entries.set(subjectCharacter, { interpreter, params, interval, counter: interval });
            arpgHitscanLog(`SetupHitscan: ${replacing ? 'REPLACED' : 'STARTED'} timer for ` +
                `${arpgHitscanCharacterLabel(subjectCharacter)}, interval=${interval} frames.`);
        },

        stop(subjectCharacter) {
            const existed = this._entries.delete(subjectCharacter);
            if (existed) {
                arpgHitscanLog(`StopHitscan: stopped timer for ${arpgHitscanCharacterLabel(subjectCharacter)}.`);
            } else if (ARPG_HitscanDebugLogging) {
                console.warn(`[ARPG_Hitscan] StopHitscan: no active timer found for ` +
                    `${arpgHitscanCharacterLabel(subjectCharacter)}. If you expected one to be running, ` +
                    `check that this Shooter specification resolves to the SAME character Setup Hitscan ` +
                    `used (run ARPG_HitscanDebug.listActive() to see what's actually active).`);
            }
            return existed;
        },

        isActive(subjectCharacter) {
            return this._entries.has(subjectCharacter);
        },

        clear() {
            if (this._entries.size > 0) {
                arpgHitscanLog(`clearing ${this._entries.size} active timer(s) (map change).`);
            }
            this._entries.clear();
        },

        fireNow(subjectCharacter) {
            const entry = this._entries.get(subjectCharacter);
            if (entry) {
                this._fire(subjectCharacter, entry);
            }
        },

        update() {
            if (this._entries.size === 0) return;
            for (const [subjectCharacter, entry] of this._entries) {
                if (--entry.counter > 0) continue;
                entry.counter = entry.interval;
                this._fire(subjectCharacter, entry);
            }
        },

        _fire(subjectCharacter, entry) {
            if (!subjectCharacter || !subjectCharacter.isBattler || !subjectCharacter.isBattler()) {
                console.log("ARPG_Hitscan (repeating): shooter is no longer a valid battler - stopping.");
                this._entries.delete(subjectCharacter);
                return;
            }
            arpgHitscanLog(`firing repeating shot for ${arpgHitscanCharacterLabel(subjectCharacter)}.`);
            try {
                const ok = performHitscan(entry.interpreter, subjectCharacter, entry.params);
                if (!ok) {
                    arpgHitscanLog(`  -> shot was skipped (see the warning above: invalid shooter/no skill). ` +
                        `Timer is still running and will try again next interval.`);
                }
            } catch (e) {
                console.error("ARPG_Hitscan (repeating): error while firing - stopping this timer.", e);
                this._entries.delete(subjectCharacter);
            }
        },

        // Debug helper: prints every shooter with an active timer, its
        // interval, and frames remaining until its next shot.
        listActive() {
            if (this._entries.size === 0) {
                console.log('[ARPG_Hitscan] No repeating hitscans are currently active.');
                return;
            }
            console.log(`[ARPG_Hitscan] ${this._entries.size} active repeating hitscan(s):`);
            for (const [subjectCharacter, entry] of this._entries) {
                console.log(`  - ${arpgHitscanCharacterLabel(subjectCharacter)}: ` +
                    `interval=${entry.interval} frames, next shot in ${entry.counter} frame(s).`);
            }
        }
    };

    window.ARPG_HitscanDebug.listActive = () => ARPG_HitscanScheduler.listActive();

    const _ARPG_Hitscan_Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _ARPG_Hitscan_Game_Map_setup.call(this, mapId);
        ARPG_HitscanScheduler.clear();
    };

    const _ARPG_Hitscan_Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _ARPG_Hitscan_Game_Map_update.call(this, sceneActive);
        if (sceneActive) {
            ARPG_HitscanScheduler.update();
        }
    };

    PluginManager.registerCommand(ARPG_HitscanPluginName, "SetupHitscan", function(args) {
        const params = PluginParamsParser.parse(args);
        arpgHitscanLog('SetupHitscan called with spec:', params.SubjectCharacterSpecification);
        const subjectCharacter = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
        if (!subjectCharacter) {
            console.warn("[ARPG_Hitscan] Setup Hitscan: could not resolve the shooter character from the " +
                "given specification - no timer was started.");
            return;
        }
        const interval = Math.max(1, Math.floor(
            params.IntervalByVariable > 0 ? $gameVariables.value(params.IntervalByVariable) : params.Interval
        ));
        ARPG_HitscanScheduler.start(subjectCharacter, this, params, interval);
        if (params.FireImmediately) {
            ARPG_HitscanScheduler.fireNow(subjectCharacter);
        }
    });

    PluginManager.registerCommand(ARPG_HitscanPluginName, "StopHitscan", function(args) {
        const params = PluginParamsParser.parse(args);
        arpgHitscanLog('StopHitscan called with spec:', params.SubjectCharacterSpecification);
        const subjectCharacter = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
        if (!subjectCharacter) {
            console.warn("[ARPG_Hitscan] Stop Hitscan: could not resolve the shooter character from the " +
                "given specification - nothing was stopped.");
            return;
        }
        ARPG_HitscanScheduler.stop(subjectCharacter);
    });
})();
