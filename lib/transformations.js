/**
 * Transformations
 * Implements Pokemon 5e transformation mechanics (Mega, Z-Move, Dynamax, Tera)
 * T093-T103: Full transformation system implementation
 *
 * Feature: 017-5e-combat-research
 */

/**
 * Transformation type constants
 */
export const TransformationType = {
  MEGA: 'mega',
  Z_MOVE: 'z-move',
  DYNAMAX: 'dynamax',
  TERASTALLIZATION: 'terastallization'
};

/**
 * Transformation state constants
 */
const DYNAMAX_TURNS = 3; // Standard Dynamax duration
const TERA_DURATION_TURNS = null; // Lasts until combat ends or pokemon faints

/**
 * T093: Check Mega Evolution requirements
 * Per Source/rules/rules.json transform-mega:
 * - Pokemon is capable of Mega Evolution (has Mega stat block)
 * - Level 10+
 * - Holding corresponding Mega Stone
 * - Trainer has Key Stone
 * - Bond Level +2 or higher
 * @param {Object} pokemon - Pokemon to check
 * @param {Object} trainer - Trainer data with items
 * @returns {{ canTransform: boolean, reason: string|null }}
 */
export function checkMegaRequirements(pokemon, trainer) {
  // Check level requirement
  if ((pokemon.level || 1) < 10) {
    return { canTransform: false, reason: 'level_too_low' };
  }

  // Check if Pokemon has a Mega form
  if (!pokemon.mega_form && !pokemon.has_mega) {
    return { canTransform: false, reason: 'no_mega_form' };
  }

  // Check if holding Mega Stone
  const heldItem = pokemon.held_item || pokemon.item;
  const megaStoneId = `${pokemon.species_id || pokemon.id}-mega-stone`;
  const isMegaStone = heldItem?.toLowerCase()?.includes('mega') ||
                      heldItem === megaStoneId;
  if (!isMegaStone) {
    return { canTransform: false, reason: 'no_mega_stone' };
  }

  // Check if trainer has Key Stone
  const hasKeyStone = trainer?.items?.includes('key-stone') ||
                      trainer?.key_stone ||
                      trainer?.has_key_stone;
  if (!hasKeyStone) {
    return { canTransform: false, reason: 'no_key_stone' };
  }

  // Check Bond Level
  const bondLevel = pokemon.bond_level || 0;
  if (bondLevel < 2) {
    return { canTransform: false, reason: 'bond_level_too_low' };
  }

  return { canTransform: true, reason: null };
}

/**
 * T094: Check Z-Move requirements
 * Per Source/rules/rules.json transform-zmove:
 * - Level 6+
 * - Holding Z-Crystal matching move type
 * - Trainer has Z-Ring
 * @param {Object} pokemon - Pokemon to check
 * @param {Object} trainer - Trainer data with items
 * @param {Object} move - Move to empower
 * @returns {{ canTransform: boolean, reason: string|null, matchingMoves: string[] }}
 */
export function checkZMoveRequirements(pokemon, trainer, move) {
  // Check level requirement
  if ((pokemon.level || 1) < 6) {
    return { canTransform: false, reason: 'level_too_low', matchingMoves: [] };
  }

  // Check if holding Z-Crystal
  const heldItem = (pokemon.held_item || pokemon.item || '').toLowerCase();
  const isZCrystal = heldItem.includes('z-crystal') || heldItem.endsWith('-z');
  if (!isZCrystal) {
    return { canTransform: false, reason: 'no_z_crystal', matchingMoves: [] };
  }

  // Check if trainer has Z-Ring
  const hasZRing = trainer?.items?.includes('z-ring') ||
                   trainer?.z_ring ||
                   trainer?.has_z_ring;
  if (!hasZRing) {
    return { canTransform: false, reason: 'no_z_ring', matchingMoves: [] };
  }

  // Extract Z-Crystal type from item name
  const crystalType = extractZCrystalType(heldItem);

  // Check if move type matches Z-Crystal type
  if (move) {
    const moveType = (move.type || '').toLowerCase();
    if (moveType !== crystalType) {
      return { canTransform: false, reason: 'type_mismatch', matchingMoves: [] };
    }
  }

  // Find all matching moves
  const matchingMoves = (pokemon.moves || [])
    .filter(m => {
      const mType = (typeof m === 'object' ? m.type : '').toLowerCase();
      return mType === crystalType;
    })
    .map(m => typeof m === 'object' ? m.id : m);

  if (matchingMoves.length === 0 && !move) {
    return { canTransform: false, reason: 'no_matching_moves', matchingMoves: [] };
  }

  return { canTransform: true, reason: null, matchingMoves };
}

