import { analyzeFlow } from './css-contracts.mjs';
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
      'Curated token matrix, flow spacing (.flow) duplicate-margin guard, .content-grid subgrid tracks, and surface/focus utilities in src/styles/global.css',
      'src/styles/global.css not observed',
      { required: false, evidence: ['src/styles/global.css'], confidence: 'bounded-static', remediation: 'docs/reusable-public-patterns.md' }
    );
  } else {
    const css = cssRead.bytes.toString('utf8');
    const interpolateSize = /interpolate-size\s*:\s*allow-keywords/.test(css);
    const { verified: flowVerified, flowDuplicateMarginGuard, flowRuleCount } = analyzeFlow(css);
    const contentGrid = /\.content-grid\b/.test(css);
    const contentGridSubgrid = /grid-template-columns\s*:\s*subgrid\b/.test(css);
    const surfaceTokens = /\[data-surface=/.test(css);
    const focusAndClickableParent = /\.clickable-parent\b/.test(css) && /\.focus-parent\b/.test(css);
    const fourVoiceTypography = /--font-mono\s*:/.test(css) && /--font-accent\s*:/.test(css);
    const threeTierSurfaces = /--color-elevated\s*:/.test(css) && /--surface-glass\s*:/.test(css);
    const bentoAndSpecimenPrimitives = /\.bento-grid\b/.test(css) && /\.ui-specimen\b/.test(css);
    const tactileActionVariants = /\.btn--secondary\b/.test(css) && /\.btn--ghost\b/.test(css);
    const withoutRootAndTheme = css.replace(/@theme\s*\{[^}]*\}|:root\s*\{[^}]*\}/g, '');
    const adHocClampCount = (withoutRootAndTheme.match(/\bclamp\s*\(/g) ?? []).length;

    const pass =
      interpolateSize &&
      flowVerified &&
      flowDuplicateMarginGuard &&
      flowRuleCount === 1 &&
      contentGrid &&
      contentGridSubgrid &&
      surfaceTokens &&
      focusAndClickableParent &&
      fourVoiceTypography &&
      threeTierSurfaces &&
      bentoAndSpecimenPrimitives &&
      tactileActionVariants &&
      adHocClampCount === 0;

    add(
      'design-system:tokens-and-rhythm',
      pass ? 'pass' : 'warning',
      'Curated token matrix, 4-voice typography (--font-mono/--font-accent), 3-tier surfaces, .bento-grid/.ui-specimen, tactile .btn variants, .flow duplicate-margin guard, and .content-grid subgrid in src/styles/global.css',
      {
        interpolateSize,
        flowVerified,
        flowDuplicateMarginGuard,
        flowRuleCount,
        contentGrid,
        contentGridSubgrid,
        surfaceTokens,
        focusAndClickableParent,
        fourVoiceTypography,
        threeTierSurfaces,
        bentoAndSpecimenPrimitives,
        tactileActionVariants,
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
  let cardTransitionMorphing = false;
  let siteShellChoreography = false;
  let breakoutPageCount = 0;
  let surfaceUsageCount = 0;
  let expressivePrimitiveUsageCount = 0;

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
        if (/\btransitionName\b/.test(text)) {
          cardTransitionMorphing = true;
        }
      }
      const shellBytes = readTarget(target, 'src/layouts/SiteShell.astro').bytes;
      if (shellBytes) {
        const shellText = shellBytes.toString('utf8');
        siteShellChoreography =
          /\bdata-surface-toggle\b/.test(shellText) &&
          /\bdata-sticky-header\b/.test(shellText) &&
          /\bdata-vt-loading\b/.test(shellText);
      }
      for (const relFile of [...scanAstroDir('src/pages'), ...scanAstroDir('src/components')]) {
        if (relFile === 'src/pages/_styleguide.astro' || relFile === 'src/components/Container.astro' || relFile === 'src/components/dev/Styleguide.astro') continue;
        const pageBytes = readTarget(target, relFile).bytes;
        if (!pageBytes) continue;
        const pageText = pageBytes.toString('utf8');
        if (/<Container\b[^>]*\bbreakout\b|\bcontent-grid\b/.test(pageText)) breakoutPageCount++;
        if (/\bdata-surface=/.test(pageText)) surfaceUsageCount++;
        if (/\b(?:bento-grid|ui-specimen|grid-hairline|surface-elevated|surface-glass|surface-spotlight|eyebrow-telemetry|font-accent|tabular-nums|data-reveal)\b/.test(pageText)) {
          expressivePrimitiveUsageCount++;
        }
      }
    }
  } catch {
    componentsObserved = false;
  }

  if (!componentsObserved) {
    add(
      'design-system:card-and-breakout',
      'unverified',
      'Semantic <article> Card with .clickable-parent/.focus-parent, concentric --card-media-radius, CMS edit forwarding, View Transition morphing, SiteShell choreography, and Container breakout',
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
      cmsEditForwarding &&
      cardTransitionMorphing &&
      siteShellChoreography;
    add(
      'design-system:card-and-breakout',
      cardPass ? 'pass' : 'warning',
      'Semantic <article> Card with .clickable-parent/.focus-parent, concentric --card-media-radius, CMS edit forwarding, View Transition morphing, SiteShell choreography, and Container breakout',
      {
        containerBreakout,
        cardComponentCount,
        wholeCardAnchorCount,
        clickableParentCardCount,
        concentricMediaRadius,
        cmsEditForwarding,
        cardTransitionMorphing,
        siteShellChoreography,
        breakoutPageCount,
        surfaceUsageCount,
        expressivePrimitiveUsageCount,
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

