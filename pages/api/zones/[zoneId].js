/**
 * Zone Detail API Endpoint
 *
 * GET /api/zones/:zoneId - Returns details for a specific zone with encounter pool sample
 *
 * Feature: 016-zone-encounters
 */

import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendMethodNotAllowed,
  sendUnauthorizedError,
  sendNotFoundError,
  sendInternalError
} from '../../../lib/apiResponse';
import {
  getZoneById,
  getDifficultyLabel,
  getEncounterPoolCount,
  getEncounterPoolSample
} from '../../../lib/zoneData';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    const { zoneId } = req.query;

    // Get zone by ID
    const zone = getZoneById(zoneId);
    if (!zone) {
      return sendNotFoundError(res, `Zone not found: ${zoneId}`);
    }

    // Build response with encounter pool info
    const response = {
      zone: {
        id: zone.id,
        name: zone.name,
        terrain: zone.terrain,
        difficulty: zone.difficulty,
        difficultyLabel: getDifficultyLabel(zone.difficulty),
        description: zone.description,
        types: zone.types,
        srRange: zone.srRange
      },
      encounterPool: {
        count: getEncounterPoolCount(zone.id),
        sample: getEncounterPoolSample(zone.id, 3)
      }
    };

    return sendSuccess(res, response);
  } catch (error) {
    console.error('Zone Detail API error:', error);
    return sendInternalError(res, 'Failed to load zone details');
  }
}
