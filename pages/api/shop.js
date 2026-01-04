/**
 * Shop API Endpoint
 *
 * GET /api/shop - Get purchasable item catalog (no auth required)
 * POST /api/shop - Purchase items (auth required)
 *
 * Feature: 009-shop-api
 */

import { createAdminClient } from '../../lib/supabase';
import { authenticateRequest } from '../../lib/authHelper';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
  sendValidationError,
  sendInsufficientFundsError,
  sendItemNotFoundError,
  sendItemNotPurchasableError,
} from '../../lib/apiResponse';
import {
  getItemById,
  getPurchasableItems,
} from '../../lib/itemData';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetCatalog(req, res);
  } else if (req.method === 'POST') {
    return handlePurchase(req, res);
  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST']);
  }
}

/**
 * GET /api/shop - Return purchasable item catalog
 * No authentication required for browsing
 */
async function handleGetCatalog(req, res) {
  try {
    const items = getPurchasableItems();

    return sendSuccess(res, {
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error in GET /api/shop:', error);
    return sendInternalError(res, 'Failed to load item catalog');
  }
}

/**
 * POST /api/shop - Purchase items
 * Requires authentication
 */
async function handlePurchase(req, res) {
  try {
    // T006: JWT authentication
    const { userId, error: authError } = await authenticateRequest(req);
    if (!userId) {
      return sendUnauthorizedError(res, authError || 'Authentication required');
    }

    // T007: Validate request body
    const { item_id, quantity } = req.body;

    if (!item_id) {
      return sendValidationError(res, 'item_id is required', {
        field: 'item_id',
      });
    }

    if (quantity === undefined || quantity === null) {
      return sendValidationError(res, 'quantity is required', {
        field: 'quantity',
      });
    }

    // Validate quantity is a positive integer
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return sendValidationError(res, 'Quantity must be a positive integer', {
        field: 'quantity',
        received: quantity,
      });
    }

    // T008: Validate item exists and is purchasable
    const item = getItemById(item_id);
    if (!item) {
      return sendItemNotFoundError(res, item_id);
    }

    if (item.cost === null) {
      return sendItemNotPurchasableError(res, item_id, item.name);
    }

    const totalCost = item.cost * quantity;
    const supabase = createAdminClient();

    // T009: Query user currency balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('currency')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Failed to fetch user currency:', userError);
      return sendInternalError(res, 'Failed to fetch user data');
    }

    const previousBalance = user.currency;

    // T010: Check sufficient funds
    if (previousBalance < totalCost) {
      return sendInsufficientFundsError(
        res,
        totalCost,
        previousBalance,
        item_id,
        item.name,
        quantity
      );
    }

    // T011: Deduct currency from users table
    const newBalance = previousBalance - totalCost;
    const { error: updateCurrencyError } = await supabase
      .from('users')
      .update({ currency: newBalance })
      .eq('id', userId);

    if (updateCurrencyError) {
      console.error('Failed to deduct currency:', updateCurrencyError);
      return sendInternalError(res, 'Failed to process purchase');
    }

    // T012: Upsert inventory row
    // First check if row exists
    const { data: existingInventory, error: checkError } = await supabase
      .from('player_inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', item_id)
      .maybeSingle();

    if (checkError) {
      console.error('Failed to check inventory:', checkError);
      // Rollback currency deduction
      await supabase
        .from('users')
        .update({ currency: previousBalance })
        .eq('id', userId);
      return sendInternalError(res, 'Failed to process purchase');
    }

    let newQuantity;
    if (existingInventory) {
      // Update existing row
      newQuantity = existingInventory.quantity + quantity;
      const { error: updateError } = await supabase
        .from('player_inventory')
        .update({ quantity: newQuantity })
        .eq('id', existingInventory.id);

      if (updateError) {
        console.error('Failed to update inventory:', updateError);
        // Rollback currency deduction
        await supabase
          .from('users')
          .update({ currency: previousBalance })
          .eq('id', userId);
        return sendInternalError(res, 'Failed to process purchase');
      }
    } else {
      // Insert new row
      newQuantity = quantity;
      const { error: insertError } = await supabase
        .from('player_inventory')
        .insert({
          user_id: userId,
          item_id: item_id,
          quantity: quantity,
        });

      if (insertError) {
        console.error('Failed to insert inventory:', insertError);
        // Rollback currency deduction
        await supabase
          .from('users')
          .update({ currency: previousBalance })
          .eq('id', userId);
        return sendInternalError(res, 'Failed to process purchase');
      }
    }

    // T013: Return success response
    return sendSuccess(res, {
      purchased: {
        item_id: item_id,
        name: item.name,
        quantity: quantity,
        total_cost: totalCost,
      },
      inventory: {
        item_id: item_id,
        name: item.name,
        quantity: newQuantity,
      },
      balance: {
        previous: previousBalance,
        spent: totalCost,
        remaining: newBalance,
      },
    });

  } catch (error) {
    // T014: Error handling for database failures
    console.error('Error in POST /api/shop:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}
