//=============================================================================
// MG_SurvivalInventory.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc v2.2.0 Limited survival-horror inventory: slot-grid inventory with large icons, Assign (shortcut bar), Combine, Discard, a shared Chest, an unlimited Document Archive, and native unlimited Key Items.
 * @author MGraymoon
 *
 * @param maxSlots
 * @text Max Inventory Slots
 * @desc Number of slots in the limited inventory. Puzzle Items, Consumables, Weapons and Ammo all draw from this pool.
 * @type number
 * @min 1
 * @default 10
 *
 * @param defaultStackMax
 * @text Default Stack Max
 * @desc How many of one item can sit in a single slot by default. Override per item with <stackMax:N> in its Note box.
 * @type number
 * @min 1
 * @default 99
 *
 * @param gridColumns
 * @text Grid Columns
 * @desc How many columns the inventory/chest grids use.
 * @type number
 * @min 1
 * @default 5
 *
 * @param chestMaxSlots
 * @text Chest Max Slots
 * @desc Number of slots in the shared chest/storage box. Set high for an effectively-unlimited chest.
 * @type number
 * @min 1
 * @default 50
 *
 * @param addDocumentsCommand
 * @text Add "Documents" to Main Menu
 * @desc If ON, adds a "Documents" command to the main menu that opens the Document Archive.
 * @type boolean
 * @default true
 *
 * @param documentsCommandName
 * @text "Documents" Command Text
 * @desc The label shown in the main menu for the Document Archive.
 * @type string
 * @default Documents
 *
 * @param inventoryFullMessage
 * @text Inventory Full Message
 * @desc Text shown (via $gameMessage) when an item can't be picked up because the limited inventory is full.
 * @type string
 * @default Inventory is full. Leave something behind first.
 *
 * @param discardConfirmText
 * @text Discard Confirm Text
 * @desc Text shown in the Yes/No confirmation before discarding an item.
 * @type string
 * @default Discard this item? It cannot be undone.
 *
 * @command resetLimitedInventory
 * @text Reset Limited Inventory
 * @desc Empties the limited inventory (Puzzle Items, Consumables, Weapons, Ammo). Documents, Key Items, and the Chest are untouched. Call this on cycle transitions.
 *
 * @command checkInventoryFull
 * @text Check If Inventory Is Full
 * @desc Stores 1 in the given variable if the limited inventory has 0 free slots, 0 otherwise.
 * @arg variableId
 * @text Variable
 * @type variable
 * @default 1
 *
 * @command openChest
 * @text Open Chest
 * @desc Opens the shared Chest scene. Call this from a map event when the player interacts with a storage chest/box.
 *
 * @help
 *============================================================================
 * MG_SurvivalInventory.js
 *============================================================================
 * Built for a limited-inventory survival-horror design:
 *
 *   - Puzzle Items, Consumables, Weapons and Ammo share ONE limited pool of
 *     slots, shown as a grid of large icons. One slot = one distinct item,
 *     regardless of how many of it you're carrying (up to its stack max).
 *     Slots are positionally STABLE - an item stays in the same grid cell
 *     until you discard it or move it to the chest, it doesn't re-sort.
 *   - Documents are unlimited and live in their own Document Archive,
 *     opened from the main menu. They never take inventory space and never
 *     appear in the normal item list.
 *   - Permanent Key Items use RPG Maker's native "Key Item" item type
 *     (set this in the database's Item Type dropdown) and are automatically
 *     unlimited and excluded from the slot count - no tag needed. They show
 *     in their own "Key Items" tab in the Inventory scene.
 *   - A shared Chest (one global storage pool, like a classic item box) can
 *     store/retrieve anything that takes a slot. Open it from a map event
 *     with the "Open Chest" plugin command.
 *
 *----------------------------------------------------------------------------
 * COMPATIBILITY
 *----------------------------------------------------------------------------
 * This plugin aliases Scene_Item.create (and other hooks) rather than
 * replacing them, so it coexists with other plugins that also extend
 * Scene_Item (e.g. action-shortcut plugins), regardless of plugin load
 * order. All custom window/scene classes use an "MG" prefix and all new
 * Scene_Item methods use an "mg" prefix to avoid name collisions with
 * other plugins' own additions.
 *
 *----------------------------------------------------------------------------
 * NOTETAGS (Items, Weapons, and Armors note box)
 *----------------------------------------------------------------------------
 *   <category:puzzle>       Puzzle Item     - takes a limited-inventory slot
 *   <category:consumable>   Consumable      - takes a slot, stacks normally
 *   <category:weapon>       Weapon          - takes a slot
 *   <category:ammo>         Ammo            - takes a slot, stacks normally
 *   <category:document>     Document        - goes to the unlimited Document
 *                                              Archive, never touches the
 *                                              limited inventory
 *
 *   Anything without a <category:x> tag defaults to "consumable" behavior,
 *   EXCEPT native Key Item-type Items, which are always treated as
 *   permanent key items regardless of any category tag.
 *
 *   <stackMax:30>             Overrides how many of this item fit in one
 *                              slot. If omitted, uses the "Default Stack
 *                              Max" parameter.
 *
 *   <combine:A+B>             Put this on the RESULT item. Combining item A
 *                              and item B (database Item IDs, either order)
 *                              consumes one of each and creates this item.
 *                              Use several tags for several recipes, e.g.
 *                              <combine:5+6> <combine:5+7>. Items only
 *                              (not weapons/armor).
 *   <combineQty:N>            How many of the result item one combine makes.
 *                              Default 1.
 *
 *   <action: ...>             (ARPG_Core tag) Items with this tag can be put
 *                              on the shortcut bar with "Assign".
 *
 *   <cannotDiscard>           This item cannot be discarded from the
 *                              inventory - the Discard option is hidden for
 *                              it. Use this for story-critical items you
 *                              never want the player to accidentally lose.
 *                              (It can still be moved to/from the Chest.)
 *
 *   <documentText>
 *   Multi-line document body text goes here. Supports the same escape
 *   codes as normal RPG Maker message text (\C[n], \I[n], etc).
 *   </documentText>
 *                              Optional, Document-category items only. If
 *                              omitted, the Document Archive falls back to
 *                              showing the item's normal Description field.
 *
 *----------------------------------------------------------------------------
 * ITEM MENU ACTIONS
 *----------------------------------------------------------------------------
 *   Use      - as before.
 *   Assign   - puts the item on the ARPG_ItemShortcut bar (requires
 *              ARPG_ItemShortcut, and the item needs an <action: ...> tag).
 *              Pick a slot with Confirm; Shift clears a slot.
 *   Combine  - pick a second item in the grid. If a <combine:A+B> recipe
 *              exists for the pair, one of each is consumed and the result
 *              appears (in the first item's slot when possible). The help
 *              bar previews the result while you move the cursor. Disabled
 *              when nothing in the inventory can be combined with the item.
 *   Discard  - as before.
 *
 *----------------------------------------------------------------------------
 * PLUGIN COMMANDS
 *----------------------------------------------------------------------------
 *   Reset Limited Inventory    - call this on a cycle transition. Clears
 *                                 Puzzle Items / Consumables / Weapons /
 *                                 Ammo. Documents, Key Items, and the Chest
 *                                 persist.
 *   Check If Inventory Is Full - writes 1/0 into a variable so events can
 *                                 branch on it before a pickup.
 *   Open Chest                 - opens the shared Chest scene. Call this
 *                                 from a map event's Plugin Command action
 *                                 when the player interacts with a chest.
 *
 *----------------------------------------------------------------------------
 * SCRIPT CALLS
 *----------------------------------------------------------------------------
 *   $gameParty.survivalSlotsUsed()       -> inventory slots currently used
 *   $gameParty.survivalMaxSlots()        -> current max inventory slots
 *   $gameParty.setSurvivalMaxSlots(n)    -> change max slots at runtime
 *                                            (e.g. an upgrade item/backpack)
 *   $gameParty.survivalDocuments()       -> array of collected document data
 *   $gameParty.isSurvivalInventoryFull() -> true/false
 *   $gameParty.chestSlotsUsed()          -> chest slots currently used
 *   $gameParty.chestMaxSlots()           -> chest capacity
 *   $gameParty.isChestFull()             -> true/false
 *
 *----------------------------------------------------------------------------
 * NOTES / THINGS TO ADAPT
 *----------------------------------------------------------------------------
 *   - The grid draws large icons scaled up from your IconSet, with a plain
 *     translucent panel behind each cell (filled cells slightly brighter
 *     than empty ones). This is a functional placeholder - swap in real
 *     frame/slot art once you have it (see Window_MGInventoryGrid.drawSlotFrame).
 *   - Discard and Chest transfers currently move an item's ENTIRE stack at
 *     once (no partial-quantity picker). If you want "discard 10 of my 30
 *     bullets" style partial transfers, that's a natural next addition
 *     (Window_ShopNumber, built into MZ, is the right base class for it).
 *   - resetLimitedInventory only clears party-held slot quantities; wire it
 *     to your cycle-transition event/common event with a Plugin Command call.
 *   - This does not touch RPG Maker's turn-based equip/battle systems -
 *     if "Using Crowbar" etc. are handled by a separate action/combat
 *     plugin, this only governs whether the item occupies inventory space.
 *============================================================================
 */

(() => {
    'use strict';

    const pluginName = 'MG_SurvivalInventory';
    const params = PluginManager.parameters(pluginName);
    const MAX_SLOTS = Number(params.maxSlots || 10);
    const DEFAULT_STACK_MAX = Number(params.defaultStackMax || 99);
    const GRID_COLUMNS = Number(params.gridColumns || 5);
    const CHEST_MAX_SLOTS = Number(params.chestMaxSlots || 50);
    const ADD_DOCUMENTS_COMMAND = params.addDocumentsCommand === 'true';
    const DOCUMENTS_COMMAND_NAME = params.documentsCommandName || 'Documents';
    const INVENTORY_FULL_MESSAGE = params.inventoryFullMessage || 'Inventory is full.';
    const DISCARD_CONFIRM_TEXT = params.discardConfirmText || 'Discard this item?';

    //-------------------------------------------------------------------------
    // Notetag / data helpers
    //-------------------------------------------------------------------------

    function itemCategory(item) {
        if (!item) return null;
        if (DataManager.isItem(item) && item.itypeId === 2) {
            return 'keyitem'; // native Key Item type, regardless of tags
        }
        const match = (item.note || '').match(/<category:(\w+)>/i);
        if (match) return match[1].toLowerCase();
        return 'consumable'; // default
    }

    function itemStackMax(item) {
        const match = (item.note || '').match(/<stackMax:(\d+)>/i);
        return match ? Number(match[1]) : DEFAULT_STACK_MAX;
    }

    function itemDocumentText(item) {
        const match = (item.note || '').match(/<documentText>([\s\S]*?)<\/documentText>/i);
        return match ? match[1].trim() : item.description;
    }

    function itemCannotDiscard(item) {
        return /<cannotDiscard>/i.test(item.note || '');
    }

    // Combine recipes, read from <combine:A+B> tags on item notes.
    let _mgRecipes = null;
    function combineRecipes() {
        if (_mgRecipes) return _mgRecipes;
        _mgRecipes = [];
        for (const item of $dataItems) {
            if (!item) continue;
            const note = item.note || '';
            const qtyMatch = note.match(/<combineQty:\s*(\d+)\s*>/i);
            const qty = qtyMatch ? Math.max(1, Number(qtyMatch[1])) : 1;
            const re = /<combine:\s*(\d+)\s*\+\s*(\d+)\s*>/gi;
            let m;
            while ((m = re.exec(note))) {
                _mgRecipes.push({ a: Number(m[1]), b: Number(m[2]), result: item, qty });
            }
        }
        return _mgRecipes;
    }

    // Returns {result, qty} for the pair of items, or null.
    function findCombineRecipe(itemA, itemB) {
        if (!itemA || !itemB) return null;
        if (!DataManager.isItem(itemA) || !DataManager.isItem(itemB)) return null;
        const r = combineRecipes().find(r =>
            (r.a === itemA.id && r.b === itemB.id) || (r.a === itemB.id && r.b === itemA.id));
        return r ? { result: r.result, qty: r.qty } : null;
    }

    function limitedCategory(category) {
        return ['puzzle', 'consumable', 'weapon', 'ammo'].includes(category);
    }

    function survivalKindOf(item) {
        if (DataManager.isWeapon(item)) return 'weapon';
        if (DataManager.isArmor(item)) return 'armor';
        return 'item';
    }

    function survivalDataObject(slot) {
        if (!slot) return null;
        const container = slot.kind === 'weapon' ? $dataWeapons
            : slot.kind === 'armor' ? $dataArmors : $dataItems;
        return container[slot.id] || null;
    }

    //-------------------------------------------------------------------------
    // Game_Party: limited inventory (slot-grid)
    //-------------------------------------------------------------------------

    const _Game_Party_initialize = Game_Party.prototype.initialize;
    Game_Party.prototype.initialize = function() {
        _Game_Party_initialize.call(this);
        this._survivalDocuments = []; // array of {kind, id}
        this._survivalMaxSlots = MAX_SLOTS;
        this._survivalSlots = new Array(MAX_SLOTS).fill(null); // {kind, id} or null
        this._survivalChest = new Array(CHEST_MAX_SLOTS).fill(null); // {kind, id, qty} or null
    };

    Game_Party.prototype.survivalMaxSlots = function() {
        return this._survivalMaxSlots;
    };

    Game_Party.prototype.survivalSlots = function() {
        return this._survivalSlots;
    };

    Game_Party.prototype.setSurvivalMaxSlots = function(n) {
        n = Math.max(0, n);
        const old = this._survivalSlots || [];
        const next = new Array(n).fill(null);
        for (let i = 0; i < Math.min(n, old.length); i++) next[i] = old[i];
        this._survivalMaxSlots = n;
        this._survivalSlots = next;
        // If shrinking cuts off occupied slots, those items stay in the
        // party's actual item counts but lose their grid cell until other
        // slots free up. Grow the slot count back up to recover them.
    };

    Game_Party.prototype.survivalSlotsUsed = function() {
        return this._survivalSlots.filter(s => s).length;
    };

    Game_Party.prototype.isSurvivalInventoryFull = function() {
        return this._survivalSlots.indexOf(null) === -1;
    };

    Game_Party.prototype.survivalFindSlotIndex = function(kind, id) {
        return this._survivalSlots.findIndex(s => s && s.kind === kind && s.id === id);
    };

    Game_Party.prototype.survivalFirstEmptySlotIndex = function() {
        return this._survivalSlots.indexOf(null);
    };

    Game_Party.prototype.survivalClearSlotFor = function(item) {
        const idx = this.survivalFindSlotIndex(survivalKindOf(item), item.id);
        if (idx !== -1) this._survivalSlots[idx] = null;
    };

    Game_Party.prototype.survivalDocuments = function() {
        return this._survivalDocuments
            .map(d => {
                const container = d.kind === 'weapon' ? $dataWeapons
                    : d.kind === 'armor' ? $dataArmors : $dataItems;
                return container[d.id];
            })
            .filter(Boolean);
    };

    Game_Party.prototype.hasSurvivalDocument = function(item) {
        const kind = survivalKindOf(item);
        return this._survivalDocuments.some(d => d.kind === kind && d.id === item.id);
    };

    Game_Party.prototype.addSurvivalDocument = function(item) {
        if (this.hasSurvivalDocument(item)) return;
        this._survivalDocuments.push({ kind: survivalKindOf(item), id: item.id });
    };

    // Clears Puzzle Items / Consumables / Weapons / Ammo. Leaves Documents,
    // Key Items and the Chest untouched. Intended for cycle transitions.
    Game_Party.prototype.resetSurvivalInventory = function() {
        for (let i = 0; i < this._survivalSlots.length; i++) {
            const slot = this._survivalSlots[i];
            if (!slot) continue;
            const item = survivalDataObject(slot);
            if (item) {
                const qty = this.numItems(item);
                this.loseItem(item, qty, true);
            }
            this._survivalSlots[i] = null;
        }
    };

    // Discards an entire slot's stack. Returns true on success, false if
    // the slot is empty or the item is tagged <cannotDiscard>.
    Game_Party.prototype.survivalDiscardSlot = function(index) {
        const slot = this._survivalSlots[index];
        if (!slot) return false;
        const item = survivalDataObject(slot);
        if (!item || itemCannotDiscard(item)) return false;
        const qty = this.numItems(item);
        this.loseItem(item, qty, true);
        this._survivalSlots[index] = null;
        return true;
    };

    // Can the limited inventory take `qty` more of `item` right now?
    Game_Party.prototype.survivalCanAccept = function(item, qty) {
        if (!limitedCategory(itemCategory(item))) return true;
        const stackMax = itemStackMax(item);
        const kind = survivalKindOf(item);
        let room = 0;
        if (this.survivalFindSlotIndex(kind, item.id) !== -1) {
            room = Math.max(0, stackMax - this.numItems(item));
        }
        const freeSlots = this._survivalSlots.filter(s => !s).length;
        return qty <= room + freeSlots * stackMax;
    };

    // Is there any other item in the inventory that `item` can combine with?
    Game_Party.prototype.survivalHasCombinePartner = function(item) {
        if (!item || !DataManager.isItem(item)) return false;
        return this._survivalSlots.some(slot => {
            if (!slot || slot.kind !== 'item') return false;
            const other = survivalDataObject(slot);
            if (!other || !findCombineRecipe(item, other)) return false;
            return other.id !== item.id || this.numItems(item) >= 2;
        });
    };

    // Combines the items in two inventory slots (same index = same item twice).
    // Returns {ok, message}.
    Game_Party.prototype.survivalCombine = function(indexA, indexB) {
        const slotA = this._survivalSlots[indexA];
        const slotB = this._survivalSlots[indexB];
        if (!slotA || !slotB) return { ok: false, message: 'Nothing to combine.' };
        const itemA = survivalDataObject(slotA);
        const itemB = survivalDataObject(slotB);
        const recipe = findCombineRecipe(itemA, itemB);
        if (!recipe) {
            return { ok: false, message: `${itemA.name} + ${itemB.name}: these can't be combined.` };
        }
        if (itemA === itemB && this.numItems(itemA) < 2) {
            return { ok: false, message: `You need two of ${itemA.name}.` };
        }

        const snapshot = this._survivalSlots.slice();
        const result = recipe.result;
        const hadResult = this.survivalFindSlotIndex(survivalKindOf(result), result.id) !== -1;

        this.loseItem(itemA, 1, false);
        this.loseItem(itemB, 1, false);

        if (!this.survivalCanAccept(result, recipe.qty)) {
            // Roll back: give the ingredients back and restore the grid exactly.
            _Game_Party_gainItem.call(this, itemA, 1, false);
            _Game_Party_gainItem.call(this, itemB, 1, false);
            this._survivalSlots = snapshot;
            return { ok: false, message: INVENTORY_FULL_MESSAGE };
        }

        this.gainItem(result, recipe.qty, false);

        // Put a brand-new result into the first ingredient's old slot.
        if (!hadResult && !this._survivalSlots[indexA]) {
            const r = this.survivalFindSlotIndex(survivalKindOf(result), result.id);
            if (r !== -1 && r !== indexA) {
                this._survivalSlots[indexA] = this._survivalSlots[r];
                this._survivalSlots[r] = null;
            }
        }
        return { ok: true, message: `Combined ${itemA.name} + ${itemB.name} -> ${result.name}.` };
    };

    // Intercept gainItem to enforce the slot system and route documents.
    const _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        if (!item) return;

        const category = itemCategory(item);

        if (category === 'document') {
            if (amount > 0) this.addSurvivalDocument(item);
            return;
        }

        if (category === 'keyitem') {
            _Game_Party_gainItem.call(this, item, amount, includeEquip);
            return;
        }

        if (amount <= 0) {
            const before = this.numItems(item);
            _Game_Party_gainItem.call(this, item, amount, includeEquip);
            if (before > 0 && this.numItems(item) <= 0) {
                this.survivalClearSlotFor(item);
            }
            return;
        }

        const kind = survivalKindOf(item);
        const stackMax = itemStackMax(item);
        let remaining = amount;
        let accepted = 0;

        // 1. Fill an existing, not-full stack first (free, no new slot).
        const existingIndex = this.survivalFindSlotIndex(kind, item.id);
        if (existingIndex !== -1) {
            const currentQty = this.numItems(item);
            const room = Math.max(0, stackMax - currentQty);
            const fill = Math.min(room, remaining);
            accepted += fill;
            remaining -= fill;
        }

        // 2. Open new slots (one stack per slot) while slots are free.
        while (remaining > 0) {
            const freeIndex = this.survivalFirstEmptySlotIndex();
            if (freeIndex === -1) break;
            this._survivalSlots[freeIndex] = { kind, id: item.id };
            const fill = Math.min(stackMax, remaining);
            accepted += fill;
            remaining -= fill;
        }

        if (accepted > 0) {
            _Game_Party_gainItem.call(this, item, accepted, includeEquip);
        }
        if (remaining > 0) {
            $gameMessage.add(INVENTORY_FULL_MESSAGE);
        }
    };

    //-------------------------------------------------------------------------
    // Game_Party: shared Chest
    //-------------------------------------------------------------------------

    Game_Party.prototype.chestMaxSlots = function() {
        return this._survivalChest.length;
    };

    Game_Party.prototype.chestSlots = function() {
        return this._survivalChest;
    };

    Game_Party.prototype.chestSlotsUsed = function() {
        return this._survivalChest.filter(s => s).length;
    };

    Game_Party.prototype.isChestFull = function() {
        return this._survivalChest.indexOf(null) === -1;
    };

    Game_Party.prototype.chestFindSlotIndex = function(kind, id) {
        return this._survivalChest.findIndex(s => s && s.kind === kind && s.id === id);
    };

    Game_Party.prototype.chestFirstEmptySlotIndex = function() {
        return this._survivalChest.indexOf(null);
    };

    // Moves an inventory slot's entire stack into the Chest.
    Game_Party.prototype.moveSlotToChest = function(slotIndex) {
        const slot = this._survivalSlots[slotIndex];
        if (!slot) return 0;
        const item = survivalDataObject(slot);
        if (!item) return 0;

        const kind = slot.kind;
        const stackMax = itemStackMax(item);
        let remaining = this.numItems(item);
        let moved = 0;

        const existing = this.chestFindSlotIndex(kind, item.id);
        if (existing !== -1) {
            const chestSlot = this._survivalChest[existing];
            const room = stackMax - chestSlot.qty;
            const fill = Math.min(room, remaining);
            chestSlot.qty += fill;
            moved += fill;
            remaining -= fill;
        }
        while (remaining > 0) {
            const free = this.chestFirstEmptySlotIndex();
            if (free === -1) break;
            const fill = Math.min(stackMax, remaining);
            this._survivalChest[free] = { kind, id: item.id, qty: fill };
            moved += fill;
            remaining -= fill;
        }

        if (moved > 0) {
            this.loseItem(item, moved, true);
            if (this.numItems(item) <= 0) this._survivalSlots[slotIndex] = null;
        }
        return moved;
    };

    // Moves a Chest slot's entire stack back into the inventory, respecting
    // the inventory's own slot limit. Returns how much actually moved.
    Game_Party.prototype.moveChestSlotToInventory = function(chestIndex) {
        const slot = this._survivalChest[chestIndex];
        if (!slot) return 0;
        const item = survivalDataObject(slot);
        if (!item) return 0;

        const before = this.numItems(item);
        this.gainItem(item, slot.qty, false); // goes through our own slot logic
        const moved = this.numItems(item) - before;

        if (moved > 0) {
            slot.qty -= moved;
            if (slot.qty <= 0) this._survivalChest[chestIndex] = null;
        }
        return moved;
    };

    //-------------------------------------------------------------------------
    // Plugin Commands
    //-------------------------------------------------------------------------

    PluginManager.registerCommand(pluginName, 'resetLimitedInventory', () => {
        $gameParty.resetSurvivalInventory();
    });

    PluginManager.registerCommand(pluginName, 'checkInventoryFull', args => {
        const variableId = Number(args.variableId || 1);
        $gameVariables.setValue(variableId, $gameParty.isSurvivalInventoryFull() ? 1 : 0);
    });

    PluginManager.registerCommand(pluginName, 'openChest', () => {
        SceneManager.push(Scene_MGChest);
    });

    //-------------------------------------------------------------------------
    // Window_ItemList: hide documents from any native item list - they live
    // in the Document Archive instead. (Used for the Key Items tab.)
    //-------------------------------------------------------------------------

    const _Window_ItemList_includes = Window_ItemList.prototype.includes;
    Window_ItemList.prototype.includes = function(item) {
        if (item && itemCategory(item) === 'document') return false;
        return _Window_ItemList_includes.call(this, item);
    };

    //-------------------------------------------------------------------------
    // Window_MGInventoryGrid - base grid window, large icons, empty cells
    // shown up to the slot array's length. Subclassed for the party
    // inventory and for the Chest.
    //-------------------------------------------------------------------------

    function Window_MGInventoryGrid() {
        this.initialize(...arguments);
    }

    Window_MGInventoryGrid.prototype = Object.create(Window_Selectable.prototype);
    Window_MGInventoryGrid.prototype.constructor = Window_MGInventoryGrid;

    Window_MGInventoryGrid.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.select(0);
    };

    Window_MGInventoryGrid.prototype.maxCols = function() {
        return GRID_COLUMNS;
    };

    Window_MGInventoryGrid.prototype.itemHeight = function() {
        return this.itemWidth();
    };

    // Override in subclasses: the backing array of {kind,id[,qty]}|null.
    Window_MGInventoryGrid.prototype.slotsArray = function() {
        return [];
    };

    Window_MGInventoryGrid.prototype.maxItems = function() {
        return this.slotsArray().length;
    };

    Window_MGInventoryGrid.prototype.slotAt = function(index) {
        return this.slotsArray()[index] || null;
    };

    Window_MGInventoryGrid.prototype.dataForSlot = function(slot) {
        return survivalDataObject(slot);
    };

    // Override in subclasses: how much of the item this slot holds.
    Window_MGInventoryGrid.prototype.quantityForSlot = function(slot) {
        return 0;
    };

    Window_MGInventoryGrid.prototype.item = function() {
        return this.dataForSlot(this.slotAt(this.index()));
    };

    Window_MGInventoryGrid.prototype.updateHelp = function() {
        this.setHelpWindowItem(this.item());
    };

    Window_MGInventoryGrid.prototype.drawCombineMarker = function(rect) {
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, 3, '#ffd24a');
        this.contents.fillRect(rect.x + 2, rect.y + rect.height - 5, rect.width - 4, 3, '#ffd24a');
        this.contents.fillRect(rect.x + 2, rect.y + 2, 3, rect.height - 4, '#ffd24a');
        this.contents.fillRect(rect.x + rect.width - 5, rect.y + 2, 3, rect.height - 4, '#ffd24a');
    };

    Window_MGInventoryGrid.prototype.drawItem = function(index) {
        const rect = this.itemRect(index);
        const slot = this.slotAt(index);
        this.drawSlotFrame(rect, !!slot);
        if (index === this._mgCombineSource) this.drawCombineMarker(rect);
        if (!slot) return;
        const item = this.dataForSlot(slot);
        if (!item) return;
        this.drawBigIcon(item.iconIndex, rect.x, rect.y, rect.width, rect.height);
        const qty = this.quantityForSlot(slot);
        if (qty > 1) this.drawSlotQuantity(qty, rect);
    };

    // Plain placeholder panel - swap for real slot art later.
    Window_MGInventoryGrid.prototype.drawSlotFrame = function(rect, filled) {
        const color = filled ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)';
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, color);
    };

    Window_MGInventoryGrid.prototype.drawBigIcon = function(iconIndex, x, y, width, height) {
        const bitmap = ImageManager.loadSystem('IconSet');
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        const size = Math.min(width, height) - 10;
        const dx = x + (width - size) / 2;
        const dy = y + (height - size) / 2;
        this.contents.blt(bitmap, sx, sy, pw, ph, dx, dy, size, size);
    };

    Window_MGInventoryGrid.prototype.drawSlotQuantity = function(qty, rect) {
        const text = `x${qty}`;
        this.contents.fontSize = 16;
        this.drawText(text, rect.x, rect.y + rect.height - 20, rect.width - 6, 'right');
        this.resetFontSettings();
    };

    //-------------------------------------------------------------------------
    // Window_MGPartyInventoryGrid / Window_MGChestGrid
    //-------------------------------------------------------------------------

    function Window_MGPartyInventoryGrid() {
        this.initialize(...arguments);
    }
    Window_MGPartyInventoryGrid.prototype = Object.create(Window_MGInventoryGrid.prototype);
    Window_MGPartyInventoryGrid.prototype.constructor = Window_MGPartyInventoryGrid;

    Window_MGPartyInventoryGrid.prototype.slotsArray = function() {
        return $gameParty.survivalSlots();
    };

    Window_MGPartyInventoryGrid.prototype.quantityForSlot = function(slot) {
        const item = this.dataForSlot(slot);
        return item ? $gameParty.numItems(item) : 0;
    };

    // Combine mode: the chosen first slot (or null/undefined when off).
    Window_MGPartyInventoryGrid.prototype.setCombineSource = function(index) {
        this._mgCombineSource = index;
        this.refresh();
        this.updateHelp();
    };

    Window_MGPartyInventoryGrid.prototype.updateHelp = function() {
        const source = this._mgCombineSource;
        if (source !== null && source !== undefined && this._helpWindow) {
            const a = this.dataForSlot(this.slotAt(source));
            const b = this.item();
            if (a && b) {
                const recipe = findCombineRecipe(a, b);
                const ok = recipe && (a.id !== b.id || $gameParty.numItems(a) >= 2);
                this._helpWindow.setText(ok
                    ? `Combine: ${a.name} + ${b.name} -> ${recipe.result.name}`
                    : `${a.name} + ${b.name}: can't be combined`);
            } else {
                this._helpWindow.setText(`Combine ${a ? a.name : ''} with which item?  (Cancel to abort)`);
            }
            return;
        }
        Window_MGInventoryGrid.prototype.updateHelp.call(this);
    };

    function Window_MGChestGrid() {
        this.initialize(...arguments);
    }
    Window_MGChestGrid.prototype = Object.create(Window_MGInventoryGrid.prototype);
    Window_MGChestGrid.prototype.constructor = Window_MGChestGrid;

    Window_MGChestGrid.prototype.slotsArray = function() {
        return $gameParty.chestSlots();
    };

    Window_MGChestGrid.prototype.quantityForSlot = function(slot) {
        return slot ? slot.qty : 0;
    };

    //-------------------------------------------------------------------------
    // Window_MGInventoryCategory - "Inventory" / "Key Items" tabs
    //-------------------------------------------------------------------------

    function Window_MGInventoryCategory() {
        this.initialize(...arguments);
    }
    Window_MGInventoryCategory.prototype = Object.create(Window_HorzCommand.prototype);
    Window_MGInventoryCategory.prototype.constructor = Window_MGInventoryCategory;

    Window_MGInventoryCategory.prototype.initialize = function(rect) {
        Window_HorzCommand.prototype.initialize.call(this, rect);
    };

    Window_MGInventoryCategory.prototype.maxCols = function() {
        return 2;
    };

    Window_MGInventoryCategory.prototype.makeCommandList = function() {
        this.addCommand('Inventory', 'inventory');
        this.addCommand('Key Items', 'keyItems');
    };

    //-------------------------------------------------------------------------
    // Window_MGSlotActions - Use / Assign / Combine / Discard / Cancel popup
    //-------------------------------------------------------------------------

    function Window_MGSlotActions() {
        this.initialize(...arguments);
    }
    Window_MGSlotActions.prototype = Object.create(Window_Command.prototype);
    Window_MGSlotActions.prototype.constructor = Window_MGSlotActions;

    Window_MGSlotActions.prototype.initialize = function(rect) {
        this._item = null;
        Window_Command.prototype.initialize.call(this, rect);
    };

    Window_MGSlotActions.prototype.setItem = function(item) {
        this._item = item;
        this.refresh();
        this.select(0);
    };

    Window_MGSlotActions.prototype.makeCommandList = function() {
        if (!this._item) return;
        // Usable from this menu: regular items (itypeId 1) whose occasion
        // is "Always" (0) or "Menu Screen" (2). Occasion 1 is battle-only,
        // occasion 3 is never usable.
        const usable = this._item.itypeId === 1
            && (this._item.occasion === 0 || this._item.occasion === 2);
        this.addCommand('Use', 'use', usable);
        // Assign: needs ARPG_ItemShortcut, an item (not a weapon/armor) with an
        // <action: ...> tag, and a party leader.
        const canAssign = typeof $shortcutStatus !== 'undefined'
            && !!window.useItemShortcut
            && DataManager.isItem(this._item)
            && !!(this._item.meta && this._item.meta.action)
            && !!$gameParty.leader();
        this.addCommand('Assign', 'assign', canAssign);
        this.addCommand('Combine', 'combine', $gameParty.survivalHasCombinePartner(this._item));
        this.addCommand('Discard', 'discard', !itemCannotDiscard(this._item));
        this.addCommand('Cancel', 'cancel');
    };

    //-------------------------------------------------------------------------
    // Window_MGYesNo - tiny reusable confirm window
    //-------------------------------------------------------------------------

    function Window_MGYesNo() {
        this.initialize(...arguments);
    }
    Window_MGYesNo.prototype = Object.create(Window_Command.prototype);
    Window_MGYesNo.prototype.constructor = Window_MGYesNo;

    Window_MGYesNo.prototype.makeCommandList = function() {
        this.addCommand('Yes', 'yes');
        this.addCommand('No', 'no');
    };

    //-------------------------------------------------------------------------
    // Window_MGSlotCount - "Slots: X / Y" header
    //-------------------------------------------------------------------------

    function Window_MGSlotCount() {
        this.initialize(...arguments);
    }
    Window_MGSlotCount.prototype = Object.create(Window_Base.prototype);
    Window_MGSlotCount.prototype.constructor = Window_MGSlotCount;

    Window_MGSlotCount.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.refresh();
    };

    Window_MGSlotCount.prototype.refresh = function() {
        this.contents.clear();
        const used = $gameParty.survivalSlotsUsed();
        const max = $gameParty.survivalMaxSlots();
        this.drawText(`Slots: ${used} / ${max}`, 0, 0, this.contentsWidth(), 'right');
    };

    //-------------------------------------------------------------------------
    // Scene_Item overhaul: category tabs + grid + Key Items list
    //
    // IMPORTANT: this ALIASES Scene_Item.prototype.create instead of
    // replacing it, so the native windows (and any other plugin's own
    // Scene_Item hooks, e.g. an action-shortcut plugin) are still built
    // normally. We then hide the native item/category windows we don't
    // use and layer our own grid UI on top, rather than tearing anything
    // out - this keeps the plugin compatible regardless of load order.
    //-------------------------------------------------------------------------

    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _Scene_Item_create.call(this);
        this.mgHideNativeItemWindows();
        this.mgCreateSlotCountWindow();
        this.mgCreateCategoryWindow();
        this.mgCreateInventoryGridWindow();
        this.mgCreateKeyItemListWindow();
        this.mgCreateActionWindow();
        this.mgCreateConfirmWindow();
        this.mgHookShortcutWindow();
    };

    // Geometry-only hook (not a replacement of createHelpWindow) so the
    // native help window still gets created normally by Scene_ItemBase,
    // just positioned at the bottom instead of the default top spot.
    const _Scene_Item_helpWindowRect = Scene_Item.prototype.helpWindowRect;
    Scene_Item.prototype.helpWindowRect = function() {
        if (_Scene_Item_helpWindowRect) {
            const base = _Scene_Item_helpWindowRect.call(this);
            const wh = this.calcWindowHeight(2, false);
            return new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
        }
        const wh = this.calcWindowHeight(2, false);
        return new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
    };

    Scene_Item.prototype.mgHideNativeItemWindows = function() {
        if (this._categoryWindow) {
            this._categoryWindow.hide();
            this._categoryWindow.deactivate();
        }
        if (this._itemWindow) {
            this._itemWindow.hide();
            this._itemWindow.deactivate();
        }
    };

    Scene_Item.prototype.mgSlotCountWindowRect = function() {
        const wx = 0, wy = 0;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, false);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Item.prototype.mgCreateSlotCountWindow = function() {
        const rect = this.mgSlotCountWindowRect();
        this._mgSlotCountWindow = new Window_MGSlotCount(rect);
        this.addWindow(this._mgSlotCountWindow);
    };

    Scene_Item.prototype.mgCategoryWindowRect = function() {
        const wy = this._mgSlotCountWindow.y + this._mgSlotCountWindow.height;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, true);
        return new Rectangle(0, wy, ww, wh);
    };

    Scene_Item.prototype.mgCreateCategoryWindow = function() {
        const rect = this.mgCategoryWindowRect();
        this._mgCategoryWindow = new Window_MGInventoryCategory(rect);
        this._mgCategoryWindow.setHandler('inventory', this.mgCommandInventory.bind(this));
        this._mgCategoryWindow.setHandler('keyItems', this.mgCommandKeyItems.bind(this));
        this._mgCategoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._mgCategoryWindow);
    };

    Scene_Item.prototype.mgGridAreaRect = function() {
        const wy = this._mgCategoryWindow.y + this._mgCategoryWindow.height;
        const wh = Graphics.boxHeight - wy - (this._helpWindow ? this._helpWindow.height : 0);
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    Scene_Item.prototype.mgCreateInventoryGridWindow = function() {
        const rect = this.mgGridAreaRect();
        this._mgInventoryGridWindow = new Window_MGPartyInventoryGrid(rect);
        this._mgInventoryGridWindow.setHelpWindow(this._helpWindow);
        this._mgInventoryGridWindow.setHandler('ok', this.mgOnInventorySlotOk.bind(this));
        this._mgInventoryGridWindow.setHandler('cancel', this.mgOnGridCancel.bind(this));
        this.addWindow(this._mgInventoryGridWindow);
    };

    Scene_Item.prototype.mgCreateKeyItemListWindow = function() {
        const rect = this.mgGridAreaRect();
        this._mgKeyItemWindow = new Window_ItemList(rect);
        this._mgKeyItemWindow.setCategory('keyItem');
        this._mgKeyItemWindow.setHelpWindow(this._helpWindow);
        this._mgKeyItemWindow.setHandler('cancel', this.mgOnGridCancel.bind(this));
        this._mgKeyItemWindow.hide();
        this._mgKeyItemWindow.deactivate();
        this.addWindow(this._mgKeyItemWindow);
    };

    Scene_Item.prototype.mgCreateActionWindow = function() {
        const ww = 240;
        const wh = this.calcWindowHeight(5, true);
        const rect = new Rectangle((Graphics.boxWidth - ww) / 2, (Graphics.boxHeight - wh) / 2, ww, wh);
        this._mgActionWindow = new Window_MGSlotActions(rect);
        this._mgActionWindow.setHandler('use', this.mgOnActionUse.bind(this));
        this._mgActionWindow.setHandler('assign', this.mgOnActionAssign.bind(this));
        this._mgActionWindow.setHandler('combine', this.mgOnActionCombine.bind(this));
        this._mgActionWindow.setHandler('discard', this.mgOnActionDiscard.bind(this));
        this._mgActionWindow.setHandler('cancel', this.mgOnActionCancel.bind(this));
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        this.addWindow(this._mgActionWindow);
    };

    Scene_Item.prototype.mgCreateConfirmWindow = function() {
        const ww = 320;
        const wh = this.calcWindowHeight(2, true);
        const rect = new Rectangle((Graphics.boxWidth - ww) / 2, (Graphics.boxHeight - wh) / 2, ww, wh);
        this._mgConfirmWindow = new Window_MGYesNo(rect);
        this._mgConfirmWindow.setHandler('yes', this.mgOnConfirmDiscardYes.bind(this));
        this._mgConfirmWindow.setHandler('no', this.mgOnConfirmDiscardNo.bind(this));
        this._mgConfirmWindow.setHandler('cancel', this.mgOnConfirmDiscardNo.bind(this));
        this._mgConfirmWindow.hide();
        this._mgConfirmWindow.deactivate();
        this.addWindow(this._mgConfirmWindow);
    };

    Scene_Item.prototype.mgCommandInventory = function() {
        this._mgKeyItemWindow.hide();
        this._mgKeyItemWindow.deactivate();
        this._mgInventoryGridWindow.show();
        this._mgInventoryGridWindow.activate();
        this._mgInventoryGridWindow.select(0);
    };

    Scene_Item.prototype.mgCommandKeyItems = function() {
        this._mgInventoryGridWindow.hide();
        this._mgInventoryGridWindow.deactivate();
        this._mgKeyItemWindow.refresh();
        this._mgKeyItemWindow.show();
        this._mgKeyItemWindow.activate();
        this._mgKeyItemWindow.select(0);
    };

    Scene_Item.prototype.mgOnGridCancel = function() {
        if (this._mgCombineSource !== null && this._mgCombineSource !== undefined) {
            this.mgEndCombine();
            this._mgInventoryGridWindow.activate();
            return;
        }
        this._mgCategoryWindow.activate();
    };

    Scene_Item.prototype.mgOnInventorySlotOk = function() {
        if (this._mgCombineSource !== null && this._mgCombineSource !== undefined) {
            this.mgOnCombineTarget();
            return;
        }
        const slot = this._mgInventoryGridWindow.slotAt(this._mgInventoryGridWindow.index());
        if (!slot) {
            this._mgInventoryGridWindow.activate();
            return;
        }
        this._mgActionItem = survivalDataObject(slot);
        this._mgActionSlotIndex = this._mgInventoryGridWindow.index();
        this._mgActionWindow.setItem(this._mgActionItem);
        this._mgActionWindow.show();
        this._mgActionWindow.activate();
    };

    Scene_Item.prototype.mgOnActionUse = function() {
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        // Hook your own item-use effect here (e.g. $gameParty.consumeItem,
        // common-event triggers, etc.) - left open since "use" behavior is
        // specific to your combat/interaction systems.
        this._mgInventoryGridWindow.refresh();
        this._mgInventoryGridWindow.activate();
    };

    // --- Assign (put the item on the ARPG_ItemShortcut bar) ---

    // ARPG_ItemShortcut builds this._shortcutWindow for Scene_Item. Its default
    // handlers assume the native item list, so replace ok/cancel with ours
    // (Shift still clears a slot through the original handler).
    Scene_Item.prototype.mgHookShortcutWindow = function() {
        if (!this._shortcutWindow) return;
        this._shortcutWindow.setHandler('ok', this.mgOnAssignOk.bind(this));
        this._shortcutWindow.setHandler('cancel', this.mgOnAssignCancel.bind(this));
    };

    Scene_Item.prototype.mgOnActionAssign = function() {
        if (!this._shortcutWindow) {
            this._mgActionWindow.activate();
            return;
        }
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        this._shortcutWindow.refresh();
        this._shortcutWindow.show();
        this._shortcutWindow.activate();
        this._helpWindow.setText('Choose a shortcut slot.  Shift: clear the slot.');
    };

    Scene_Item.prototype.mgOnAssignOk = function() {
        const index = this._shortcutWindow.index();
        const leader = $gameParty.leader();
        if (leader && this._mgActionItem) {
            $shortcutStatus.setShortcut(leader.actorId(), index, new Game_Item(this._mgActionItem));
            $shortcutTempData.mapSelectIndex = index;
            if ($shortcutTempData.requestRefreshShortcutWindow) {
                $shortcutTempData.requestRefreshShortcutWindow();
            }
        }
        this._shortcutWindow.refresh();
        this._shortcutWindow.hide();
        this._shortcutWindow.deactivate();
        this._mgInventoryGridWindow.activate();
        this._helpWindow.setText(`Assigned ${this._mgActionItem.name} to shortcut slot ${index + 1}.`);
    };

    Scene_Item.prototype.mgOnAssignCancel = function() {
        this._shortcutWindow.hide();
        this._shortcutWindow.deactivate();
        this._mgActionWindow.show();
        this._mgActionWindow.activate();
    };

    // --- Combine ---

    Scene_Item.prototype.mgOnActionCombine = function() {
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        this._mgCombineSource = this._mgActionSlotIndex;
        this._mgInventoryGridWindow.setCombineSource(this._mgCombineSource);
        this._mgInventoryGridWindow.activate();
    };

    Scene_Item.prototype.mgEndCombine = function() {
        this._mgCombineSource = null;
        this._mgInventoryGridWindow.setCombineSource(null);
    };

    Scene_Item.prototype.mgOnCombineTarget = function() {
        const source = this._mgCombineSource;
        const target = this._mgInventoryGridWindow.index();
        const result = $gameParty.survivalCombine(source, target);
        this._mgInventoryGridWindow.activate();
        if (result.ok) {
            this.mgEndCombine();
            this._mgInventoryGridWindow.refresh();
            this._mgSlotCountWindow.refresh();
            this._helpWindow.setText(result.message);
        } else {
            SoundManager.playBuzzer();
            this._helpWindow.setText(result.message);
        }
    };

    Scene_Item.prototype.mgOnActionDiscard = function() {
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        this._mgConfirmWindow.refresh();
        this._mgConfirmWindow.show();
        this._mgConfirmWindow.activate();
    };

    Scene_Item.prototype.mgOnActionCancel = function() {
        this._mgActionWindow.hide();
        this._mgActionWindow.deactivate();
        this._mgInventoryGridWindow.activate();
    };

    Scene_Item.prototype.mgOnConfirmDiscardYes = function() {
        $gameParty.survivalDiscardSlot(this._mgActionSlotIndex);
        this._mgSlotCountWindow.refresh();
        this._mgConfirmWindow.hide();
        this._mgConfirmWindow.deactivate();
        this._mgInventoryGridWindow.refresh();
        this._mgInventoryGridWindow.activate();
    };

    Scene_Item.prototype.mgOnConfirmDiscardNo = function() {
        this._mgConfirmWindow.hide();
        this._mgConfirmWindow.deactivate();
        this._mgInventoryGridWindow.activate();
    };

    //-------------------------------------------------------------------------
    // Scene_MGChest - inventory grid + chest grid, store/retrieve
    //-------------------------------------------------------------------------

    function Scene_MGChest() {
        this.initialize(...arguments);
    }
    Scene_MGChest.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_MGChest.prototype.constructor = Scene_MGChest;

    Scene_MGChest.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_MGChest.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createLabelWindows();
        this.createGridWindows();
    };

    Scene_MGChest.prototype.createHelpWindow = function() {
        const wh = this.calcWindowHeight(2, false);
        const rect = new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
        this._helpWindow = new Window_Help(rect);
        this.addWindow(this._helpWindow);
    };

    Scene_MGChest.prototype.createLabelWindows = function() {
        const halfW = Graphics.boxWidth / 2;
        const wh = this.calcWindowHeight(1, false);
        this._leftLabel = new Window_Base(new Rectangle(0, 0, halfW, wh));
        this._leftLabel.drawText('Inventory', 0, 0, halfW - this._leftLabel.padding * 2);
        this._rightLabel = new Window_Base(new Rectangle(halfW, 0, halfW, wh));
        this._rightLabel.drawText('Chest', 0, 0, halfW - this._rightLabel.padding * 2);
        this.addWindow(this._leftLabel);
        this.addWindow(this._rightLabel);
    };

    Scene_MGChest.prototype.createGridWindows = function() {
        const halfW = Graphics.boxWidth / 2;
        const wy = this._leftLabel.height;
        const wh = Graphics.boxHeight - wy - this._helpWindow.height;

        this._inventoryGrid = new Window_MGPartyInventoryGrid(new Rectangle(0, wy, halfW, wh));
        this._inventoryGrid.setHelpWindow(this._helpWindow);
        this._inventoryGrid.setHandler('ok', this.onInventoryOk.bind(this));
        this._inventoryGrid.setHandler('cancel', this.popScene.bind(this));
        this._inventoryGrid.setHandler('pagedown', this.selectChestGrid.bind(this));
        this.addWindow(this._inventoryGrid);

        this._chestGrid = new Window_MGChestGrid(new Rectangle(halfW, wy, halfW, wh));
        this._chestGrid.setHelpWindow(this._helpWindow);
        this._chestGrid.setHandler('ok', this.onChestOk.bind(this));
        this._chestGrid.setHandler('cancel', this.selectInventoryGrid.bind(this));
        this._chestGrid.setHandler('pageup', this.selectInventoryGrid.bind(this));
        this.addWindow(this._chestGrid);

        this._inventoryGrid.activate();
        this._inventoryGrid.select(0);
    };

    Scene_MGChest.prototype.selectChestGrid = function() {
        this._inventoryGrid.deactivate();
        this._chestGrid.activate();
        this._chestGrid.select(0);
    };

    Scene_MGChest.prototype.selectInventoryGrid = function() {
        this._chestGrid.deactivate();
        this._inventoryGrid.activate();
        this._inventoryGrid.select(0);
    };

    Scene_MGChest.prototype.onInventoryOk = function() {
        const index = this._inventoryGrid.index();
        if ($gameParty.survivalSlots()[index]) {
            $gameParty.moveSlotToChest(index);
            this._inventoryGrid.refresh();
            this._chestGrid.refresh();
        }
        this._inventoryGrid.activate();
    };

    Scene_MGChest.prototype.onChestOk = function() {
        const index = this._chestGrid.index();
        if ($gameParty.chestSlots()[index]) {
            $gameParty.moveChestSlotToInventory(index);
            this._inventoryGrid.refresh();
            this._chestGrid.refresh();
        }
        this._chestGrid.activate();
    };

    //-------------------------------------------------------------------------
    // Scene_MGDocumentArchive
    //-------------------------------------------------------------------------

    function Scene_MGDocumentArchive() {
        this.initialize(...arguments);
    }
    Scene_MGDocumentArchive.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_MGDocumentArchive.prototype.constructor = Scene_MGDocumentArchive;

    Scene_MGDocumentArchive.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_MGDocumentArchive.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createListWindow();
        this.createTextWindow();
    };

    Scene_MGDocumentArchive.prototype.createListWindow = function() {
        const rect = new Rectangle(0, 0, 400, Graphics.boxHeight);
        this._listWindow = new Window_MGDocumentList(rect);
        this._listWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._listWindow);
    };

    Scene_MGDocumentArchive.prototype.createTextWindow = function() {
        const rect = new Rectangle(400, 0, Graphics.boxWidth - 400, Graphics.boxHeight);
        this._textWindow = new Window_MGDocumentText(rect);
        this.addWindow(this._textWindow);
        this._listWindow.setTextWindow(this._textWindow);
    };

    function Window_MGDocumentList() {
        this.initialize(...arguments);
    }
    Window_MGDocumentList.prototype = Object.create(Window_Selectable.prototype);
    Window_MGDocumentList.prototype.constructor = Window_MGDocumentList;

    Window_MGDocumentList.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this._textWindow = null;
        this.refresh();
        this.select(0);
        this.activate();
    };

    Window_MGDocumentList.prototype.setTextWindow = function(win) {
        this._textWindow = win;
        this.updateTextWindow();
    };

    Window_MGDocumentList.prototype.maxItems = function() {
        return $gameParty.survivalDocuments().length;
    };

    Window_MGDocumentList.prototype.item = function() {
        return $gameParty.survivalDocuments()[this.index()];
    };

    Window_MGDocumentList.prototype.drawItem = function(index) {
        const item = $gameParty.survivalDocuments()[index];
        if (!item) return;
        const rect = this.itemLineRect(index);
        this.drawItemName(item, rect.x, rect.y, rect.width);
    };

    Window_MGDocumentList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        this.updateTextWindow();
    };

    Window_MGDocumentList.prototype.updateTextWindow = function() {
        if (!this._textWindow) return;
        this._textWindow.setItem(this.item());
    };

    function Window_MGDocumentText() {
        this.initialize(...arguments);
    }
    Window_MGDocumentText.prototype = Object.create(Window_Base.prototype);
    Window_MGDocumentText.prototype.constructor = Window_MGDocumentText;

    Window_MGDocumentText.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
    };

    Window_MGDocumentText.prototype.setItem = function(item) {
        if (this._item === item) return;
        this._item = item;
        this.refresh();
    };

    Window_MGDocumentText.prototype.refresh = function() {
        this.contents.clear();
        if (!this._item) return;
        const text = itemDocumentText(this._item);
        this.drawTextEx(text, 0, 0, this.contentsWidth());
    };

    //-------------------------------------------------------------------------
    // Main menu command
    //-------------------------------------------------------------------------

    if (ADD_DOCUMENTS_COMMAND) {
        const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _Window_MenuCommand_addOriginalCommands.call(this);
            this.addCommand(DOCUMENTS_COMMAND_NAME, 'documents', true);
        };

        const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
        Scene_Menu.prototype.createCommandWindow = function() {
            _Scene_Menu_createCommandWindow.call(this);
            this._commandWindow.setHandler('documents', this.commandDocuments.bind(this));
        };

        Scene_Menu.prototype.commandDocuments = function() {
            SceneManager.push(Scene_MGDocumentArchive);
        };
    }

})();
