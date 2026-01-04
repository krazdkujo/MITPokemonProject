/**
 * Locations API Endpoint
 *
 * GET /api/locations - Returns all available encounter locations
 *
 * Feature: 014-wild-encounter
 */

import { getAllLocations } from '../../lib/locationData';
import { sendSuccess, sendMethodNotAllowed } from '../../lib/apiResponse';

export default function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  try {
    const locations = getAllLocations();

    return sendSuccess(res, { locations });
  } catch (error) {
    console.error('Locations API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load locations'
      }
    });
  }
}
