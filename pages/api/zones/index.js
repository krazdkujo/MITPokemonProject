/**
 * Zones API Endpoint
 *
 * GET /api/zones - Returns all encounter zones grouped by terrain
 *
 * Feature: 016-zone-encounters
 */

import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendMethodNotAllowed,
  sendUnauthorizedError,
  sendInternalError
} from '../../../lib/apiResponse';
import { getZonesWithGroups, getEncounterPoolCount } from '../../../lib/zoneData';

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

    // Get zones with terrain groups
    const { zones, terrainGroups } = getZonesWithGroups();

    // Add pokemon count to each zone
    const zonesWithCounts = zones.map(zone => ({
      ...zone,
      pokemonCount: getEncounterPoolCount(zone.id)
    }));

    return sendSuccess(res, {
      zones: zonesWithCounts,
      terrainGroups
    });
  } catch (error) {
    console.error('Zones API error:', error);
    return sendInternalError(res, 'Failed to load zones');
  }
}
