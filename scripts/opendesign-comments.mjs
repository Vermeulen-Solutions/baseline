#!/usr/bin/env node
// Read the owner's comments on OpenDesign artifacts, and mark them as handled.
//
//   npm run design:comments -- --project client-a              open comments, one block each
//   npm run design:comments -- --project client-a --all        include resolved ones
//   npm run design:comments -- --project client-a --json       machine-readable
//   npm run design:comments -- --project client-a --resolve <comment-id> [<comment-id> ...]
//   npm run design:comments -- --project client-a --status needs_review <comment-id>
//
// The owner leaves comments in the OpenDesign desktop app: Comment in the preview toolbar, click an
// element, type a note, choose Comment (not Send to chat). Each comment is stored against that
// element: its data-od-id, a CSS selector, a label, its visible text and an HTML hint. So an agent
// does not have to guess what a note points at; it opens the artifact and edits that element.
//
// OpenDesign's MCP server has no comment tools (0.27.2). The desktop daemon serves comments over
// local HTTP (`/api/projects/<id>/conversations/<cid>/comments`); this script reads that API. It
// is not a documented public API: the script checks the answers' shape and stops with a clear
// message when an update changes them.
//
// Options:
//   --project <id>        OpenDesign project id (required).
//   --daemon <url>        Daemon origin. Default: $OD_DAEMON_URL, else the listening ports of the
//                         running OpenDesign processes, else http://127.0.0.1:7456.
//   --all                 Also list resolved comments.
//   --json                Print JSON instead of text.
//   --resolve <id...>     Set these comments to `resolved` after the change is made and checked.
//   --status <s> <id...>  Set another status: open, applying, needs_review or resolved.
//   --help
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const STATUSES = ['open', 'applying', 'needs_review', 'resolved'];
export const DEFAULT_DAEMON = 'http://127.0.0.1:7456';

export function parseArgs(argv) {
  const out = { all: false, json: false, ids: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) throw Error('Missing value for ' + flag);
      return next;
    };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--project') out.project = value();
    else if (flag === '--daemon') out.daemon = value().replace(/\/+$/, '');
    else if (flag === '--all') out.all = true;
    else if (flag === '--json') out.json = true;
    else if (flag === '--resolve') out.status = 'resolved';
    else if (flag === '--status') out.status = value();
    else if (!flag.startsWith('--') && out.status) out.ids.push(flag);
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.project) throw Error('--project <id> is required');
  if (out.status && !STATUSES.includes(out.status)) throw Error(`--status must be one of ${STATUSES.join(', ')}`);
  if (out.status && out.ids.length === 0) throw Error('Name the comment ids to update');
  return out;
}

/** Ports in LISTEN state owned by the given process ids, from `netstat -ano` (Windows). */
export function portsFromNetstat(output, pids) {
  const wanted = new Set(pids.map(String));
  const ports = [];
  for (const line of output.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (cols[0] !== 'TCP' || cols[3] !== 'LISTENING' || !wanted.has(cols[4])) continue;
    const match = /^(?:127\.0\.0\.1|\[::1\]):(\d+)$/.exec(cols[1]);
    if (match) ports.push(Number(match[1]));
  }
  return [...new Set(ports)];
}

/** Ports from `lsof -nP -iTCP -sTCP:LISTEN` lines whose command is OpenDesign (macOS, Linux). */
export function portsFromLsof(output) {
  const ports = [];
  for (const line of output.split(/\r?\n/)) {
    if (!/^Open\\x20D|^Open Design|^open-desi/i.test(line)) continue;
    const match = /(?:127\.0\.0\.1|localhost|\[::1\]):(\d+) \(LISTEN\)/.exec(line);
    if (match) ports.push(Number(match[1]));
  }
  return [...new Set(ports)];
}

