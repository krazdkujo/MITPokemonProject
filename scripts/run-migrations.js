#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * Runs SQL migration files from the sql/ directory against Supabase.
 *
 * Usage:
 *   node scripts/run-migrations.js           # Run all migrations in order
 *   node scripts/run-migrations.js 001       # Run specific migration (001_*.sql)
 *   node scripts/run-migrations.js reset     # Run 000_reset_database.sql only
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Build connection config from environment
function getConnectionConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  }

  if (!dbPassword) {
    throw new Error('SUPABASE (database password) is not set in .env.local');
  }

  // Extract project ref from URL (e.g., https://abcdef.supabase.co -> abcdef)
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

  // Try direct connection first (requires IPv6 support)
  // If this fails, user may need to use Supabase Dashboard SQL Editor
  return {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    // Force IPv6 if needed (Supabase direct connection only has IPv6)
    family: 6
  };
}

async function runMigration(client, filePath) {
  const fileName = path.basename(filePath);
  console.log(`\nRunning: ${fileName}`);
  console.log('='.repeat(50));

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await client.query(sql);
    console.log(`[OK] ${fileName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[ERROR] ${fileName} failed:`);
    console.error(`  ${error.message}`);
    return false;
  }
}

async function getMigrationFiles(filter) {
  const sqlDir = path.join(process.cwd(), 'sql');

  if (!fs.existsSync(sqlDir)) {
    throw new Error('sql/ directory not found');
  }

  let files = fs.readdirSync(sqlDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (filter) {
    if (filter === 'reset') {
      files = files.filter(f => f.startsWith('000_'));
    } else {
      files = files.filter(f => f.startsWith(filter));
    }
  } else {
    // By default, skip 000_ reset files unless explicitly requested
    files = files.filter(f => !f.startsWith('000_'));
  }

  return files.map(f => path.join(sqlDir, f));
}

async function main() {
  const filter = process.argv[2];

  console.log('Pokemon Educational Platform - Migration Runner');
  console.log('='.repeat(50));

  // Get migration files
  const migrations = await getMigrationFiles(filter);

  if (migrations.length === 0) {
    console.log('No migration files found matching criteria.');
    console.log('\nUsage:');
    console.log('  node scripts/run-migrations.js         # Run all migrations');
    console.log('  node scripts/run-migrations.js 001     # Run 001_*.sql');
    console.log('  node scripts/run-migrations.js reset   # Run 000_reset_database.sql');
    process.exit(0);
  }

  console.log(`\nFound ${migrations.length} migration(s):`);
  migrations.forEach(m => console.log(`  - ${path.basename(m)}`));

  // Connect to database
  let client;
  try {
    const config = getConnectionConfig();
    console.log(`\nConnecting to Supabase (${config.host}:${config.port})...`);

    client = new Client(config);
    await client.connect();
    console.log('[OK] Connected to database');
  } catch (error) {
    console.error('[ERROR] Failed to connect to database:');
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  // Run migrations
  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    const result = await runMigration(client, migration);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  // Close connection
  await client.end();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Migration Summary:');
  console.log(`  Successful: ${success}`);
  console.log(`  Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
