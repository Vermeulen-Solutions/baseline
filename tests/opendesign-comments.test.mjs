import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, portsFromNetstat, portsFromLsof, listComments, summarize, formatText } from '../scripts/opendesign-comments.mjs';

test('parseArgs requires a project and checks statuses', () => {
  assert.throws(() => parseArgs([]), /--project/);
  assert.deepEqual(parseArgs(['--project', 'client-a']), { all: false, json: false, ids: [], project: 'client-a' });
  const resolve = parseArgs(['--project', 'client-a', '--resolve', 'cmt_1', 'cmt_2']);
  assert.equal(resolve.status, 'resolved');
  assert.deepEqual(resolve.ids, ['cmt_1', 'cmt_2']);
  assert.throws(() => parseArgs(['--project', 'a', '--status', 'done', 'cmt_1']), /must be one of/);
  assert.throws(() => parseArgs(['--project', 'a', '--resolve']), /comment ids/);
  assert.throws(() => parseArgs(['--project', 'a', 'cmt_1']), /Unknown option/);
  assert.equal(parseArgs(['--project', 'a', '--daemon', 'http://127.0.0.1:7508/']).daemon, 'http://127.0.0.1:7508');
});

test('daemon discovery reads loopback listeners of the OpenDesign processes only', () => {
  const netstat = [
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    127.0.0.1:7508         0.0.0.0:0              LISTENING       24948',
    '  TCP    127.0.0.1:7523         0.0.0.0:0              LISTENING       29480',
    '  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4',
    '  TCP    127.0.0.1:7508         127.0.0.1:50000        ESTABLISHED     24948',
    '  TCP    127.0.0.1:9000         0.0.0.0:0              LISTENING       1234',
  ].join('\r\n');
  assert.deepEqual(portsFromNetstat(netstat, ['24948', 29480]), [7508, 7523]);
  const lsof = [
    'COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME',
    'Open\\x20D 4242 me   31u  IPv4 0x1      0t0  TCP 127.0.0.1:7508 (LISTEN)',
    'node      777 me   20u  IPv4 0x2      0t0  TCP 127.0.0.1:3000 (LISTEN)',
  ].join('\n');
  assert.deepEqual(portsFromLsof(lsof), [7508]);
});

test('listComments gathers every conversation once and summarize keeps what an agent acts on', async () => {
  const comment = (id, conversationId, pinSeq, extra = {}) => ({
    id, conversationId, pinSeq, status: 'open', filePath: 'concept.html', elementId: 'call', selector: '[data-od-id="call"]',
    label: 'a.call', text: 'Call 079 000 00 00', note: 'make this stand out', attachments: [], ...extra,
  });
  const api = {
    conversations: async () => [{ id: 'c1' }, { id: 'c2' }],
    comments: async (_project, conversation) => conversation === 'c1'
      ? [comment('b', 'c1', 2), comment('a', 'c1', 1)]
      : [comment('a', 'c1', 1), comment('c', 'c2', 3, { status: 'resolved', selectionKind: 'pod', podMembers: [{ elementId: 'card-1' }, { elementId: 'card-2' }] })],
  };
  const all = await listComments(api, 'client-a');
  assert.deepEqual(all.map(item => item.id), ['a', 'b', 'c']);
  const summary = summarize(all[2]);
  assert.equal(summary.selector, '[data-od-id="call"]');
  assert.equal(summary.elementText, 'Call 079 000 00 00');
  assert.deepEqual(summary.group, ['card-1', 'card-2']);
  assert.equal(summary.conversation, 'c2');
  const text = formatText([summarize(all[0])], 'client-a');
  assert.match(text, /element: \[data-od-id="call"\] \(a\.call\)/);
  assert.match(text, /note: {4}make this stand out/);
  assert.equal(formatText([], 'client-a'), 'No comments to act on in client-a.');
});