function candidatePorts() {
  try {
    if (process.platform === 'win32') {
      const tasks = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Open Design.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8' });
      const pids = [...tasks.matchAll(/^"[^"]+","(\d+)"/gm)].map(m => m[1]);
      if (!pids.length) return [];
      return portsFromNetstat(execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' }), pids);
    }
    return portsFromLsof(execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' }));
  } catch {
    return [];
  }
}

async function answersProjects(origin) {
  try {
    const response = await fetch(`${origin}/api/projects`, { headers: { Origin: origin }, signal: AbortSignal.timeout(1500) });
    if (!response.ok) return false;
    const body = await response.json();
    return Array.isArray(body?.projects);
  } catch {
    return false;
  }
}

/** The daemon origin: an explicit one, else the first running OpenDesign port that serves the projects API. */
export async function findDaemon(explicit, env = process.env) {
  const given = explicit ?? env.OD_DAEMON_URL;
  if (given) return given.replace(/\/+$/, '');
  for (const port of candidatePorts()) {
    const origin = `http://127.0.0.1:${port}`;
    if (await answersProjects(origin)) return origin;
  }
  if (await answersProjects(DEFAULT_DAEMON)) return DEFAULT_DAEMON;
  throw Error('No OpenDesign daemon answered. Open the OpenDesign desktop app, or pass --daemon http://127.0.0.1:<port>.');
}

export function client(origin) {
  const headers = { Origin: origin, 'Content-Type': 'application/json' };
  const call = async (method, path, body) => {
    const response = await fetch(origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text();
    if (!response.ok) throw Error(`${method} ${path}: ${response.status} ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : {};
  };
  return {
    conversations: async project => {
      const body = await call('GET', `/api/projects/${encodeURIComponent(project)}/conversations`);
      if (!Array.isArray(body.conversations)) throw Error('Unexpected conversations answer; this OpenDesign version changed its API.');
      return body.conversations;
    },
    comments: async (project, conversation) => {
      const body = await call('GET', `/api/projects/${encodeURIComponent(project)}/conversations/${encodeURIComponent(conversation)}/comments`);
      if (!Array.isArray(body.comments)) throw Error('Unexpected comments answer; this OpenDesign version changed its API.');
      return body.comments;
    },
    setStatus: async (project, conversation, id, status) => (await call('PATCH', `/api/projects/${encodeURIComponent(project)}/conversations/${encodeURIComponent(conversation)}/comments/${encodeURIComponent(id)}`, { status })).comment,
  };
}

/** Every comment in the project once, oldest pin first. Comments can sit in any conversation. */
export async function listComments(api, project) {
  const byId = new Map();
  for (const conversation of await api.conversations(project)) {
    for (const comment of await api.comments(project, conversation.id)) byId.set(comment.id, comment);
  }
  return [...byId.values()].sort((a, b) => (a.filePath ?? '').localeCompare(b.filePath ?? '') || (a.pinSeq ?? 0) - (b.pinSeq ?? 0));
}

/** The fields an agent needs to act on a comment. */
/**
 * The element's box in the owner's preview, in CSS px. A full-width element's width is the width
 * of the preview the owner looked at, which can be wider than the widths the agent checks.
 */
export function boxOf(position) {
  const numbers = ['x', 'y', 'width', 'height'].map(key => Number(position?.[key]));
  if (numbers.some(value => !Number.isFinite(value))) return undefined;
  const [x, y, width, height] = numbers.map(Math.round);
  return { x, y, width, height };
}

export function summarize(comment) {
  return {
    id: comment.id,
    status: comment.status,
    file: comment.filePath,
    element: comment.elementId,
    selector: comment.selector,
    label: comment.label,
    elementText: comment.text || '',
    note: comment.note,
    box: boxOf(comment.position),
    group: comment.selectionKind === 'pod' ? (comment.podMembers ?? []).map(member => member.elementId ?? member.selector).filter(Boolean) : undefined,
    attachments: (comment.attachments ?? []).length,
    author: comment.authorDisplayName || undefined,
    pin: comment.pinSeq,
    conversation: comment.conversationId,
  };
}

export function formatText(comments, project) {
  if (!comments.length) return `No comments to act on in ${project}.`;
  return comments.map(comment => [
    `#${comment.pin ?? '?'} ${comment.id} [${comment.status}] ${comment.file}`,
    `  element: ${comment.selector}${comment.label ? ` (${comment.label})` : ''}`,
    comment.elementText ? `  text:    ${comment.elementText}` : null,
    comment.box ? `  box:     ${comment.box.width}×${comment.box.height} at ${comment.box.x},${comment.box.y}` : null,
    comment.group?.length ? `  group:   ${comment.group.join(', ')}` : null,
    `  note:    ${comment.note}`,
    comment.attachments ? `  attachments: ${comment.attachments} (open the comment in OpenDesign to see them)` : null,
  ].filter(Boolean).join('\n')).join('\n\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run design:comments -- --project <id> [--all] [--json] [--daemon <url>] [--resolve <id...> | --status <status> <id...>]');
    return;
  }
  const origin = await findDaemon(options.daemon);
  const api = client(origin);
  const comments = await listComments(api, options.project);
  if (options.status) {
    for (const id of options.ids) {
      const comment = comments.find(item => item.id === id);
      if (!comment) throw Error(`No comment ${id} in ${options.project}`);
      const updated = await api.setStatus(options.project, comment.conversationId, id, options.status);
      console.log(`${id}: ${comment.status} -> ${updated?.status ?? options.status}`);
    }
    return;
  }
  const shown = comments.filter(comment => options.all || comment.status !== 'resolved').map(summarize);
  console.log(options.json ? JSON.stringify({ daemon: origin, project: options.project, comments: shown }, null, 2) : formatText(shown, options.project));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => { console.error(`design:comments: ${error.message}`); process.exitCode = 1; });
}
