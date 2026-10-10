/*:
@target MZ
@plugindesc ARPG_Ammo v1.0.0 - Simple per-weapon clip/reserve ammo system for ARPG_Core
@author Claude
@base ARPG_Core
@orderAfter ARPG_Core

@help
【Summary】
This plugin is an addon for ARPG_Core (by unagi ootoro). It adds a simple
clip/reserve ammo system tied to an actor's currently equipped weapon:
each weapon can define a clip capacity, a reserve capacity, and which
item represents its ammo (for display purposes, e.g. an icon in a HUD).
Three plugin commands let you check, reload, and consume that ammo.

Ammo tracking is per actor *and* per weapon: switching weapons keeps
each weapon's own clip/reserve counts intact, and a weapon's ammo state
persists with the save file.

■ Required Plug-ins
This plugin requires ARPG_Core.js. Place ARPG_Ammo.js below ARPG_Core.js
in the plugin list. It does not require ARPG_Hitscan.js, but the two are
designed to be used together (Consume Ammo -> Hitscan).

■ Setting up a weapon
In a Weapon's note box, add:

  <AmmoClipCapacity:30>
  <AmmoReserveCapacity:120>
  <AmmoItem:7>

- AmmoClipCapacity: how much ammo the clip/magazine holds.
- AmmoReserveCapacity: how much spare ammo can be carried for it.
- AmmoItem: (optional) the database Item ID that represents this
  weapon's ammo. This plugin never touches that item's party inventory
  count by itself - it's only there for you to look up its name/icon
  (via $dataItems[id]) when drawing a HUD. See "Check Ammo" below.

A weapon with no <AmmoClipCapacity:x> tag is treated as having
unlimited ammo by all three commands below (so it's safe to always run
Consume Ammo before firing, even for melee weapons or unarmed attacks -
it will simply always succeed and do nothing).

A fresh weapon (one that has never been checked/reloaded/fired yet)
starts out with both its clip and reserve completely full.

■ Check Ammo
Reports the shooter's current weapon's clip and reserve counts (and,
optionally, its capacities and ammo item ID) into variables. If the
equipped weapon has no ammo tags (or there is no weapon equipped), the
clip/reserve/capacity variables are set to -1 and the ammo item ID
variable is set to 0, so you can tell "unlimited" apart from "empty".

■ Reload Ammo
Moves ammo from reserve into the clip, up to the clip's capacity
(bounded by however much reserve is actually available - a partial
reload is possible if reserve runs out first). Turns the result switch
ON only if any ammo actually moved (so you can skip the reload
animation/sfx if the clip was already full or reserve was empty).

■ Consume Ammo
Spends a given amount of ammo from the clip - typically called once
per shot, right before (or after) firing. If the clip does not have
enough ammo, nothing is consumed and the result switch is turned OFF,
so your action common event can branch to a "dry fire"/empty click
instead of actually firing:

  Consume Ammo (Amount: 1) -> stores result in Switch A
  If Switch A is ON
      Activate Skill
      Hitscan
  Else
      (play an empty-clip sound effect)

■ Limitations
Ammo is tracked against the actor's first equipped weapon slot only
(Game_Actor.weapons()[0]) - dual-wielding actors track ammo for
whichever weapon occupies that first slot. This system is for Actor
battlers only; Enemy battlers do not have equippable weapons in
RPG Maker's data model, so these commands do nothing for them.

■ For plugin/script authors (e.g. a HUD)
This plugin exports a small read-only helper other plugins can use to
display ammo without needing to know this plugin's internal storage
format:

  const getAmmoInfo = simpleImport("ARPG_Ammo/arpgAmmoInfo");
  const info = getAmmoInfo(gameActor); // a Game_Actor instance
  // info is null if there's no weapon equipped, or it doesn't track ammo.
  // Otherwise: { weaponId, clip, reserve, clipCapacity, reserveCapacity, ammoItemId }

@command CheckAmmo
@text Check Ammo
@desc Reports the current weapon's clip/reserve ammo into variables.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The battler whose equipped weapon should be checked.

@arg HasAmmoSwitchId
@text Has ammo tracking switch
@type switch
@default 0
@desc Switch ID to turn ON if the equipped weapon tracks ammo, OFF if it's unlimited (no ammo tags, or no weapon equipped). 0 disables this.

@arg ClipVariableId
@text Clip amount variable
@type variable
@default 0
@desc Variable ID to store the current clip amount (-1 if unlimited). 0 disables this.

@arg ReserveVariableId
@text Reserve amount variable
@type variable
@default 0
@desc Variable ID to store the current reserve amount (-1 if unlimited). 0 disables this.

@arg ClipCapacityVariableId
@text Clip capacity variable
@type variable
@default 0
@desc Variable ID to store the weapon's clip capacity (-1 if unlimited). 0 disables this.

@arg ReserveCapacityVariableId
@text Reserve capacity variable
@type variable
@default 0
@desc Variable ID to store the weapon's reserve capacity (-1 if unlimited). 0 disables this.

@arg AmmoItemIdVariableId
@text Ammo item ID variable
@type variable
@default 0
@desc Variable ID to store the weapon's <AmmoItem:x> item ID (0 if unlimited/not set). 0 disables this.

@command ReloadAmmo
@text Reload Ammo
@desc Moves ammo from reserve into the clip, up to capacity.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The battler whose equipped weapon should be reloaded.

@arg ReloadedSwitchId
@text Reloaded switch
@type switch
@default 0
@desc Switch ID to turn ON if any ammo was actually moved from reserve to clip, OFF otherwise (e.g. clip already full, or reserve empty). 0 disables this.

@arg ClipVariableId
@text Clip amount variable
@type variable
@default 0
@desc Variable ID to store the clip amount after reloading (-1 if unlimited). 0 disables this.

@arg ReserveVariableId
@text Reserve amount variable
@type variable
@default 0
@desc Variable ID to store the reserve amount after reloading (-1 if unlimited). 0 disables this.

@command ConsumeAmmo
@text Consume Ammo
@desc Spends ammo from the clip. Fails (without consuming anything) if the clip doesn't have enough.

@arg SubjectCharacterSpecification
@text Shooter
@type struct<CharacterSpecification>
@default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
@desc The battler whose equipped weapon's ammo should be consumed.

@arg Amount
@text Amount
@type number
@min 0
@default 1
@desc How much ammo to consume from the clip.

@arg AmountByVariable
@text Amount (variable)
@type variable
@default 0
@desc Specify the amount by variable instead. 0 disables this.

@arg SuccessSwitchId
@text Success switch
@type switch
@default 0
@desc Switch ID to turn ON if the ammo was successfully consumed (or the weapon is unlimited), OFF if the clip didn't have enough. 0 disables this.

@arg ClipVariableId
@text Clip amount variable
@type variable
@default 0
@desc Variable ID to store the clip amount after consuming (-1 if unlimited). 0 disables this.

@arg ReserveVariableId
@text Reserve amount variable
@type variable
@default 0
@desc Variable ID to store the current reserve amount (-1 if unlimited, unaffected by consuming). 0 disables this.
*/

