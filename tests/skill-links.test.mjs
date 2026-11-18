import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources } from '../scripts/skill-sync.mjs';
import { EMDASH_ONLY_SKILLS, OPTIONAL_SKILLS } from '../scripts/standards-distribution.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const skillsRoot = path.join(root, '.agents/skills');

// Sites receive skills through skill sync, not Baseline's docs or audit folders, and may not install the
// optional design-surface skills, and static sites never receive the EmDash-only skills. A relative link
// from a skill must therefore stay inside .agents/skills, resolve to a file, and only reach an optional or
// EmDash-only skill from a skill of the same kind. Anything else links to
// Baseline's repository by URL, with the local path beside it.
test('Baseline-owned skills link only to files every receiving site has', () => {
  const problems = [];
  const walk = relative => {
    for (const entry of fs.readdirSync(path.join(skillsRoot, relative), { withFileTypes: true })) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { walk(child); continue; }
      if (!entry.name.endsWith('.md')) continue;
      const skill = child.split('/')[0];
      // Upstream mirrors are byte-for-byte copies; their links are upstream's to fix.
      if (sources.emdash.skills.includes(skill)) continue;
      const text = fs.readFileSync(path.join(skillsRoot, child), 'utf8');
      for (const [, href] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(?:https?:|#|mailto:)/.test(href)) continue;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(`.agents/skills/${child}`), href.split('#')[0]));
        if (!target.startsWith('.agents/skills/')) { problems.push(`${child}: ${href} leaves .agents/skills (link ${target} by URL)`); continue; }
        if (!fs.existsSync(path.join(root, target))) { problems.push(`${child}: ${href} does not exist`); continue; }
        const targetSkill = target.split('/')[2];
        if (targetSkill !== skill && EMDASH_ONLY_SKILLS.includes(targetSkill) && !EMDASH_ONLY_SKILLS.includes(skill)) problems.push(`${child}: ${href} reaches the EmDash-only ${targetSkill}, which static sites do not receive (link it by URL)`);
        if (targetSkill !== skill && OPTIONAL_SKILLS.includes(targetSkill) && !OPTIONAL_SKILLS.includes(skill)) problems.push(`${child}: ${href} reaches the optional ${targetSkill}, which a site may not install (link it by URL)`);
      }
    }
  };
  walk('');
  assert.deepEqual(problems, []);
});
