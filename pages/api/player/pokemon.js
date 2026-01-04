import { createAdminClient } from '../../../lib/supabase';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../../lib/apiResponse';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  isValidPokemonId,
  isStarterEligible,
  buildPlayerPokemonResponse,
  buildPlayerPokemonListResponse,
} from '../../../lib/pokemonData';

/**
 * /api/player/pokemon
 *
 * GET: Retrieve the authenticated user's Pokemon roster
 * POST: Add a Pokemon to the user's roster (used for starter selection)
 */
export default async function handler(req, res) {
  // Authenticate request
  const { userId, error: authError } = await authenticateRequest(req);
  if (!userId) {
    return sendUnauthorizedError(res, authError || 'Authentication required');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, userId);
  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST']);
  }
}

/**
 * GET /api/player/pokemon
 *
 * Returns the user's Pokemon roster with Source data merged,
 * plus dashboard summary stats (box_count, pokedex_caught, badge_count).
 */
async function handleGet(req, res, userId) {
  try {
    const supabase = createAdminClient();

    const { data: playerPokemon, error } = await supabase
      .from('player_pokemon')
      .select('*')
      .eq('user_id', userId)
      .order('slot_number', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch player Pokemon:', error);
      return sendInternalError(res, 'Failed to fetch Pokemon roster');
    }

    const pokemon = buildPlayerPokemonListResponse(playerPokemon || []);
    const activeCount = pokemon.filter(p => p.is_active).length;
    const boxCount = pokemon.filter(p => !p.is_active).length;

    // Calculate Pokedex progress (distinct pokemon_id count)
    const uniqueSpecies = new Set(pokemon.map(p => p.pokemon_id));
    const pokedexCaught = uniqueSpecies.size;

    // Badge count placeholder (0 until badges are implemented)
    const badgeCount = 0;

    return sendSuccess(res, {
      pokemon,
      has_starter: pokemon.length > 0,
      active_count: activeCount,
      box_count: boxCount,
      pokedex_caught: pokedexCaught,
      badge_count: badgeCount,
      total_count: pokemon.length,
    });
  } catch (error) {
    console.error('Error in GET /api/player/pokemon:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}

/**
 * POST /api/player/pokemon
 *
 * Add a Pokemon to the user's roster.
 * If is_starter=true, validates starter eligibility and ensures user has no existing Pokemon.
 */
async function handlePost(req, res, userId) {
  try {
    const { pokemon_id, is_starter } = req.body;

    // Validate pokemon_id is provided
    if (!pokemon_id || typeof pokemon_id !== 'string') {
      return sendValidationError(res, 'Pokemon ID is required', {
        pokemon_id: 'Must provide a valid Pokemon ID',
      });
    }

    // Validate pokemon_id exists in Source data
    if (!isValidPokemonId(pokemon_id)) {
      return sendValidationError(res, 'Invalid Pokemon selection', {
        pokemon_id: 'Pokemon not found in source data',
      });
    }

    // If selecting as starter, validate eligibility
    if (is_starter && !isStarterEligible(pokemon_id)) {
      return sendValidationError(res, 'Invalid starter selection', {
        pokemon_id: 'This Pokemon is not eligible as a starter (SR > 0.5)',
      });
    }

    const supabase = createAdminClient();

    // Check if user already has Pokemon (for starter selection)
    if (is_starter) {
      const { data: existingPokemon, error: checkError } = await supabase
        .from('player_pokemon')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (checkError) {
        console.error('Failed to check existing Pokemon:', checkError);
        return sendInternalError(res, 'Failed to verify Pokemon roster');
      }

      if (existingPokemon && existingPokemon.length > 0) {
        return sendError(
          res,
          'STARTER_ALREADY_SELECTED',
          'You have already selected a starter Pokemon',
          409,
          { hint: 'Starter selection is permanent and cannot be changed' }
        );
      }
    }

    // Determine slot_number for new Pokemon
    let slotNumber = null;
    if (is_starter) {
      // Starter always gets slot 1
      slotNumber = 1;
    } else {
      // Find next available slot (for future use)
      const { data: activeSlots } = await supabase
        .from('player_pokemon')
        .select('slot_number')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('slot_number', { ascending: true });

      const usedSlots = new Set(activeSlots?.map(p => p.slot_number) || []);
      for (let i = 1; i <= 6; i++) {
        if (!usedSlots.has(i)) {
          slotNumber = i;
          break;
        }
      }
    }

    // Insert the new Pokemon
    const { data: newPokemon, error: insertError } = await supabase
      .from('player_pokemon')
      .insert({
        user_id: userId,
        pokemon_id: pokemon_id,
        level: 1,
        is_active: is_starter ? true : (slotNumber !== null),
        slot_number: slotNumber,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert Pokemon:', insertError);
      return sendInternalError(res, 'Failed to add Pokemon to roster');
    }

    const responseData = buildPlayerPokemonResponse(newPokemon);

    return sendSuccess(
      res,
      {
        pokemon: responseData,
        message: is_starter
          ? 'Starter Pokemon selected successfully'
          : 'Pokemon added to roster',
      },
      201
    );
  } catch (error) {
    console.error('Error in POST /api/player/pokemon:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}