/**
 * Extract Z-Crystal type from item name
 * @param {string} itemName - Z-Crystal item name
 * @returns {string} Type name
 */
function extractZCrystalType(itemName) {
  const typeMap = {
    'normalium': 'normal',
    'firium': 'fire',
    'waterium': 'water',
    'electrium': 'electric',
    'grassium': 'grass',
    'icium': 'ice',
    'fightinium': 'fighting',
    'poisonium': 'poison',
    'groundium': 'ground',
    'flyinium': 'flying',
    'psychium': 'psychic',
    'buginium': 'bug',
    'rockium': 'rock',
    'ghostium': 'ghost',
    'dragonium': 'dragon',
    'darkinium': 'dark',
    'steelium': 'steel',
    'fairium': 'fairy'
  };

  const item = itemName.toLowerCase();
  for (const [prefix, type] of Object.entries(typeMap)) {
    if (item.includes(prefix)) {
      return type;
    }
  }

  // Try extracting type directly
  const typeMatch = item.match(/(\w+)-z/);
  if (typeMatch) {
    return typeMatch[1];
  }

  return 'normal';
}

/**
 * T095: Check Dynamax requirements
 * Per Source/rules/rules.json transform-dynamax:
 * - Level 10+
 * - Enough space for Gargantuan creature
 * - Trainer has Dynamax Band
 * @param {Object} pokemon - Pokemon to check
 * @param {Object} trainer - Trainer data with items
 * @param {Object} battleState - Current battle state (for space check)
 * @returns {{ canTransform: boolean, reason: string|null }}
 */
export function checkDynamaxRequirements(pokemon, trainer, battleState) {
  // Check level requirement
  if ((pokemon.level || 1) < 10) {
    return { canTransform: false, reason: 'level_too_low' };
  }

  // Check if trainer has Dynamax Band
  const hasDynamaxBand = trainer?.items?.includes('dynamax-band') ||
                         trainer?.dynamax_band ||
                         trainer?.has_dynamax_band;
  if (!hasDynamaxBand) {
    return { canTransform: false, reason: 'no_dynamax_band' };
  }

  // Check space for Gargantuan (4x4 cells = 20x20 feet)
  if (battleState?.grid) {
    const grid = battleState.grid;
    const position = pokemon.position || pokemon.grid_position;

    if (position) {
      // Need 4x4 space for Gargantuan
      const spaceNeeded = 4;
      const { col, row } = position;

      // Simple boundary check
      if (col + spaceNeeded > (grid.width || 10) ||
          row + spaceNeeded > (grid.height || 10)) {
        return { canTransform: false, reason: 'insufficient_space' };
      }

      // Check for obstacles in the area
      const obstacles = battleState.obstacles || [];
      for (let c = col; c < col + spaceNeeded; c++) {
        for (let r = row; r < row + spaceNeeded; r++) {
          if (obstacles.some(o => o.col === c && o.row === r)) {
            return { canTransform: false, reason: 'insufficient_space' };
          }
        }
      }
    }
  }

  return { canTransform: true, reason: null };
}

/**
 * T096: Check Terastallization requirements
 * Per Source/rules/rules.json transform-tera:
 * - Level 6+
 * - Trainer has Tera Orb
 * @param {Object} pokemon - Pokemon to check
 * @param {Object} trainer - Trainer data with items
 * @returns {{ canTransform: boolean, reason: string|null, teraType: string|null }}
 */
export function checkTeraRequirements(pokemon, trainer) {
  // Check level requirement
  if ((pokemon.level || 1) < 6) {
    return { canTransform: false, reason: 'level_too_low', teraType: null };
  }

  // Check if trainer has Tera Orb
  const hasTeraOrb = trainer?.items?.includes('tera-orb') ||
                     trainer?.tera_orb ||
                     trainer?.has_tera_orb;
  if (!hasTeraOrb) {
    return { canTransform: false, reason: 'no_tera_orb', teraType: null };
  }

  // Get Tera Type (defaults to primary type)
  const teraType = pokemon.tera_type ||
                   (pokemon.type || pokemon.types || [])[0] ||
                   'normal';

  return { canTransform: true, reason: null, teraType: teraType.toLowerCase() };
}

