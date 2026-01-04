/**
 * Battle Engine
 * Core combat logic for Pokemon 5e battle system
 *
 * Feature: 006-battle-api
 */

import { v4 as uuidv4 } from 'uuid';
import { rollD20, rollDice, isCriticalHit, isCriticalMiss } from './diceRoller.js';
import { parseDamageDice } from './diceParser.js';
import { getEffectiveness } from './typeEffectiveness.js';
import {
  getProficiencyBonus,
  getAttributeModifier,
  getBestPowerModifier,
  hasSTAB,
  calculateAttackBonus,
  calculateDamageBonus
} from './combatUtils.js';
import { getMoveById } from './pokemonData.js';

/**
 * Calculate attack roll for a Pokemon using a move
 * Attack Roll = d20 + Move Power Mod + Proficiency Bonus
 *
 * @param {Object} attacker - Attacking Pokemon with attributes and level
 * @param {Object} move - Move being used with power attribute
 * @returns {{ roll: number, modifier: number, total: number, isCrit: boolean, isMiss: boolean }}
 */
export function calculateAttackRoll(attacker, move) {
  const roll = rollD20();
  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  const profBonus = getProficiencyBonus(attacker.level);
  const modifier = powerMod + profBonus;

  return {
    roll,
    modifier,
    total: roll + modifier,
    isCrit: isCriticalHit(roll),
    isMiss: isCriticalMiss(roll)
  };
}

/**
 * Calculate damage for an attack
 * Damage = Dice Roll + Power Mod + STAB + Type Effectiveness
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon with types
 * @param {Object} move - Move being used
 * @param {Object} attackRoll - Result from calculateAttackRoll
 * @returns {{ baseDamage: number, totalDamage: number, effectiveness: Object, stabApplied: boolean, diceExpression: string }}
 */
export function calculateDamage(attacker, defender, move, attackRoll) {
  // Get damage dice for the attacker's level
  const diceExpression = parseDamageDice(move.description, move.higherLevels, attacker.level);

  if (!diceExpression) {
    // Non-damaging move
    return {
      baseDamage: 0,
      totalDamage: 0,
      effectiveness: { multiplier: 1, effectiveness: 'normal' },
      stabApplied: false,
      diceExpression: null
    };
  }

  // Roll the damage dice
  let baseDamage = rollDice(diceExpression);

  // Double damage on critical hit
  if (attackRoll.isCrit) {
    baseDamage *= 2;
  }

  // Add power modifier
  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  let totalDamage = baseDamage + powerMod;

  // Check for STAB
  const stabApplied = hasSTAB(move.type, attacker.type);
  if (stabApplied) {
    totalDamage += getProficiencyBonus(attacker.level);
  }

  // Apply type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.type);
  totalDamage = Math.floor(totalDamage * effectiveness.multiplier);

  // Ensure minimum damage of 0
  totalDamage = Math.max(0, totalDamage);

  return {
    baseDamage,
    totalDamage,
    effectiveness,
    stabApplied,
    diceExpression
  };
}

/**
 * Process a single attack action
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon
 * @param {Object} move - Move to use
 * @returns {Object} Action result object
 */
function executeAttack(attacker, defender, move) {
  const attackRoll = calculateAttackRoll(attacker, move);

  // Check if attack hits (roll + modifier >= defender AC)
  // Critical hit always hits, critical miss always misses
  let hit = false;
  if (attackRoll.isMiss) {
    hit = false;
  } else if (attackRoll.isCrit) {
    hit = true;
  } else {
    hit = attackRoll.total >= defender.ac;
  }

  let damage = 0;
  let damageResult = null;

  if (hit) {
    damageResult = calculateDamage(attacker, defender, move, attackRoll);
    damage = damageResult.totalDamage;
  }

  const hpBefore = defender.current_hp;
  const hpAfter = Math.max(0, hpBefore - damage);

  return {
    pokemon_name: attacker.name,
    move_id: move.id,
    move_name: move.name,
    attack_roll: attackRoll.total,
    target_ac: defender.ac,
    hit,
    damage,
    damage_dice: damageResult?.diceExpression || null,
    effectiveness: damageResult?.effectiveness?.effectiveness || 'normal',
    stab_applied: damageResult?.stabApplied || false,
    critical_hit: attackRoll.isCrit,
    target_hp_before: hpBefore,
    target_hp_after: hpAfter,
    pp_cost: 1
  };
}

