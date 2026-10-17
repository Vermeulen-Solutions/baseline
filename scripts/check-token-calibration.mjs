#!/usr/bin/env node
/**
 * Check a calibration receipt against the stylesheet it claims to describe.
 *
 * A receipt is written by the development panel (Copy Receipt (JSON)) and saved under audit/.
 * It records the overrides a calibration produced and the exact stylesheet digest it was made
 * against. This script answers the question a reviewer actually has: was this calibration
 * applied, or is it stale?
 *
 *   applied        the overrides are present in the stylesheet (the merge happened)
 *   pending-merge  the digest still matches, so nothing has been merged yet
 *   stale          the stylesheet moved on and the overrides are not all present
 *   invalid        the receipt is malformed, or names tokens that do not exist
 *
 * Usage:
 *   npm run check:token-calibration -- audit/<receipt>.json
 *   npm run check:token-calibration -- <receipt>.json --global-css <stylesheet> --require-applied
 *
 * Exit codes: 0 for applied/pending-merge, 1 for stale or invalid (or when --require-applied
 * is given and the calibration has not been merged).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { baselineTokens, stylesheetDigest } from '../src/utils/design-tweaks.mjs';

const DEFAULT_STYLESHEET = 'src/styles/global.css';

/** Collapse whitespace so formatting differences between a receipt and the stylesheet do not matter. */
const normaliseValue = (value) => String(value).replace(/\s+/g, ' ').trim();

/** Declarations authored in a stylesheet, keyed by custom property name. */
function declarations(stylesheet) {
  const found = new Map();
  for (const match of stylesheet.matchAll(/(^|\s)(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = match[2];
    if (!found.has(name)) found.set(name, normaliseValue(match[3]));
  }
  return found;
}

function parseArgs(argv) {
  const args = { receipt: null, stylesheet: DEFAULT_STYLESHEET, requireApplied: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--global-css') { args.stylesheet = argv[index + 1]; index += 1; }
    else if (arg === '--require-applied') args.requireApplied = true;
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else if (args.receipt === null) args.receipt = arg;
    else throw new Error(`Unexpected extra argument: ${arg}`);
  }
  return args;
}

function validateReceipt(receipt) {
  const problems = [];
  if (receipt === null || typeof receipt !== 'object') return ['receipt is not a JSON object'];
  if (receipt.tool !== 'design-tweaks') problems.push(`unexpected tool: ${JSON.stringify(receipt.tool)}`);
  if (receipt.receiptVersion !== 1) problems.push(`unsupported receiptVersion: ${JSON.stringify(receipt.receiptVersion)}`);
  if (typeof receipt.globalCssSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.globalCssSha256)) {
    problems.push('globalCssSha256 must be a 64-character lowercase hex digest');
  }
  if (typeof receipt.exportedAt !== 'string' || Number.isNaN(Date.parse(receipt.exportedAt))) {
    problems.push('exportedAt must be an ISO timestamp');
  }
  if (receipt.overrides === null || typeof receipt.overrides !== 'object' || Array.isArray(receipt.overrides)) {
    problems.push('overrides must be an object keyed by custom property');
    return problems;
  }
  const known = new Set(baselineTokens);
  for (const [key, override] of Object.entries(receipt.overrides)) {
    if (!known.has(key)) problems.push(`override names a token that is not in the catalogue: ${key}`);
    if (override === null || typeof override !== 'object') { problems.push(`override for ${key} must be an object`); continue; }
    if (typeof override.to !== 'string' || override.to.trim() === '') problems.push(`override for ${key} has no "to" value`);
    if (!('from' in override)) problems.push(`override for ${key} has no "from" value (use null when the token has no authored value)`);
  }
  return problems;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.receipt) {
    console.error('Usage: check-token-calibration.mjs <receipt.json> [--global-css <path>] [--require-applied]');
    process.exitCode = 1;
    return;
  }

  const stylesheetPath = resolve(args.stylesheet);
  const stylesheet = readFileSync(stylesheetPath, 'utf8');
  const digest = await stylesheetDigest(stylesheet);

  let receipt;
  try {
    receipt = JSON.parse(readFileSync(resolve(args.receipt), 'utf8'));
  } catch (error) {
    console.error(`invalid receipt: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const problems = validateReceipt(receipt);
  if (problems.length > 0) {
    console.error(`invalid receipt (${args.receipt}):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  const keys = Object.keys(receipt.overrides);
  const authored = declarations(stylesheet);
  const missing = keys.filter((key) => authored.get(key) !== normaliseValue(receipt.overrides[key].to));
  const applied = keys.length > 0 && missing.length === 0;
  const digestMatches = receipt.globalCssSha256 === digest;

  console.log(`receipt:  ${args.receipt}`);
  console.log(`  exported:  ${receipt.exportedAt}`);
  console.log(`  overrides: ${keys.length}`);
  console.log(`  stylesheet: ${args.stylesheet}`);

  if (applied) {
    console.log('  status:    applied - every override is present in the stylesheet.');
    process.exitCode = 0;
    return;
  }

  if (digestMatches) {
    console.log('  status:    pending-merge - the stylesheet is unchanged since this calibration.');
    console.log('             Merge the exported tokens, or discard the receipt.');
    process.exitCode = args.requireApplied ? 1 : 0;
    return;
  }

  console.log('  status:    stale - the stylesheet changed and these overrides are not all present:');
  for (const key of missing) {
    console.log(`               ${key}`);
    console.log(`                 receipt:    ${normaliseValue(receipt.overrides[key].to)}`);
    console.log(`                 stylesheet: ${authored.get(key) ?? '(not authored)'}`);
  }
  console.log('             Re-calibrate in the panel and record a fresh receipt, or merge the missing values.');
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`check-token-calibration failed: ${error.message}`);
  process.exitCode = 1;
});
