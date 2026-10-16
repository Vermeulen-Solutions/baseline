import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ulid } from 'ulidx';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    db: 'data.db',
    dryRun: false,
    noBackup: false,
    rename: true,
    folders: true,
    hydrate: true,
  };

  // If specific action flags are passed, restrict to them
  const actionFlags = args.filter(a => ['--rename', '--folders', '--hydrate'].includes(a));
  if (actionFlags.length > 0) {
    options.rename = actionFlags.includes('--rename');
    options.folders = actionFlags.includes('--folders');
    options.hydrate = actionFlags.includes('--hydrate');
  }

  for (const arg of args) {
    if (arg.startsWith('--db=')) {
      options.db = arg.slice('--db='.length);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-backup') {
      options.noBackup = true;
    }
  }

  return options;
}

const options = parseArgs();
const dbPath = path.resolve(options.db);

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

console.log('=== EmDash Media Organizer & Sanitizer ===\n');
if (options.dryRun) {
  console.log('[DRY RUN MODE] No changes will be written to the database.\n');
}

// 1. Create safety backup if not dry run
if (!options.dryRun && !options.noBackup) {
  const backupDir = path.resolve('audit/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `media-backup-${timestamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Database backup saved to: ${backupPath}\n`);
}

const db = new DatabaseSync(dbPath);

// Ensure media_folders table exists
const hasMediaFolders = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='media_folders'").get();
if (!hasMediaFolders) {
  console.log('Creating media_folders table...');
  if (!options.dryRun) {
    db.exec(`
      CREATE TABLE media_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_key TEXT NOT NULL
      );
    `);
  }
}

// Helper: Normalize key
function normalizeKey(str) {
  return str.trim().normalize('NFKC').toLowerCase();
}

// Helper: Slugify text
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: Clean filename
function cleanFilename(rawFilename, altText) {
  const ext = path.extname(rawFilename).toLowerCase();
  let base = path.basename(rawFilename, ext);

  try {
    base = decodeURIComponent(base);
  } catch {}

  // Strip WordPress IDs, scaled suffixes, resize dimensions, and camera prefixes
  let cleaned = base
    .replace(/^wordpress-attachment:\d+/i, '')
    .replace(/^\d+[-_]/, '') // leading numeric ID like 3206-
    .replace(/[-_]scaled(-\d+)?$/i, '')
    .replace(/[-_]e\d+$/i, '')
    .replace(/[-_]\d+x\d+$/i, '') // e.g. -150x150, -1024x768
    .replace(/^photo[-_]/i, '')
    .replace(/^img[-_]/i, '')
    .replace(/^dsc[-_]/i, '');

  cleaned = slugify(cleaned);

  // If name became empty or looks like a bare hex/UUID hash, fall back to alt text
  if (!cleaned || cleaned.length < 3 || /^[a-f0-9-]{16,}$/.test(cleaned)) {
    if (altText) {
      cleaned = slugify(altText.slice(0, 45));
    }
  }

  if (!cleaned) {
    cleaned = 'media-item';
  }

  return cleaned + ext;
}

// Helper: Get or create folder
const folderCache = new Map();

function getOrCreateFolder(name) {
  const key = normalizeKey(name);
  if (folderCache.has(key)) {
    return folderCache.get(key);
  }

  let row = db.prepare('SELECT id, name FROM media_folders WHERE name_key = ?').get(key);
  if (!row) {
    const id = ulid();
    if (!options.dryRun) {
      db.prepare('INSERT INTO media_folders (id, name, name_key) VALUES (?, ?, ?)').run(id, name, key);
    }
    row = { id, name };
    console.log(`+ Created media folder: "${name}" (${id})`);
  }
  folderCache.set(key, row);
  return row;
}

// Format canonical EmDash media JSON object
function formatMediaJson(row, alt) {
  return {
    id: row.id,
    provider: 'local',
    filename: row.filename,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    blurhash: row.blurhash,
    dominantColor: row.dominant_color,
    alt: alt || row.alt || row.filename,
    url: `/_emdash/api/media/file/${row.storage_key}`,
    meta: {
      storageKey: row.storage_key,
      caption: row.caption || null,
      blurhash: row.blurhash,
      dominantColor: row.dominant_color,
    },
  };
}

// Map of renamed media: mediaId -> newFilename
const renameMap = new Map();

// --- 1. FILENAME CLEANUP ---
if (options.rename) {
  console.log('--- Step 1: Cleaning & Slugifying Filenames ---');
  const mediaRows = db.prepare('SELECT id, filename, alt FROM media').all();
  let renamedCount = 0;

  for (const m of mediaRows) {
    const cleaned = cleanFilename(m.filename, m.alt);
    if (cleaned !== m.filename) {
      renameMap.set(m.id, cleaned);
      renamedCount++;
      if (options.dryRun) {
        console.log(`[DRY RUN] Rename: "${m.filename}" -> "${cleaned}"`);
      } else {
        db.prepare('UPDATE media SET filename = ? WHERE id = ?').run(cleaned, m.id);
      }
    }
  }
  console.log(`Renamed ${renamedCount} of ${mediaRows.length} media files.\n`);
}

// --- 2. FOLDER CREATION & ASSIGNMENT ---
if (options.folders) {
  console.log('--- Step 2: Creating Standard Folders & Categorizing Media ---');

  // Standard core folders
  const defaultFolders = {
    pages: getOrCreateFolder('Pages'),
    articles: getOrCreateFolder('Articles'),
    media: getOrCreateFolder('Media'),
    documents: getOrCreateFolder('Documents'),
  };

  // Inspect collections
  const collections = db.prepare('SELECT id, label, slug FROM _emdash_collections').all();
  const collectionFolders = new Map();

  for (const col of collections) {
    const folder = getOrCreateFolder(col.label || col.slug);
    collectionFolders.set(col.slug, folder);
  }

  // A. File Documents (PDFs, docs)
  const docMedia = db.prepare("SELECT id, filename FROM media WHERE (mime_type LIKE '%pdf%' OR filename LIKE '%.pdf') AND folder_id IS NULL").all();
  for (const doc of docMedia) {
    if (!options.dryRun) {
      db.prepare('UPDATE media SET folder_id = ? WHERE id = ?').run(defaultFolders.documents.id, doc.id);
    }
  }
  if (docMedia.length > 0) {
    console.log(`Filed ${docMedia.length} PDF/documents into "${defaultFolders.documents.name}".`);
  }

  // B. File Media referenced by Collections
  let collectionFilingCount = 0;
  for (const col of collections) {
    const tableName = `ec_${col.slug}`;
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!tableExists) continue;

    const folder = collectionFolders.get(col.slug) || defaultFolders.media;
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
    
    // Look for image/photo/logo/media/cover/file columns
    const mediaCols = columns.filter(c => /image|photo|logo|media|cover|file|attachment|banner/i.test(c));
    if (mediaCols.length === 0) continue;

    for (const colName of mediaCols) {
      const rows = db.prepare(`SELECT id, ${colName} as val FROM ${tableName} WHERE ${colName} IS NOT NULL`).all();
      for (const row of rows) {
        if (!row.val) continue;
        let mediaId = null;

        // Try parsing JSON
        try {
          const parsed = JSON.parse(row.val);
          if (parsed && typeof parsed === 'object') {
            mediaId = parsed.id || parsed.asset?._ref;
          }
        } catch {
          // Might be raw media ID
          if (typeof row.val === 'string' && row.val.startsWith('01')) {
            mediaId = row.val;
          }
        }

        if (mediaId) {
          const target = db.prepare('SELECT id, folder_id FROM media WHERE id = ?').get(mediaId);
          if (target && !target.folder_id) {
            if (!options.dryRun) {
              db.prepare('UPDATE media SET folder_id = ? WHERE id = ?').run(folder.id, target.id);
            }
            collectionFilingCount++;
          }
        }
      }
    }
  }
  console.log(`Filed ${collectionFilingCount} media items based on collection references.\n`);
}