"use strict";
(() => {
    const ARPG_AmmoPluginName = document.currentScript
        ? decodeURIComponent(document.currentScript.src.match(/^.*\/(.+)\.js$/)[1])
        : "ARPG_Ammo";

    // NOTE: `simpleImport` is left behind as a permanent global by ARPG_Core.js
    // (unlike `require`, which it restores after its own IIFE finishes), so
    // it's the supported way for addon plugins to reach ARPG_Core's exports.
    function arpgImport(path) {
        if (typeof simpleImport !== "function") {
            throw new Error("ARPG_Ammo: ARPG_Core.js was not found/loaded. Make sure ARPG_Ammo.js is placed below ARPG_Core.js in the plugin list.");
        }
        const module = simpleImport(path);
        if (module == null) {
            throw new Error(`ARPG_Ammo: could not import "${path}" from ARPG_Core. Make sure ARPG_Ammo.js is placed below ARPG_Core.js in the plugin list.`);
        }
        return module;
    }

    const PluginParamsParser = arpgImport("CommonLibrary/PluginParamsParser/PluginParamsParser");

    // ---- Persistent per-weapon ammo storage on Game_Actor (saved automatically with the save file). ----
    const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        _Game_Actor_initMembers.call(this);
        this._arpgAmmo = {};
    };

    // Reads a weapon's ammo note tags. Returns null if the weapon doesn't
    // define <AmmoClipCapacity:x> (treated as "unlimited ammo").
    function arpgAmmoConfig(weapon) {
        if (!weapon || !weapon.meta)
            return null;
        const clipCapacity = Number(weapon.meta.AmmoClipCapacity);
        if (!(clipCapacity > 0))
            return null;
        const reserveCapacity = Number(weapon.meta.AmmoReserveCapacity);
        const ammoItemId = Number(weapon.meta.AmmoItem);
        return {
            clipCapacity,
            reserveCapacity: reserveCapacity > 0 ? reserveCapacity : 0,
            ammoItemId: ammoItemId > 0 ? ammoItemId : 0
        };
    }

    // Lazily creates (starting full) and returns the {clip, reserve} state
    // for a specific actor+weapon pair.
    function arpgAmmoState(gameActor, weapon, config) {
        if (!gameActor._arpgAmmo) {
            gameActor._arpgAmmo = {};
        }
        const key = String(weapon.id);
        let state = gameActor._arpgAmmo[key];
        if (!state) {
            state = { clip: config.clipCapacity, reserve: config.reserveCapacity };
            gameActor._arpgAmmo[key] = state;
        }
        return state;
    }

    // Resolves { gameActor, weapon, config, state } for a character
    // specification, or null if the subject isn't an actor battler at all.
    // `config`/`state` are null when the weapon (or lack thereof) means
    // "unlimited ammo".
    function resolveAmmoContext(interpreter, characterSpecification) {
        const character = interpreter.findCharacterBySpecification(characterSpecification);
        if (!character || !character.isBattler())
            return null;
        const arpgBattler = character.battler();
        if (!arpgBattler.isActor())
            return null;
        const gameActor = arpgBattler.actor();
        return arpgAmmoContextForActor(gameActor);
    }

    // Shared by resolveAmmoContext (plugin commands) and arpgAmmoInfo (below).
    function arpgAmmoContextForActor(gameActor) {
        const weapon = gameActor.weapons()[0];
        if (!weapon) {
            return { gameActor, weapon: null, config: null, state: null };
        }
        const config = arpgAmmoConfig(weapon);
        if (!config) {
            return { gameActor, weapon, config: null, state: null };
        }
        const state = arpgAmmoState(gameActor, weapon, config);
        return { gameActor, weapon, config, state };
    }

    // Public read-only helper for other plugins (e.g. a HUD) to display a
    // Game_Actor's current weapon ammo, without needing to know this
    // plugin's internal storage format. Returns null if the actor has no
    // equipped weapon, or its weapon doesn't track ammo (unlimited).
    function arpgAmmoInfo(gameActor) {
        if (!gameActor)
            return null;
        const ctx = arpgAmmoContextForActor(gameActor);
        if (!ctx.config)
            return null;
        return {
            weaponId: ctx.weapon.id,
            clip: ctx.state.clip,
            reserve: ctx.state.reserve,
            clipCapacity: ctx.config.clipCapacity,
            reserveCapacity: ctx.config.reserveCapacity,
            ammoItemId: ctx.config.ammoItemId
        };
    }
    simpleExport("ARPG_Ammo/arpgAmmoInfo", arpgAmmoInfo);

    PluginManager.registerCommand(ARPG_AmmoPluginName, "CheckAmmo", function(args) {
        const params = PluginParamsParser.parse(args);
        const ctx = resolveAmmoContext(this, params.SubjectCharacterSpecification);
        if (!ctx) {
            console.log("ARPG_Ammo: shooter is not an actor battler.");
            return;
        }
        const hasAmmo = !!ctx.config;
        if (params.HasAmmoSwitchId > 0) {
            $gameSwitches.setValue(params.HasAmmoSwitchId, hasAmmo);
        }
        if (params.ClipVariableId > 0) {
            $gameVariables.setValue(params.ClipVariableId, hasAmmo ? ctx.state.clip : -1);
        }
        if (params.ReserveVariableId > 0) {
            $gameVariables.setValue(params.ReserveVariableId, hasAmmo ? ctx.state.reserve : -1);
        }
        if (params.ClipCapacityVariableId > 0) {
            $gameVariables.setValue(params.ClipCapacityVariableId, hasAmmo ? ctx.config.clipCapacity : -1);
        }
        if (params.ReserveCapacityVariableId > 0) {
            $gameVariables.setValue(params.ReserveCapacityVariableId, hasAmmo ? ctx.config.reserveCapacity : -1);
        }
        if (params.AmmoItemIdVariableId > 0) {
            $gameVariables.setValue(params.AmmoItemIdVariableId, hasAmmo ? ctx.config.ammoItemId : 0);
        }
    });

    PluginManager.registerCommand(ARPG_AmmoPluginName, "ReloadAmmo", function(args) {
        const params = PluginParamsParser.parse(args);
        const ctx = resolveAmmoContext(this, params.SubjectCharacterSpecification);
        if (!ctx) {
            console.log("ARPG_Ammo: shooter is not an actor battler.");
            return;
        }
        let reloaded = false;
        if (ctx.config) {
            const needed = ctx.config.clipCapacity - ctx.state.clip;
            const moved = Math.max(0, Math.min(needed, ctx.state.reserve));
            if (moved > 0) {
                ctx.state.clip += moved;
                ctx.state.reserve -= moved;
                reloaded = true;
            }
        }
        if (params.ReloadedSwitchId > 0) {
            $gameSwitches.setValue(params.ReloadedSwitchId, reloaded);
        }
        if (params.ClipVariableId > 0) {
            $gameVariables.setValue(params.ClipVariableId, ctx.config ? ctx.state.clip : -1);
        }
        if (params.ReserveVariableId > 0) {
            $gameVariables.setValue(params.ReserveVariableId, ctx.config ? ctx.state.reserve : -1);
        }
    });

    PluginManager.registerCommand(ARPG_AmmoPluginName, "ConsumeAmmo", function(args) {
        const params = PluginParamsParser.parse(args);
        const ctx = resolveAmmoContext(this, params.SubjectCharacterSpecification);
        if (!ctx) {
            console.log("ARPG_Ammo: shooter is not an actor battler.");
            return;
        }
        const rawAmount = params.AmountByVariable > 0 ? $gameVariables.value(params.AmountByVariable) : params.Amount;
        const amount = Math.max(0, Math.floor(rawAmount || 0));

        let success;
        if (!ctx.config) {
            success = true;
        } else if (ctx.state.clip >= amount) {
            ctx.state.clip -= amount;
            success = true;
        } else {
            success = false;
        }

        if (params.SuccessSwitchId > 0) {
            $gameSwitches.setValue(params.SuccessSwitchId, success);
        }
        if (params.ClipVariableId > 0) {
            $gameVariables.setValue(params.ClipVariableId, ctx.config ? ctx.state.clip : -1);
        }
        if (params.ReserveVariableId > 0) {
            $gameVariables.setValue(params.ReserveVariableId, ctx.config ? ctx.state.reserve : -1);
        }
    });
})();