/**
 * T097: Apply Mega Evolution to a combatant
 * Per Source/rules/rules.json:
 * - Use Mega stat block for new stats, abilities, typing
 * - Lasts until combat ends or 1 minute outside combat
 * @param {Object} combatant - Combatant to transform
 * @param {Object} megaData - Mega Evolution stat block data
 * @returns {Object} Updated combatant with Mega stats
 */
export function applyMegaEvolution(combatant, megaData = {}) {
  const transformed = { ...combatant };

  // Store original data for reverting
  transformed.pre_mega_state = {
    types: combatant.types || combatant.type,
    ability_id: combatant.ability_id,
    attributes: { ...combatant.attributes },
    ac: combatant.ac
  };

  // Apply Mega stats if provided
  if (megaData) {
    if (megaData.types) {
      transformed.types = megaData.types;
      transformed.type = megaData.types;
    }
    if (megaData.ability_id) {
      transformed.ability_id = megaData.ability_id;
    }
    if (megaData.attributes) {
      transformed.attributes = { ...combatant.attributes, ...megaData.attributes };
    }
    if (megaData.ac) {
      transformed.ac = megaData.ac;
    }
  }

  // Set transformation state
  transformed.transformation = {
    type: TransformationType.MEGA,
    turns_remaining: null, // Lasts until combat ends
    applied_at: Date.now()
  };

  return transformed;
}

/**
 * T098: Apply Z-Move empowerment
 * Per Source/rules/rules.json:
 * - Cannot miss
 * - Save DC +5
 * - Double dice and MOVE bonus for damage/healing
 * - Stackable effects get 2 extra stacks
 * @param {Object} combatant - Combatant using Z-Move
 * @param {Object} move - Move to empower
 * @returns {Object} Empowered move data
 */
export function applyZMove(combatant, move) {
  if (!move) return move;

  const empoweredMove = { ...move };

  // Z-Move cannot miss
  empoweredMove.z_powered = true;
  empoweredMove.auto_hit = true;

  // Increase save DC by 5
  if (empoweredMove.save_dc) {
    empoweredMove.save_dc = (empoweredMove.save_dc || 0) + 5;
  }
  empoweredMove.z_save_bonus = 5;

  // Double damage dice
  if (empoweredMove.damage) {
    const diceMatch = empoweredMove.damage.match(/(\d+)d(\d+)/);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10) * 2;
      const diceSize = diceMatch[2];
      empoweredMove.damage = empoweredMove.damage.replace(
        /\d+d\d+/,
        `${numDice}d${diceSize}`
      );
    }
    empoweredMove.z_dice_multiplier = 2;
  }

  // Double MOVE bonus (tracked for calculation)
  empoweredMove.z_move_bonus_multiplier = 2;

  // Stackable effects get 2 extra stacks
  empoweredMove.z_extra_stacks = 2;

  // Mark as Z-Move for name display
  empoweredMove.is_z_move = true;
  empoweredMove.z_name = `Z-${move.name || 'Move'}`;

  return empoweredMove;
}

/**
 * T099: Apply Dynamax transformation
 * Per Source/rules/rules.json:
 * - Gain temporary HP equal to current HP
 * - Size becomes Gargantuan
 * - Immune to non-volatile status (flinch, confusion, prone)
 * - Cannot be switched out
 * - Damage rolls rolled twice, choose either
 * @param {Object} combatant - Combatant to Dynamax
 * @returns {Object} Updated combatant with Dynamax state
 */
export function applyDynamax(combatant) {
  const transformed = { ...combatant };

  // Store original data
  transformed.pre_dynamax_state = {
    size: combatant.size,
    temp_hp: combatant.temp_hp || 0
  };

  // Gain temporary HP equal to current HP
  transformed.temp_hp = (transformed.temp_hp || 0) + transformed.current_hp;

  // Size becomes Gargantuan
  transformed.size = 'gargantuan';

  // Set transformation state
  transformed.transformation = {
    type: TransformationType.DYNAMAX,
    turns_remaining: DYNAMAX_TURNS,
    applied_at: Date.now()
  };

  // Flags for Dynamax effects
  transformed.is_dynamaxed = true;
  transformed.immune_to_switching = true;
  transformed.immune_to_flinch = true;
  transformed.immune_to_confusion = true;
  transformed.immune_to_prone = true;
  transformed.damage_roll_advantage = true; // Roll twice, choose either

  return transformed;
}

