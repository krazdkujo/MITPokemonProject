/**
 * Zone Encounter API Endpoint
 *
 * POST /api/zones/encounter - Start an encounter in a zone
 *
 * Creates a persistent battle record in the database with full state.
 * Blocks if user already has an active battle.
 *
 * Feature: 016-zone-encounters
 */

import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '../../../lib/supabase';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorizedError,
  sendForbiddenError,
  sendMethodNotAllowed,
  sendInternalError
} from '../../../lib/apiResponse';
import { getZoneById, selectRandomPokemonFromZone } from '../../../lib/zoneData';
import { buildCombatant, buildOpponentCombatant } from '../../../lib/battleEngine';
import { rollInitiative } from '../../../lib/initiativeUtils';

/**
 * Calculate level based on SR (Species Rating)
 * SR roughly maps to appropriate encounter level in Pokemon 5e
 */
function generateLevelFromSR(sr) {
  if (sr <= 0.125) return Math.floor(Math.random() * 2) + 1; // 1-2
  if (sr <= 0.25) return Math.floor(Math.random() * 2) + 2;  // 2-3
  if (sr <= 0.5) return Math.floor(Math.random() * 2) + 3;   // 3-4
  if (sr <= 1) return Math.floor(Math.random() * 2) + 4;     // 4-5
  if (sr <= 2) return Math.floor(Math.random() * 2) + 5;     // 5-6
  if (sr <= 3) return Math.floor(Math.random() * 2) + 6;     // 6-7
  if (sr <= 4) return Math.floor(Math.random() * 2) + 7;     // 7-8
  if (sr <= 5) return Math.floor(Math.random() * 2) + 8;     // 8-9
  if (sr <= 6) return Math.floor(Math.random() * 2) + 9;     // 9-10
  if (sr <= 7) return Math.floor(Math.random() * 2) + 10;    // 10-11
  if (sr <= 8) return Math.floor(Math.random() * 2) + 11;    // 11-12
  if (sr <= 10) return Math.floor(Math.random() * 2) + 13;   // 13-14
  if (sr <= 13) return Math.floor(Math.random() * 3) + 15;   // 15-17
  return Math.floor(Math.random() * 3) + 18;                 // 18-20
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    // Validate request body
    const { zone_id, player_pokemon_ids } = req.body;

    if (!zone_id) {
      return sendValidationError(res, 'Missing required field', {
        zone_id: 'Zone ID is required'
      });
    }

    if (!player_pokemon_ids || !Array.isArray(player_pokemon_ids) || player_pokemon_ids.length === 0) {
      return sendValidationError(res, 'Missing required field', {
        player_pokemon_ids: 'At least one Pokemon is required'
      });
    }

    if (player_pokemon_ids.length > 6) {
      return sendValidationError(res, 'Too many Pokemon selected', {
        player_pokemon_ids: 'Maximum 6 Pokemon allowed in battle party'
      });
    }

    // Validate zone exists
    const zone = getZoneById(zone_id);
    if (!zone) {
      return sendValidationError(res, 'Invalid zone', {
        zone_id: `Zone not found: ${zone_id}`
      });
    }

    const supabase = createAdminClient();

    // Check for existing active battle
    const { data: activeBattle, error: activeError } = await supabase
      .from('active_battles')
      .select('id, zone_id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (activeBattle) {
      return sendError(
        res,
        'ACTIVE_BATTLE_EXISTS',
        'You have an active battle in progress',
        409,
        {
          battle_id: activeBattle.id,
          zone_id: activeBattle.zone_id,
          started_at: activeBattle.created_at
        }
      );
    }

    // Verify player owns all Pokemon and fetch their data
    const { data: playerPokemonRecords, error: pokemonError } = await supabase
      .from('player_pokemon')
      .select('*')
      .in('id', player_pokemon_ids);

    if (pokemonError || !playerPokemonRecords || playerPokemonRecords.length === 0) {
      return sendForbiddenError(res, 'You do not own these Pokemon');
    }

    // Verify all Pokemon belong to the user
    for (const record of playerPokemonRecords) {
      if (record.user_id !== userId) {
        return sendForbiddenError(res, 'You do not own one or more of these Pokemon');
      }
    }

    // Check if all Pokemon are fainted
    const activePokemon = playerPokemonRecords.filter(p => p.current_hp > 0);
    if (activePokemon.length === 0) {
      return sendError(
        res,
        'ALL_POKEMON_FAINTED',
        'All selected Pokemon have fainted',
        422,
        { hint: 'Heal your Pokemon at a Pokemon Center first' }
      );
    }

    // Select random wild Pokemon from zone
    const wildPokemon = selectRandomPokemonFromZone(zone_id);
    if (!wildPokemon) {
      return sendInternalError(res, 'No Pokemon available in this zone');
    }

    // Generate level based on SR
    const wildLevel = generateLevelFromSR(wildPokemon.sr || 0.5);

    // Build player combatants
    const playerCombatants = [];
    for (const record of playerPokemonRecords) {
      try {
        const combatant = buildCombatant(record, 'player');
        combatant.initiative_roll = rollInitiative(combatant);
        playerCombatants.push(combatant);
      } catch (buildError) {
        return sendInternalError(res, 'Failed to build player combatant: ' + buildError.message);
      }
    }

    // Build opponent combatant
    let opponentCombatant;
    try {
      opponentCombatant = buildOpponentCombatant(wildPokemon.id, wildLevel);
      opponentCombatant.initiative_roll = rollInitiative(opponentCombatant);
    } catch (buildError) {
      return sendInternalError(res, 'Failed to build opponent combatant: ' + buildError.message);
    }

    // Auto-place opponent in row 9
    opponentCombatant.position = { col: 5, row: 9 };

    // Build initiative order
    const allCombatants = [...playerCombatants, opponentCombatant];
    allCombatants.sort((a, b) => {
      if (b.initiative_roll !== a.initiative_roll) {
        return b.initiative_roll - a.initiative_roll;
      }
      const aDex = a.attributes?.dex || 10;
      const bDex = b.attributes?.dex || 10;
      return bDex - aDex;
    });
    const initiative_order = allCombatants.map(c => c.combatant_id);
    const first_to_act = allCombatants[0].owner;

    // Create battle ID
    const battleId = uuidv4();

    // Build initial battle state for persistence
    const battleState = {
      battle_id: battleId,
      battle_type: 'wild',
      phase: 'setup',
      zone: {
        id: zone.id,
        name: zone.name,
        terrain: zone.terrain
      },
      grid: {
        width: 10,
        height: 10,
        cells: [] // Will be populated on first grid access
      },
      combatants: {
        player: playerCombatants.map(c => ({
          ...c,
          position: null,
          placed: false
        })),
        opponent: [{
          ...opponentCombatant,
          placed: true
        }]
      },
      trainers: {
        player: { col: 0, row: 4 },
        opponent: { col: 9, row: 4 }
      },
      initiative_order,
      current_turn_index: 0,
      round_number: 0,
      battle_log: [],
      outcome: 'ongoing',
      started_at: new Date().toISOString()
    };

    // Insert battle record into database
    const { error: insertError } = await supabase
      .from('active_battles')
      .insert({
        id: battleId,
        user_id: userId,
        zone_id: zone.id,
        battle_state: battleState,
        status: 'active'
      });

    if (insertError) {
      console.error('Failed to insert battle record:', insertError);
      return sendInternalError(res, 'Failed to create battle record');
    }

    // Build response
    const response = {
      battle_id: battleId,
      zone: {
        id: zone.id,
        name: zone.name,
        terrain: zone.terrain
      },
      phase: 'setup',
      grid_mode: true,
      grid: {
        width: 10,
        height: 10,
        deployment_zone: {
          player: { rows: [0, 1] },
          opponent: { rows: [8, 9] }
        }
      },
      player_pokemon: playerCombatants.map(c => ({
        combatant_id: c.combatant_id,
        pokemon_id: c.pokemon_id,
        number: c.number,
        name: c.name,
        level: c.level,
        current_hp: c.current_hp,
        max_hp: c.max_hp,
        ac: c.ac,
        type: c.type,
        attributes: c.attributes,
        known_moves: c.known_moves,
        move_pp: c.move_pp,
        abilities: c.abilities,
        initiative: c.initiative_roll,
        position: null,
        placed: false,
        status_effects: []
      })),
      opponent_pokemon: [{
        combatant_id: opponentCombatant.combatant_id,
        pokemon_id: opponentCombatant.pokemon_id,
        number: opponentCombatant.number,
        name: opponentCombatant.name,
        level: opponentCombatant.level,
        current_hp: opponentCombatant.current_hp,
        max_hp: opponentCombatant.max_hp,
        ac: opponentCombatant.ac,
        type: opponentCombatant.type,
        attributes: opponentCombatant.attributes,
        known_moves: opponentCombatant.known_moves,
        move_pp: opponentCombatant.move_pp,
        abilities: opponentCombatant.abilities,
        initiative: opponentCombatant.initiative_roll,
        position: opponentCombatant.position,
        placed: true,
        status_effects: [],
        moves: opponentCombatant.moves || []
      }],
      initiative_order,
      first_to_act,
      round_number: 0,
      awaiting_placement: true
    };

    return sendSuccess(res, response, 201);

  } catch (error) {
    console.error('Zone Encounter API error:', error);
    return sendInternalError(res, 'An error occurred while starting the encounter');
  }
}
