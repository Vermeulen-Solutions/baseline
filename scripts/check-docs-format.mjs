import fs from 'node:fs';
import path from 'node:path';

export function unwrapMarkdown(content) {
  const hadCrlf = content.includes('\r\n');
  const lines = content.split(/\r?\n/);
  const result = [];
  let inCode = false;
  let codeFence = '';

  let i = 0;
  // Preserve frontmatter
  if (lines.length > 0 && lines[0].trim() === '---') {
    result.push(lines[0]);
    for (i = 1; i < lines.length; i++) {
      result.push(lines[i]);
      if (lines[i].trim() === '---') {
        i++;
        break;
      }
    }
  }

  let paragraph = [];
  let paragraphType = null; // 'prose' | 'list' | 'quote'
  let listPrefix = '';
  let quotePrefix = '';

  function flushParagraph() {
    if (paragraph.length === 0) return;
    if (paragraphType === 'list') {
      result.push(listPrefix + paragraph.join(' '));
    } else if (paragraphType === 'quote') {
      result.push(quotePrefix + paragraph.join(' '));
    } else {
      result.push(paragraph.join(' '));
    }
    paragraph = [];
    paragraphType = null;
    listPrefix = '';
    quotePrefix = '';
  }

  for (; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    const codeMatch = rawLine.match(/^(\s*)(`{3,}|~{3,})/);
    if (codeMatch) {
      if (!inCode) {
        flushParagraph();
        inCode = true;
        codeFence = codeMatch[2];
        result.push(rawLine);
        continue;
      } else {
        if (codeMatch[2].startsWith(codeFence[0]) && codeMatch[2].length >= codeFence.length) {
          inCode = false;
          codeFence = '';
          result.push(rawLine);
          continue;
        }
      }
    }

    if (inCode) {
      result.push(rawLine);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushParagraph();
      result.push('');
      continue;
    }

    // Headings, tables, hr
    if (trimmed.startsWith('#') || trimmed.startsWith('|') || /^([-*_]){3,}$/.test(trimmed)) {
      flushParagraph();
      result.push(rawLine);
      continue;
    }

    // Markdown intentional line breaks (ends in 2 spaces or backslash)
    const hasHardBreak = rawLine.endsWith('  ') || rawLine.endsWith('\\');

    // List item start: e.g. - item, * item, 1. item
    const listMatch = rawLine.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
    if (listMatch) {
      flushParagraph();
      if (hasHardBreak) {
        result.push(rawLine);
      } else {
        paragraphType = 'list';
        listPrefix = listMatch[1];
        paragraph.push(listMatch[2].trim());
      }
      continue;
    }

    // Blockquote
    const quoteMatch = rawLine.match(/^(\s*>\s*)(.*)$/);
    if (quoteMatch) {
      if (quoteMatch[2].startsWith('[!')) {
        flushParagraph();
        result.push(rawLine);
        continue;
      }
      if (paragraphType === 'quote') {
        paragraph.push(quoteMatch[2].trim());
      } else {
        flushParagraph();
        paragraphType = 'quote';
        quotePrefix = quoteMatch[1];
        paragraph.push(quoteMatch[2].trim());
      }
      continue;
    }

    // If currently in a list item, check if this is an indented continuation
    if (paragraphType === 'list') {
      if (/^\s{2,}/.test(rawLine)) {
        paragraph.push(trimmed);
        if (hasHardBreak) {
          flushParagraph();
        }
        continue;
      } else {
        flushParagraph();
      }
    }

    // Regular prose continuation
    if (paragraphType === 'prose') {
      paragraph.push(trimmed);
      if (hasHardBreak) {
        flushParagraph();
      }
      continue;
    }

    // Regular prose start
    flushParagraph();
    if (hasHardBreak) {
      result.push(rawLine);
    } else {
      paragraphType = 'prose';
      paragraph.push(trimmed);
    }
  }

  flushParagraph();
  let finalContent = result.join('\n');
  if (content.endsWith('\n') && !finalContent.endsWith('\n')) {
    finalContent += '\n';
  }
  return hadCrlf ? finalContent.replace(/\n/g, '\r\n') : finalContent;
}

function getMdFiles(dir) {
  let res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) res.push(...getMdFiles(full));
    else if (entry.name.endsWith('.md')) res.push(full);
  }
  return res;
}

export function checkDocsFormatting(targets = ['docs'], options = {}) {
  const isWrite = !!options.write;
  let unformatted = [];
  let checkedCount = 0;

  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    const stat = fs.statSync(target);
    const files = stat.isDirectory() ? getMdFiles(target) : [target];

    for (const file of files) {
      checkedCount++;
      const orig = fs.readFileSync(file, 'utf8');
      const unwrapped = unwrapMarkdown(orig);
      if (orig !== unwrapped) {
        unformatted.push(file);
        if (isWrite) {
          fs.writeFileSync(file, unwrapped, 'utf8');
        }
      }
    }
  }

  return { checkedCount, unformatted, isWrite };
}

if (process.argv[1] && process.argv[1].endsWith('check-docs-format.mjs')) {
  const isWrite = process.argv.includes('--write');
  const customTargets = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targets = customTargets.length ? customTargets : ['docs', 'profiles/static-sveltia/project/docs'];

  const { checkedCount, unformatted } = checkDocsFormatting(targets, { write: isWrite });

  if (isWrite) {
    console.log(`Docs format: formatted ${unformatted.length} of ${checkedCount} files.`);
  } else if (unformatted.length > 0) {
    console.error(`Docs format check: FAILED. Found ${unformatted.length} unformatted file(s) with hard-wrapped lines:`);
    for (const file of unformatted) {
      console.error(`  - ${file}`);
    }
    console.error(`\nRun: node scripts/check-docs-format.mjs --write`);
    process.exitCode = 1;
  } else {
    console.log(`Docs format check: PASS (${checkedCount} Markdown files checked).`);
  }
}