/**
 * T100: Apply Terastallization
 * Per Source/rules/rules.json:
 * - Type changes to Tera Type
 * - Retains STAB bonus of original typing
 * - If Tera Type matches original, STAB doubles
 * - Cannot have type changed by other effects
 * - Becomes vulnerable to Stellar damage
 * @param {Object} combatant - Combatant to Terastallize
 * @returns {Object} Updated combatant with Tera type
 */
export function applyTerastallization(combatant) {
  const transformed = { ...combatant };

  // Store original types for STAB calculation
  const originalTypes = combatant.types || combatant.type || [];
  transformed.original_types = Array.isArray(originalTypes) ? originalTypes : [originalTypes];

  // Get Tera Type
  const teraType = combatant.tera_type ||
                   transformed.original_types[0] ||
                   'normal';

  // Check if Tera Type matches original for double STAB
  const teraTypeLower = teraType.toLowerCase();
  const matchesOriginal = transformed.original_types
    .map(t => t.toLowerCase())
    .includes(teraTypeLower);

  // Change type to Tera Type
  transformed.types = [teraType];
  transformed.type = [teraType];

  // Set transformation state
  transformed.transformation = {
    type: TransformationType.TERASTALLIZATION,
    turns_remaining: TERA_DURATION_TURNS, // Lasts until combat ends
    applied_at: Date.now(),
    tera_type: teraType,
    original_types: transformed.original_types,
    double_stab: matchesOriginal
  };

  // Flags for Tera effects
  transformed.is_terastallized = true;
  transformed.tera_type = teraType;
  transformed.type_lock = true; // Cannot have type changed by other effects
  transformed.stellar_vulnerable = true; // Vulnerable to Stellar damage

  // STAB configuration
  transformed.tera_stab_types = [...transformed.original_types, teraType];
  transformed.tera_double_stab_type = matchesOriginal ? teraType : null;

  return transformed;
}

/**
 * T101: Check if a transformation should revert
 * @param {Object} combatant - Combatant with transformation
 * @param {Object} battleState - Current battle state
 * @returns {{ shouldRevert: boolean, reason: string|null }}
 */
export function checkTransformationRevert(combatant, battleState) {
  if (!combatant.transformation) {
    return { shouldRevert: false, reason: null };
  }

  const { type, turns_remaining } = combatant.transformation;

  // Check duration for Dynamax
  if (type === TransformationType.DYNAMAX && turns_remaining !== null) {
    if (turns_remaining <= 0) {
      return { shouldRevert: true, reason: 'duration_expired' };
    }

    // Dynamax reverts when temp HP is depleted
    if ((combatant.temp_hp || 0) <= 0) {
      return { shouldRevert: true, reason: 'temp_hp_depleted' };
    }
  }

  // Check if Pokemon fainted
  if (combatant.current_hp <= 0) {
    return { shouldRevert: true, reason: 'fainted' };
  }

  // Check if combat ended
  if (battleState?.status === 'ended' || battleState?.status === 'completed') {
    return { shouldRevert: true, reason: 'combat_ended' };
  }

  return { shouldRevert: false, reason: null };
}

/**
 * Revert a transformation
 * @param {Object} combatant - Combatant to revert
 * @returns {Object} Updated combatant without transformation
 */
