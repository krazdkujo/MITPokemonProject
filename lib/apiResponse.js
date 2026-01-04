/**
 * API Response Helper
 *
 * Provides consistent JSON envelope for all API responses
 * following the Educational API Design principle (Constitution VII).
 *
 * Response format:
 * {
 *   success: boolean,
 *   data?: object,
 *   error?: {
 *     code: string,
 *     message: string,
 *     details?: Record<string, string>
 *   }
 * }
 */

/**
 * Send a successful response
 * @param {object} res - Next.js response object
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 * @param {object} res - Next.js response object
 * @param {string} code - Error code (e.g., 'VALIDATION_ERROR')
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {object} details - Optional field-level error details
 */
export function sendError(res, code, message, statusCode = 400, details = null) {
  const error = {
    code,
    message,
  };

  if (details) {
    error.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error,
  });
}

/**
 * Common error response helpers
 */

export function sendValidationError(res, message, details) {
  return sendError(res, 'VALIDATION_ERROR', message, 400, details);
}

export function sendNotFoundError(res, message) {
  return sendError(res, 'NOT_FOUND', message, 404);
}

export function sendUnauthorizedError(res, message = 'Unauthorized') {
  return sendError(res, 'UNAUTHORIZED', message, 401);
}

export function sendForbiddenError(res, message = 'Forbidden') {
  return sendError(res, 'FORBIDDEN', message, 403);
}

export function sendInternalError(res, message = 'An unexpected error occurred') {
  return sendError(
    res,
    'INTERNAL_ERROR',
    message,
    500,
    { hint: 'Check server logs for more information' }
  );
}

export function sendDatabaseError(res, message = 'Database operation failed') {
  return sendError(
    res,
    'DATABASE_ERROR',
    message,
    503,
    { hint: 'Check database connection and configuration' }
  );
}

/**
 * Method not allowed helper
 * @param {object} res - Next.js response object
 * @param {string[]} allowedMethods - Array of allowed HTTP methods
 */
export function sendMethodNotAllowed(res, allowedMethods) {
  res.setHeader('Allow', allowedMethods.join(', '));
  return sendError(
    res,
    'METHOD_NOT_ALLOWED',
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    405
  );
}

/**
 * Combat-specific error codes and helpers
 * Feature: 007-combat-engine
 */

// Error code constants for combat system
export const CombatErrorCodes = {
  MOVE_NOT_FOUND: 'MOVE_NOT_FOUND',
  NO_PP_REMAINING: 'NO_PP_REMAINING',
  INVALID_POWER_STAT: 'INVALID_POWER_STAT',
  POKEMON_FAINTED: 'POKEMON_FAINTED',
  INVALID_BATTLE_STATE: 'INVALID_BATTLE_STATE',
  POKEMON_NOT_OWNED: 'POKEMON_NOT_OWNED',
  BATTLE_ALREADY_ENDED: 'BATTLE_ALREADY_ENDED',
  INVALID_MOVE_FOR_POKEMON: 'INVALID_MOVE_FOR_POKEMON',
  OPPONENT_NOT_FOUND: 'OPPONENT_NOT_FOUND',
  INVALID_OPPONENT_LEVEL: 'INVALID_OPPONENT_LEVEL'
};

export function sendMoveNotFoundError(res, moveId) {
  return sendError(res, CombatErrorCodes.MOVE_NOT_FOUND, 'Move not found', 400, {
    move_id: moveId,
    hint: 'Check that the move_id exists in Source data'
  });
}

export function sendNoPPRemainingError(res, moveId, availableMoves = []) {
  return sendError(res, CombatErrorCodes.NO_PP_REMAINING, 'No PP remaining for this move', 400, {
    move_id: moveId,
    available_moves: availableMoves,
    hint: 'Use a different move or use Struggle if all moves are exhausted'
  });
}

export function sendPokemonFaintedError(res) {
  return sendError(res, CombatErrorCodes.POKEMON_FAINTED, 'This Pokemon has fainted and cannot battle', 422, {
    hint: 'Heal your Pokemon at a Pokemon Center first'
  });
}

export function sendInvalidBattleStateError(res, details = {}) {
  return sendError(res, CombatErrorCodes.INVALID_BATTLE_STATE, 'Invalid or malformed battle state', 400, details);
}

export function sendBattleAlreadyEndedError(res, outcome) {
  return sendError(res, CombatErrorCodes.BATTLE_ALREADY_ENDED, 'Battle has already ended', 409, {
    outcome: outcome,
    hint: 'Start a new battle to continue'
  });
}
