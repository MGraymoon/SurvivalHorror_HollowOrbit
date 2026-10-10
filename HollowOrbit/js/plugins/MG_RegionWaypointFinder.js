/*:
 * @target MZ
 * @plugindesc Finds the nearest tile with a specified Region ID and stores its X/Y coordinates in variables.
 * @author MGraymoon
 *
 * @help
 * ============================================================================
 * Region Waypoint Finder
 * ============================================================================
 *
 * Finds the nearest tile on the current map whose Region ID matches the value
 * stored in a specified variable.
 *
 * The X and Y coordinates of the nearest matching tile are then stored in two
 * other variables.
 *
 * ============================================================================
 * Plugin Command: Find Nearest Region
 * ============================================================================
 *
 * Region Variable:
 *   Variable containing the Region ID to search for.
 *
 * X Variable:
 *   Variable that will receive the matching tile's X coordinate.
 *
 * Y Variable:
 *   Variable that will receive the matching tile's Y coordinate.
 *
 * If no matching region exists on the current map, both output variables are
 * set to -1.
 *
 * ============================================================================
 *
 * @command findNearestRegion
 * @text Find Nearest Region
 * @desc Finds the nearest tile belonging to the specified Region ID.
 *
 * @arg regionVariable
 * @text Region ID Variable
 * @desc Variable containing the Region ID to search for.
 * @type variable
 * @default 1
 *
 * @arg xVariable
 * @text X Output Variable
 * @desc Variable that receives the X coordinate of the nearest matching tile.
 * @type variable
 * @default 2
 *
 * @arg yVariable
 * @text Y Output Variable
 * @desc Variable that receives the Y coordinate of the nearest matching tile.
 * @type variable
 * @default 3
 *
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "MG_RegionWaypointFinder";

    //--------------------------------------------------------------------------
    // Plugin Command
    //--------------------------------------------------------------------------

    PluginManager.registerCommand(
        pluginName,
        "findNearestRegion",
        args => {

            const regionVariableId = Number(args.regionVariable);
            const xVariableId = Number(args.xVariable);
            const yVariableId = Number(args.yVariable);

            const targetRegionId = $gameVariables.value(regionVariableId);

            const playerX = $gamePlayer.x;
            const playerY = $gamePlayer.y;

            let nearestX = -1;
            let nearestY = -1;
            let nearestDistance = Infinity;

            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();

            // Search every tile on the current map.
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {

                    if ($gameMap.regionId(x, y) !== targetRegionId) {
                        continue;
                    }

                    // Squared distance is enough for comparison.
                    // No need to calculate an actual square root.
                    const dx = x - playerX;
                    const dy = y - playerY;
                    const distance = dx * dx + dy * dy;

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestX = x;
                        nearestY = y;
                    }
                }
            }

            // Store the result.
            $gameVariables.setValue(xVariableId, nearestX);
            $gameVariables.setValue(yVariableId, nearestY);
        }
    );

})();