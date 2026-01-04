/**
 * Download Pokemon sprite images from PokeAPI
 *
 * Downloads all Generation 1 Pokemon sprites (1-151) from PokeAPI's GitHub
 * repository and saves them to public/images/pokemon/
 *
 * Usage: node scripts/download-pokemon-images.js
 */

const fs = require('fs');
const path = require('path');

const POKEMON_COUNT = 1025;
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'pokemon');

// Delay between downloads to avoid rate limiting
const DELAY_MS = 100;

async function downloadImage(url, filepath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return buffer.length;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Pokemon Image Downloader');
  console.log('========================');
  console.log(`Downloading ${POKEMON_COUNT} Pokemon sprites to ${OUTPUT_DIR}`);
  console.log('');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;

  for (let i = 1; i <= POKEMON_COUNT; i++) {
    const url = `${BASE_URL}/${i}.png`;
    const filepath = path.join(OUTPUT_DIR, `${i}.png`);

    try {
      const bytes = await downloadImage(url, filepath);
      totalBytes += bytes;
      successCount++;

      // Progress indicator
      const progress = Math.round((i / POKEMON_COUNT) * 100);
      process.stdout.write(`\rDownloading: ${i}/${POKEMON_COUNT} (${progress}%) - ${(totalBytes / 1024).toFixed(1)} KB total`);

      // Small delay to be nice to GitHub's servers
      if (i < POKEMON_COUNT) {
        await sleep(DELAY_MS);
      }
    } catch (error) {
      failCount++;
      console.error(`\nFailed to download Pokemon #${i}: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('Download Complete!');
  console.log('==================');
  console.log(`Success: ${successCount}/${POKEMON_COUNT}`);
  console.log(`Failed: ${failCount}/${POKEMON_COUNT}`);
  console.log(`Total size: ${(totalBytes / 1024).toFixed(1)} KB`);

  // Verify placeholder exists
  const placeholderPath = path.join(OUTPUT_DIR, 'placeholder.png');
  if (fs.existsSync(placeholderPath)) {
    console.log('Placeholder image: present');
  } else {
    console.log('Warning: placeholder.png not found');
  }

  // Exit with error if any downloads failed
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
