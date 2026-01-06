#!/usr/bin/env node
/**
 * Combat Test CLI Script
 * Run combat simulations from the command line
 *
 * Usage:
 *   npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur
 *   npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle --level1 10 --level2 10
 *   npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur --seed 12345
 *   npm run test:combat -- --help
 *
 * Feature: 021-combat-test-harness
 * Tasks: T019-T024
 */

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_INVALID_POKEMON = 1;
const EXIT_INVALID_LEVEL = 2;
const EXIT_ERROR = 3;

// Parse command line arguments
function parseArgs(args) {
  const result = {
    pokemon1: 'pikachu',
    pokemon2: 'bulbasaur',
    level1: 5,
    level2: 5,
    seed: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--pokemon1':
      case '-p1':
        if (nextArg) {
          result.pokemon1 = nextArg.toLowerCase();
          i++;
        }
        break;
      case '--pokemon2':
      case '-p2':
        if (nextArg) {
          result.pokemon2 = nextArg.toLowerCase();
          i++;
        }
        break;
      case '--level1':
      case '-l1':
        if (nextArg) {
          result.level1 = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--level2':
      case '-l2':
        if (nextArg) {
          result.level2 = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--seed':
      case '-s':
        if (nextArg) {
          result.seed = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

// Display help text
function showHelp() {
  console.log(`
Combat Test Harness CLI
=======================

Run Pokemon combat simulations from the command line.

Usage:
  npm run test:combat -- [options]

Options:
  --pokemon1, -p1 <id>   First Pokemon ID (default: pikachu)
  --pokemon2, -p2 <id>   Second Pokemon ID (default: bulbasaur)
  --level1, -l1 <n>      Level of first Pokemon, 1-20 (default: 5)
  --level2, -l2 <n>      Level of second Pokemon, 1-20 (default: 5)
  --seed, -s <n>         RNG seed for reproducible results (default: random)
  --help, -h             Show this help message

Examples:
  npm run test:combat
  npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle
  npm run test:combat -- -p1 pikachu -p2 bulbasaur -l1 10 -l2 10
  npm run test:combat -- --seed 12345

Exit Codes:
  0 - Success
  1 - Invalid Pokemon ID
  2 - Invalid level (must be 1-20)
  3 - Runtime error
`);
}

// Main function
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Show help if requested
  if (args.help) {
    showHelp();
    process.exit(EXIT_SUCCESS);
  }

  // Validate levels
  if (args.level1 < 1 || args.level1 > 20 || isNaN(args.level1)) {
    console.error(`Error: Level 1 must be between 1 and 20 (got: ${args.level1})`);
    process.exit(EXIT_INVALID_LEVEL);
  }
  if (args.level2 < 1 || args.level2 > 20 || isNaN(args.level2)) {
    console.error(`Error: Level 2 must be between 1 and 20 (got: ${args.level2})`);
    process.exit(EXIT_INVALID_LEVEL);
  }

  try {
    // Dynamic imports for ES modules
    const { createSimulation, runToCompletion, formatBattleSummary, formatLogEntry } = await import('../lib/combatSimulator.js');
    const { createLogger } = await import('../lib/combatLogger.js');
    const { getPokemonById } = await import('../lib/pokemonData.js');

    // Validate Pokemon IDs
    const pokemon1Data = getPokemonById(args.pokemon1);
    if (!pokemon1Data) {
      console.error(`Error: Pokemon not found: ${args.pokemon1}`);
      console.error('Use a valid Pokemon ID like "pikachu", "bulbasaur", "charmander", etc.');
      process.exit(EXIT_INVALID_POKEMON);
    }

    const pokemon2Data = getPokemonById(args.pokemon2);
    if (!pokemon2Data) {
      console.error(`Error: Pokemon not found: ${args.pokemon2}`);
      console.error('Use a valid Pokemon ID like "pikachu", "bulbasaur", "charmander", etc.');
      process.exit(EXIT_INVALID_POKEMON);
    }

    // Create logger with colors for CLI
    const logger = createLogger({ colorize: true, verbose: true });

    // Create simulation
    const simulation = createSimulation({
      pokemon1: { id: args.pokemon1, level: args.level1 },
      pokemon2: { id: args.pokemon2, level: args.level2 },
      seed: args.seed
    });

    // Print battle header
    console.log(logger.logBattleHeader(
      simulation.combatant1,
      simulation.combatant2,
      simulation.seed
    ));

    // Run to completion with turn-by-turn output
    const result = runToCompletion(simulation, (turnResult) => {
      // Print each log entry as it happens
      for (const entry of turnResult.log) {
        console.log(formatLogEntry(entry));
      }
    });

    // Print final summary
    console.log(formatBattleSummary(result));

    process.exit(EXIT_SUCCESS);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(EXIT_ERROR);
  }
}

// Run main
main();
