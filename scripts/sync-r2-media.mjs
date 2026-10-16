import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    bucket: process.env.CLOUDFLARE_R2_BUCKET || null,
    uploadsDir: path.resolve('uploads'),
    dryRun: false,
    force: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--bucket=')) {
      options.bucket = arg.slice('--bucket='.length);
    } else if (arg.startsWith('--uploads=')) {
      options.uploadsDir = path.resolve(arg.slice('--uploads='.length));
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

function detectBucketFromWrangler() {
  const possibleConfigs = ['wrangler.jsonc', 'wrangler.json'];
  for (const configFile of possibleConfigs) {
    if (fs.existsSync(configFile)) {
      try {
        const content = fs.readFileSync(configFile, 'utf8');
        // Strip comments for basic JSONC parsing
        const stripped = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const json = JSON.parse(stripped);
        if (Array.isArray(json.r2_buckets)) {
          // Look for MEDIA binding or first bucket
          const mediaBucket = json.r2_buckets.find(b => b.binding === 'MEDIA') || json.r2_buckets[0];
          if (mediaBucket?.bucket_name) {
            return mediaBucket.bucket_name;
          }
        }
      } catch {}
    }
  }
  return null;
}

console.log('=== Cloudflare R2 Media Synchronizer ===\n');

const options = parseArgs();

if (!options.bucket) {
  options.bucket = detectBucketFromWrangler();
}

if (!options.bucket) {
  console.error('Error: Could not determine Cloudflare R2 bucket name.');
  console.error('Please specify --bucket=<bucket_name> or configure r2_buckets in wrangler.jsonc / set CLOUDFLARE_R2_BUCKET.');
  process.exit(1);
}

if (!fs.existsSync(options.uploadsDir)) {
  console.log(`Uploads directory does not exist: ${options.uploadsDir}`);
  console.log('No local media to upload.');
  process.exit(0);
}

const localFiles = fs.readdirSync(options.uploadsDir).filter(f => {
  const stat = fs.statSync(path.join(options.uploadsDir, f));
  return stat.isFile();
});

console.log(`Target R2 Bucket: ${options.bucket}`);
console.log(`Local Uploads Directory: ${options.uploadsDir}`);
console.log(`Found ${localFiles.length} local files.\n`);

if (options.dryRun) {
  console.log('[DRY RUN MODE] No files will be uploaded.\n');
}

// Load sync cache
const cacheDir = path.resolve('.emdash');
fs.mkdirSync(cacheDir, { recursive: true });
const cachePath = path.join(cacheDir, 'r2-synced.json');
let syncCache = {};
if (fs.existsSync(cachePath) && !options.force) {
  try {
    syncCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {}
}

const toUpload = [];
let skippedCount = 0;

for (const file of localFiles) {
  const filePath = path.join(options.uploadsDir, file);
  const stat = fs.statSync(filePath);
  const cached = syncCache[file];

  if (!options.force && cached && cached.size === stat.size && cached.mtime === stat.mtimeMs) {
    skippedCount++;
  } else {
    toUpload.push({ file, filePath, stat });
  }
}

console.log(`Files to upload: ${toUpload.length} (Skipping ${skippedCount} already synced)`);

if (toUpload.length === 0) {
  console.log('\nAll local media files are already synced with Cloudflare R2! ✓');
  process.exit(0);
}

let uploadedCount = 0;
let failedCount = 0;

for (let i = 0; i < toUpload.length; i++) {
  const { file, filePath, stat } = toUpload[i];
  const progress = `[${i + 1}/${toUpload.length}]`;

  if (options.dryRun) {
    console.log(`${progress} [DRY RUN] Would upload ${file} -> ${options.bucket}/${file}`);
    continue;
  }

  process.stdout.write(`${progress} Uploading ${file}... `);
  try {
    execSync(`npx wrangler r2 object put "${options.bucket}/${file}" --file="${filePath}" --remote`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    syncCache[file] = {
      size: stat.size,
      mtime: stat.mtimeMs,
      syncedAt: new Date().toISOString(),
    };
    uploadedCount++;
    console.log('OK');
  } catch (err) {
    failedCount++;
    console.log('FAILED');
    console.error(`  Error uploading ${file}: ${err.message}`);
  }
}

if (!options.dryRun) {
  fs.writeFileSync(cachePath, JSON.stringify(syncCache, null, 2), 'utf8');
}

console.log('\n=== R2 Sync Summary ===');
console.log(`Successfully uploaded: ${uploadedCount}`);
if (skippedCount > 0) console.log(`Skipped (already synced): ${skippedCount}`);
if (failedCount > 0) console.log(`Failed: ${failedCount}`);
console.log('========================');
