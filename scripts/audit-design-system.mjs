import fs from 'node:fs';
import path from 'node:path';
import { readTarget, safeRelative } from './audit-evidence.mjs';

/**
 * Static, read-only inspection of downstream CSS token/rhythm primitives,
 * accessible Card / Container breakout adoption, and Component Quarantine HUD.
 * Never executes target code or emits private target filenames.
 */
export function designSystemRules(target, add) {
  const cssRead = readTarget(target, 'src/styles/global.css');
  if (!cssRead.bytes) {
    add(
      'design-system:tokens-and-rhythm',
      'unverified',
      'Curated token matrix, Smart Spacing (.flow) duplicate-margin guard, .content-grid subgrid tracks, and surface/focus utilities in src/styles/global.css',
      'src/styles/global.css not observed',
      { required: false, evidence: ['src/styles/global.css'], confidence: 'bounded-static', remediation: 'docs/reusable-public-patterns.md' }
    );
  } else {
    const css = cssRead.bytes.toString('utf8');
    const interpolateSize = /interpolate-size\s*:\s*allow-keywords/.test(css);
    const flowDuplicateMarginGuard =
      /\.flow\s*>\s*:where\([^)]*\)\s*\+\s*\*\s*\{[^}]*margin-block-start\s*:\s*0/.test(css) ||
      /\.flow\s*>\s*:where\(\*\s*\+\s*\*\)\s*\{[^}]*margin-block-end\s*:\s*0/.test(css);
    const rawFlowRules = (css.match(/^\s*\.flow\s*>\s*(?:\*\s*\+\s*\*|:where\(\*\s*\+\s*\*\)|:where\(\*\)\s*\+\s*:where\(\*\))\s*\{/gm) ?? []).length;
    const duplicateFlowBase = (css.match(/^\s*\.flow\s*\{/gm) ?? []).length > 1;
    const flowRuleCount = duplicateFlowBase ? Math.max(2, rawFlowRules) : rawFlowRules;
    const contentGrid = /\.content-grid\b/.test(css);
    const contentGridSubgrid = /grid-template-columns\s*:\s*subgrid\b/.test(css);
    const surfaceTokens = /\[data-surface=/.test(css);
    const focusAndClickableParent = /\.clickable-parent\b/.test(css) && /\.focus-parent\b/.test(css);
    const withoutRootAndTheme = css.replace(/@theme\s*\{[^}]*\}|:root\s*\{[^}]*\}/g, '');
    const adHocClampCount = (withoutRootAndTheme.match(/\bclamp\s*\(/g) ?? []).length;

    const pass =
      interpolateSize &&
      flowDuplicateMarginGuard &&
      flowRuleCount === 1 &&
      contentGrid &&
      contentGridSubgrid &&
      surfaceTokens &&
      focusAndClickableParent &&
      adHocClampCount === 0;

    add(
      'design-system:tokens-and-rhythm',
      pass ? 'pass' : 'warning',
      'Curated token matrix, Smart Spacing (.flow) duplicate-margin guard, .content-grid subgrid tracks, and surface/focus utilities in src/styles/global.css',
      {
        interpolateSize,
        flowDuplicateMarginGuard,
        flowRuleCount,
        contentGrid,
        contentGridSubgrid,
        surfaceTokens,
        focusAndClickableParent,
        adHocClampCount,
      },
      { required: false, evidence: ['src/styles/global.css'], confidence: 'bounded-static', remediation: 'docs/reusable-public-patterns.md' }
    );
  }

  let componentsObserved = false;
  let containerBreakout = false;
  let cardComponentCount = 0;
  let wholeCardAnchorCount = 0;
  let clickableParentCardCount = 0;
  let concentricMediaRadius = false;
  let cmsEditForwarding = false;
  let breakoutPageCount = 0;
  let surfaceUsageCount = 0;

  function scanAstroDir(relDir, depth = 0) {
    if (depth > 3) return [];
    const absDir = path.join(target, relDir);
    try {
      if (!fs.existsSync(absDir) || fs.lstatSync(absDir).isSymbolicLink() || !fs.statSync(absDir).isDirectory()) return [];
      const results = [];
      for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
        if (!safeRelative(entry.name)) continue;
        const childRel = `${relDir}/${entry.name}`;
        if (entry.isDirectory()) {
          results.push(...scanAstroDir(childRel, depth + 1));
        } else if (entry.isFile() && entry.name.endsWith('.astro')) {
          results.push(childRel);
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  try {
    const srcPath = path.join(target, 'src');
    const compPath = path.join(target, 'src/components');
    if (
      fs.existsSync(srcPath) &&
      !fs.lstatSync(srcPath).isSymbolicLink() &&
      fs.existsSync(compPath) &&
      !fs.lstatSync(compPath).isSymbolicLink() &&
      fs.statSync(compPath).isDirectory()
    ) {
      componentsObserved = true;
      const containerBytes = readTarget(target, 'src/components/Container.astro').bytes;
      if (containerBytes) {
        const containerText = containerBytes.toString('utf8');
        containerBreakout = /\bbreakout\b/.test(containerText) && /\bcontent-grid\b/.test(containerText);
      }
      for (const name of fs.readdirSync(compPath).sort()) {
        if (!safeRelative(name) || !name.endsWith('Card.astro')) continue;
        const cardBytes = readTarget(target, `src/components/${name}`).bytes;
        if (!cardBytes) continue;
        cardComponentCount++;
        const text = cardBytes.toString('utf8');
        if (/<a\b[^>]*class:list=\{\s*\[[^\]]*card|<a\b[^>]*class=["'][^"']*card/i.test(text) && !/<article\b/.test(text)) {
          wholeCardAnchorCount++;
        }
        if (/\bclickable-parent\b/.test(text) && /\bfocus-parent\b/.test(text)) {
          clickableParentCardCount++;
        }
        if (/--card-media-radius\s*:/.test(text)) {
          concentricMediaRadius = true;
        }
        if (/\btitleEdit\b/.test(text) && /\bdescriptionEdit\b/.test(text) && /\bactionEdit\b/.test(text)) {
          cmsEditForwarding = true;
        }
      }
      for (const relFile of [...scanAstroDir('src/pages'), ...scanAstroDir('src/components')]) {
        if (relFile === 'src/pages/_styleguide.astro' || relFile === 'src/components/Container.astro') continue;
        const pageBytes = readTarget(target, relFile).bytes;
        if (!pageBytes) continue;
        const pageText = pageBytes.toString('utf8');
        if (/<Container\b[^>]*\bbreakout\b|\bcontent-grid\b/.test(pageText)) breakoutPageCount++;
        if (/\bdata-surface=/.test(pageText)) surfaceUsageCount++;
      }
    }
  } catch {
    componentsObserved = false;
  }

  if (!componentsObserved) {
    add(
      'design-system:card-and-breakout',
      'unverified',
      'Semantic <article> Card with .clickable-parent/.focus-parent, concentric --card-media-radius, CMS edit forwarding, and Container breakout',
      'src/components directory not observed',
      { required: false, evidence: ['src/components'], confidence: 'bounded-static', remediation: 'docs/reusable-public-patterns.md' }
    );
  } else {
    const cardPass =
      containerBreakout &&
      cardComponentCount > 0 &&
      wholeCardAnchorCount === 0 &&
      clickableParentCardCount > 0 &&
      concentricMediaRadius &&
      cmsEditForwarding;
    add(
      'design-system:card-and-breakout',
      cardPass ? 'pass' : 'warning',
      'Semantic <article> Card with .clickable-parent/.focus-parent, concentric --card-media-radius, CMS edit forwarding, and Container breakout',
      {
        containerBreakout,
        cardComponentCount,
        wholeCardAnchorCount,
        clickableParentCardCount,
        concentricMediaRadius,
        cmsEditForwarding,
        breakoutPageCount,
        surfaceUsageCount,
      },
      { required: false, evidence: ['src/components'], confidence: 'bounded-static', remediation: 'docs/reusable-public-patterns.md' }
    );
  }

  const styleguideBytes = readTarget(target, 'src/pages/_styleguide.astro').bytes;
  const styleguideCompBytes = readTarget(target, 'src/components/dev/Styleguide.astro').bytes;
  const calibrationBytes = readTarget(target, 'audit/component-calibration.md').bytes;
  const pagesDirExists = (() => {
    try {
      const p = path.join(target, 'src/pages');
      return fs.existsSync(p) && !fs.lstatSync(p).isSymbolicLink() && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  })();

  if (!componentsObserved && !pagesDirExists) {
    add(
      'design-system:quarantine-hud',
      'unverified',
      'Component quarantine route (/_styleguide) and Styleguide.astro specimen present',
      'src/pages and src/components not observed',
      { required: false, evidence: ['src/pages/_styleguide.astro', 'src/components/dev/Styleguide.astro'], confidence: 'bounded-static', remediation: 'docs/styleguide-fixtures.md' }
    );
  } else {
    const styleguideRoute = Boolean(styleguideBytes);
    const styleguideComponent = Boolean(styleguideCompBytes);
    const calibrationRecord = Boolean(calibrationBytes);
    add(
      'design-system:quarantine-hud',
      styleguideRoute && styleguideComponent ? 'pass' : 'warning',
      'Component quarantine route (/_styleguide) and Styleguide.astro specimen present',
      { styleguideRoute, styleguideComponent, calibrationRecord },
      { required: false, evidence: ['src/pages/_styleguide.astro', 'src/components/dev/Styleguide.astro'], confidence: 'bounded-static', remediation: 'docs/styleguide-fixtures.md' }
    );
  }
}