// --- 3. CONTENT SYNCHRONIZATION & HYDRATION ---
if (options.hydrate || options.rename) {
  console.log('--- Step 3: Synchronizing Content References & Hydrating Media Objects ---');

  const collections = db.prepare('SELECT id, label, slug FROM _emdash_collections').all();
  let updatedFieldsCount = 0;

  for (const col of collections) {
    const tableName = `ec_${col.slug}`;
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!tableExists) continue;

    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
    const mediaCols = columns.filter(c => /image|photo|logo|media|cover|file|attachment|banner/i.test(c));

    for (const colName of mediaCols) {
      const rows = db.prepare(`SELECT id, ${colName} as val FROM ${tableName} WHERE ${colName} IS NOT NULL`).all();

      for (const row of rows) {
        if (!row.val) continue;
        let needsUpdate = false;
        let newVal = row.val;

        // Try JSON parse
        try {
          const parsed = JSON.parse(row.val);

          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed)) {
              // Could be Portable Text blocks (galleries)
              for (const block of parsed) {
                if (block.type === 'gallery' || block._type === 'gallery') {
                  for (const img of block.images || []) {
                    const ref = img.asset?._ref || img.id;
                    if (ref && renameMap.has(ref)) {
                      img.filename = renameMap.get(ref);
                      needsUpdate = true;
                    }
                  }
                }
              }
              if (needsUpdate) newVal = JSON.stringify(parsed);
            } else if (parsed.id) {
              // Standard EmDash media object
              if (renameMap.has(parsed.id)) {
                parsed.filename = renameMap.get(parsed.id);
                newVal = JSON.stringify(parsed);
                needsUpdate = true;
              }
            }
          }
        } catch {
          // Raw string! (e.g. attachment ID, raw URL, or media ID)
          if (options.hydrate && typeof row.val === 'string') {
            let matchedMedia = null;

            // Check if it's a media ID
            if (row.val.startsWith('01')) {
              matchedMedia = db.prepare('SELECT * FROM media WHERE id = ?').get(row.val);
            }
            // Check if it's a filename or storage key
            if (!matchedMedia) {
              const basename = path.basename(row.val);
              matchedMedia = db.prepare('SELECT * FROM media WHERE storage_key = ? OR filename = ?').get(basename, basename);
            }

            if (matchedMedia) {
              const formatted = formatMediaJson(matchedMedia);
              newVal = JSON.stringify(formatted);
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate && newVal !== row.val) {
          if (!options.dryRun) {
            db.prepare(`UPDATE ${tableName} SET ${colName} = ? WHERE id = ?`).run(newVal, row.id);
          }
          updatedFieldsCount++;
        }
      }
    }
  }

  console.log(`Updated ${updatedFieldsCount} content fields with synchronized and hydrated media objects.\n`);
}

console.log('=== Media Organization Complete! ===');
