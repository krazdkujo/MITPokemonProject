/**
 * Initiative Utilities
 * Handles initiative rolling and turn order for Pokemon 5e combat
 *
 * Feature: 007-combat-engine
 */

const { rollD20 } = require('./diceRoller');
const { getAttributeModifier } = require('./combatUtils');

/**
 * Roll initiative for a Pokemon
 * Initiative = d20 + DEX modifier
 *
 * @param {Object} pokemon - Pokemon with attributes.dex
 * @returns {{ natural_roll: number, modifier: number, total: number }}
 */
function rollInitiative(pokemon) {
  const dexScore = pokemon.attributes?.dex || 10;
  const modifier = getAttributeModifier(dexScore);
  const natural_roll = rollD20();

  return {
    natural_roll,
    modifier,
    total: natural_roll + modifier
  };
}

/**
 * Sort combatants by initiative (highest first)
 * Ties are broken by DEX score (higher goes first)
 *
 * @param {Object[]} combatants - Array of combatants with initiative_roll and attributes
 * @returns {Object[]} Sorted array of combatants
 */
function sortByInitiative(combatants) {
  return [...combatants].sort((a, b) => {
    // First compare by total initiative
    const aTotal = a.initiative_roll?.total || 0;
    const bTotal = b.initiative_roll?.total || 0;

    if (bTotal !== aTotal) {
      return bTotal - aTotal; // Higher goes first
    }

    // Tie-breaker: higher DEX score
    const aDex = a.attributes?.dex || 10;
    const bDex = b.attributes?.dex || 10;

    return bDex - aDex; // Higher DEX goes first
  });
}

/**
 * Determine which combatant acts first between player and opponent
 *
 * @param {Object} playerPokemon - Player's Pokemon with attributes
 * @param {Object} opponent - Opponent Pokemon with attributes
 * @returns {{ player: Object, opponent: Object, initiative_order: string[], first_to_act: string }}
 */
function determineFirstActor(playerPokemon, opponent) {
  // Roll initiative for both
  const playerInit = rollInitiative(playerPokemon);
  const opponentInit = rollInitiative(opponent);

  // Attach rolls to Pokemon objects
  playerPokemon.initiative_roll = playerInit;
  opponent.initiative_roll = opponentInit;

  // Determine order
  const combatants = [
    { ...playerPokemon, owner: 'player' },
    { ...opponent, owner: 'opponent' }
  ];

  const sorted = sortByInitiative(combatants);
  const firstToAct = sorted[0].owner;

  return {
    player: playerPokemon,
    opponent: opponent,
    initiative_order: sorted.map(c => c.owner),
    first_to_act: firstToAct
  };
}

/**
 * Get the next combatant in turn order
 *
 * @param {string[]} initiativeOrder - Array of combatant owners in order
 * @param {number} currentTurnIndex - Current index in the order
 * @returns {{ nextOwner: string, nextIndex: number, newRound: boolean }}
 */
function getNextInOrder(initiativeOrder, currentTurnIndex) {
  const nextIndex = (currentTurnIndex + 1) % initiativeOrder.length;
  const newRound = nextIndex === 0;

  return {
    nextOwner: initiativeOrder[nextIndex],
    nextIndex,
    newRound
  };
}

/**
 * Create initiative order array for multiple combatants
 *
 * @param {Object[]} combatants - Array of combatants
 * @returns {string[]} Array of combatant_id or owner strings in initiative order
 */
function createInitiativeOrder(combatants) {
  // Roll initiative for each combatant that doesn't have a roll
  for (const combatant of combatants) {
    if (!combatant.initiative_roll) {
      combatant.initiative_roll = rollInitiative(combatant);
    }
  }

  const sorted = sortByInitiative(combatants);
  return sorted.map(c => c.combatant_id || c.owner);
}

module.exports = {
  rollInitiative,
  sortByInitiative,
  determineFirstActor,
  getNextInOrder,
  createInitiativeOrder
};
