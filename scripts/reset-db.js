#!/usr/bin/env node
/**
 * Database Reset Script (via Supabase REST API)
 *
 * Uses the Supabase JS client to clear all data.
 * This works even when direct PostgreSQL connection fails due to IPv6 issues.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
    process.exit(1);
  }

  console.log('Database Reset Script');
  console.log('='.repeat(50));
  console.log(`Connecting to: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  try {
    // Delete from active_battles first (references player_pokemon)
    console.log('\nClearing active_battles...');
    const { error: battleError } = await supabase
      .from('active_battles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (battleError && !battleError.message.includes('does not exist')) {
      console.log(`  Warning: ${battleError.message}`);
    } else {
      console.log('  [OK] active_battles cleared');
    }

    // Delete from player_pokemon (references users)
    console.log('\nClearing player_pokemon...');
    const { error: pokemonError } = await supabase
      .from('player_pokemon')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (pokemonError && !pokemonError.message.includes('does not exist')) {
      console.log(`  Warning: ${pokemonError.message}`);
    } else {
      console.log('  [OK] player_pokemon cleared');
    }

    // Delete from player_inventory (references users)
    console.log('\nClearing player_inventory...');
    const { error: inventoryError } = await supabase
      .from('player_inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (inventoryError && !inventoryError.message.includes('does not exist')) {
      console.log(`  Warning: ${inventoryError.message}`);
    } else {
      console.log('  [OK] player_inventory cleared');
    }

    // Delete from users
    console.log('\nClearing users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (usersError) {
      console.log(`  Warning: ${usersError.message}`);
    } else {
      console.log('  [OK] users cleared');
    }

    console.log('\n' + '='.repeat(50));
    console.log('Database reset complete!');
    console.log('All player data has been cleared.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