export function revertTransformation(combatant) {
  if (!combatant.transformation) {
    return combatant;
  }

  const reverted = { ...combatant };
  const transformType = combatant.transformation.type;

  // Restore based on transformation type
  if (transformType === TransformationType.MEGA && reverted.pre_mega_state) {
    reverted.types = reverted.pre_mega_state.types;
    reverted.type = reverted.pre_mega_state.types;
    reverted.ability_id = reverted.pre_mega_state.ability_id;
    reverted.attributes = reverted.pre_mega_state.attributes;
    reverted.ac = reverted.pre_mega_state.ac;
    delete reverted.pre_mega_state;
  }

  if (transformType === TransformationType.DYNAMAX && reverted.pre_dynamax_state) {
    reverted.size = reverted.pre_dynamax_state.size;
    reverted.temp_hp = reverted.pre_dynamax_state.temp_hp;
    delete reverted.pre_dynamax_state;
    delete reverted.is_dynamaxed;
    delete reverted.immune_to_switching;
    delete reverted.immune_to_flinch;
    delete reverted.immune_to_confusion;
    delete reverted.immune_to_prone;
    delete reverted.damage_roll_advantage;
  }

  if (transformType === TransformationType.TERASTALLIZATION) {
    if (reverted.original_types) {
      reverted.types = reverted.original_types;
      reverted.type = reverted.original_types;
      delete reverted.original_types;
    }
    delete reverted.is_terastallized;
    delete reverted.tera_type;
    delete reverted.type_lock;
    delete reverted.stellar_vulnerable;
    delete reverted.tera_stab_types;
    delete reverted.tera_double_stab_type;
  }

  reverted.transformation = null;

  return reverted;
}

/**
 * Tick transformation duration at end of turn
 * @param {Object} combatant - Combatant with transformation
 * @returns {Object} Updated combatant with decremented duration
 */
export function tickTransformationDuration(combatant) {
  if (!combatant.transformation || combatant.transformation.turns_remaining === null) {
    return combatant;
  }

  const updated = { ...combatant };
  updated.transformation = {
    ...updated.transformation,
    turns_remaining: updated.transformation.turns_remaining - 1
  };

  return updated;
}

/**
 * Get STAB multiplier considering Terastallization
 * @param {Object} combatant - Combatant using move
 * @param {string} moveType - Type of move being used
 * @returns {number} STAB multiplier (1 = no STAB, 1.5 = normal STAB, 2 = double STAB from Tera)
 */
export function getTeraSTABMultiplier(combatant, moveType) {
  const moveLower = moveType.toLowerCase();

  // Not terastallized - use normal STAB
  if (!combatant.is_terastallized) {
    const types = (combatant.types || combatant.type || []).map(t => t.toLowerCase());
    return types.includes(moveLower) ? 1.5 : 1;
  }

  // Terastallized - check for double STAB
  const stabTypes = (combatant.tera_stab_types || []).map(t => t.toLowerCase());

  if (!stabTypes.includes(moveLower)) {
    return 1; // No STAB
  }

  // Double STAB if Tera Type matches original and this is that type
  if (combatant.tera_double_stab_type &&
      combatant.tera_double_stab_type.toLowerCase() === moveLower) {
    return 2;
  }

  return 1.5; // Normal STAB
}

/**
 * Check if a move should use Z-Move empowerment
 * @param {Object} combatant - Combatant with Z-Crystal
 * @param {Object} move - Move to check
 * @param {boolean} useZMove - Whether player chose to use Z-Move
 * @returns {boolean} True if Z-Move should be applied
 */
export function shouldUseZMove(combatant, move, useZMove) {
  if (!useZMove) return false;
  if (combatant.z_move_used_this_battle) return false;

  // Check Z-Crystal type matches move type
  const heldItem = (combatant.held_item || combatant.item || '').toLowerCase();
  if (!heldItem.includes('z')) return false;

  const crystalType = extractZCrystalType(heldItem);
  const moveType = (move.type || '').toLowerCase();

  return crystalType === moveType;
}

/**
 * Check if a combatant can be switched out
 * @param {Object} combatant - Combatant to check
 * @returns {{ canSwitch: boolean, reason: string|null }}
 */
export function canSwitchOut(combatant) {
  if (combatant.is_dynamaxed || combatant.immune_to_switching) {
    return { canSwitch: false, reason: 'dynamaxed' };
  }

  return { canSwitch: true, reason: null };
}

/**
 * Check if combatant is immune to a status due to Dynamax
 * @param {Object} combatant - Combatant to check
 * @param {string} statusType - Status type to check
 * @returns {boolean} True if immune
 */
export function isDynamaxStatusImmune(combatant, statusType) {
  if (!combatant.is_dynamaxed) return false;

  const immuneStatuses = ['FLINCHED', 'CONFUSED', 'PRONE'];
  return immuneStatuses.includes(statusType.toUpperCase());
}