/**
 * Process the player's turn in battle
 *
 * @param {Object} playerPokemon - Player's Pokemon with full data
 * @param {Object} opponentPokemon - Opponent Pokemon
 * @param {string} moveId - ID of move to use
 * @returns {Object} Action result and updated opponent HP
 */
export function processPlayerTurn(playerPokemon, opponentPokemon, moveId) {
  const move = getMoveById(moveId);
  if (!move) {
    throw new Error(`Move not found: ${moveId}`);
  }

  const action = executeAttack(playerPokemon, opponentPokemon, move);

  // Update opponent HP
  opponentPokemon.current_hp = action.target_hp_after;

  return action;
}

/**
 * Process the opponent's turn in battle
 * Selects a random move from available moves and attacks
 *
 * @param {Object} opponentPokemon - Opponent Pokemon with moves array
 * @param {Object} playerPokemon - Player's Pokemon
 * @returns {Object} Action result and updated player HP
 */
export function processOpponentTurn(opponentPokemon, playerPokemon) {
  // Select a random move from opponent's available moves
  const availableMoves = opponentPokemon.moves || [];
  if (availableMoves.length === 0) {
    throw new Error('Opponent has no available moves');
  }

  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  const selectedMove = availableMoves[randomIndex];

  const action = executeAttack(opponentPokemon, playerPokemon, selectedMove);

  // Update player HP
  playerPokemon.current_hp = action.target_hp_after;

  return action;
}

/**
 * Process a complete battle turn (player action + opponent action)
 *
 * @param {Object} playerPokemon - Player's Pokemon with full data
 * @param {Object} opponent - Opponent Pokemon
 * @param {string} moveId - ID of move player wants to use
 * @param {number} turnNumber - Current turn number
 * @returns {Object} Turn result with both actions and battle status
 */
export function processBattleTurn(playerPokemon, opponent, moveId, turnNumber = 1) {
  const turn = {
    turn_number: turnNumber,
    player_action: null,
    opponent_action: null
  };

  // Player attacks first
  turn.player_action = processPlayerTurn(playerPokemon, opponent, moveId);

  // Check if opponent is knocked out
  if (opponent.current_hp <= 0) {
    return {
      turn,
      outcome: 'victory',
      battle_continues: false
    };
  }

  // Opponent attacks back
  turn.opponent_action = processOpponentTurn(opponent, playerPokemon);

  // Check if player is knocked out
  if (playerPokemon.current_hp <= 0) {
    return {
      turn,
      outcome: 'defeat',
      battle_continues: false
    };
  }

  // Battle continues
  return {
    turn,
    outcome: 'ongoing',
    battle_continues: true
  };
}

/**
 * Add Struggle self-damage when Pokemon has no PP
 * Struggle deals 1d4 recoil damage to the user
 *
 * @param {Object} pokemon - Pokemon using Struggle
 * @returns {number} Recoil damage dealt
 */
export function applyStruggleRecoil(pokemon) {
  const recoilDamage = rollDice('1d4');
  pokemon.current_hp = Math.max(0, pokemon.current_hp - recoilDamage);
  return recoilDamage;
}

/**
 * Create a new battle instance
 *
 * @param {Object} playerPokemon - Player's Pokemon
 * @param {Object} opponent - Opponent Pokemon
 * @returns {Object} Battle instance with ID and initial state
 */
export function createBattle(playerPokemon, opponent) {
  return {
    battle_id: uuidv4(),
    player_pokemon: playerPokemon,
    opponent: opponent,
    turns: [],
    outcome: 'ongoing',
    started_at: new Date().toISOString()
  };
}
