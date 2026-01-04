/**
 * Item Data Utilities
 *
 * Provides functions to load and merge item data from Source files
 * with database records, following the Two-Tier Data Model principle.
 *
 * Feature: 009-shop-api
 */

import fs from 'fs';
import path from 'path';

// Cache for loaded items data
let itemsCache = null;

/**
 * Load all items from Source/items/items.json
 * @returns {Array} Array of all item objects
 */
export function getAllItems() {
  if (itemsCache) {
    return itemsCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'items', 'items.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  itemsCache = JSON.parse(fileContents);
  return itemsCache;
}

/**
 * Get a single item by ID from Source data
 * @param {string} itemId - Item ID (e.g., "poke-ball", "potion")
 * @returns {Object|null} Item object or null if not found
 */
export function getItemById(itemId) {
  if (!itemId) return null;
  const allItems = getAllItems();
  return allItems.find(item => item.id === itemId) || null;
}

/**
 * Get all items that can be purchased (cost is not null)
 * @returns {Array} Array of purchasable item objects
 */
export function getPurchasableItems() {
  const allItems = getAllItems();
  return allItems.filter(item => item.cost !== null);
}

/**
 * Check if an item exists in the Source catalog
 * @param {string} itemId - Item ID to validate
 * @returns {boolean} True if item exists
 */
export function isValidItemId(itemId) {
  return getItemById(itemId) !== null;
}

/**
 * Check if an item is purchasable (exists and has a non-null cost)
 * @param {string} itemId - Item ID to check
 * @returns {boolean} True if purchasable
 */
export function isPurchasable(itemId) {
  const item = getItemById(itemId);
  return item !== null && item.cost !== null;
}

/**
 * Merge a database player_inventory record with Source item data
 * @param {Object} dbRecord - Database record with item_id, quantity
 * @returns {Object} Merged object with Source item data included
 */
export function buildPlayerInventoryItemResponse(dbRecord) {
  const sourceItem = getItemById(dbRecord.item_id);

  if (!sourceItem) {
    // Return minimal data if source item not found
    return {
      item_id: dbRecord.item_id,
      quantity: dbRecord.quantity,
      name: 'Unknown Item',
      type: 'unknown',
      description: '',
      cost: null,
    };
  }

  return {
    item_id: dbRecord.item_id,
    quantity: dbRecord.quantity,
    name: sourceItem.name,
    type: sourceItem.type,
    description: sourceItem.description,
    cost: sourceItem.cost,
  };
}

/**
 * Build response for multiple player inventory records
 * @param {Array} dbRecords - Array of database records
 * @returns {Array} Array of merged inventory item objects
 */
export function buildPlayerInventoryResponse(dbRecords) {
  return dbRecords.map(record => buildPlayerInventoryItemResponse(record));
}
