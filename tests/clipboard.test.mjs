import test from 'node:test';
import assert from 'node:assert/strict';
import { copyText } from '../src/utils/clipboard.mjs';

/** Minimal fake document that records what the fallback strategy did. */
function fakeDocument({ execResult = true } = {}) {
  const created = [];
  return {
    created,
    execCommand: (command) => {
      assert.equal(command, 'copy');
      return execResult;
    },
    createElement: () => {
      const element = { value: '', style: { cssText: '' }, setAttribute() {}, focus() { element.focused = true; }, select() { element.selected = true; }, remove() { element.removed = true; } };
      created.push(element);
      return element;
    },
    body: { appendChild() {} },
  };
}

test('copyText prefers the Clipboard API and reports which strategy worked', async () => {
  const calls = [];
  const env = {
    navigator: { clipboard: { writeText: async (text) => { calls.push(text); } } },
    document: fakeDocument(),
  };

  assert.equal(await copyText('hello', env), 'clipboard');
  assert.deepEqual(calls, ['hello']);
  assert.equal(env.document.created.length, 0, 'no temporary field should be created when the API works');
});

test('copyText falls back to execCommand when the document is not focused', async () => {
  const document = fakeDocument();
  const env = {
    // This is exactly what Chrome does when the document lacks focus.
    navigator: { clipboard: { writeText: async () => { const error = new Error('Document is not focused.'); error.name = 'NotAllowedError'; throw error; } } },
    document,
  };

  assert.equal(await copyText('receipt json', env), 'execCommand');
  assert.equal(document.created.length, 1, 'a temporary field carries the text for the legacy copy');
  const field = document.created[0];
  assert.equal(field.value, 'receipt json');
  assert.equal(field.selected, true, 'the text must be selected or execCommand copies nothing');
  assert.equal(field.removed, true, 'the temporary field must not be left in the document');
});

test('copyText reports manual when no strategy can reach the clipboard', async () => {
  const document = fakeDocument({ execResult: false });
  const env = {
    navigator: { clipboard: { writeText: async () => { throw new Error('nope'); } } },
    document,
  };

  assert.equal(await copyText('text', env), 'manual');
  assert.equal(document.created[0].removed, true, 'a failed attempt must still clean up');
});

test('copyText falls back when the Clipboard API is unavailable entirely', async () => {
  const document = fakeDocument();
  assert.equal(await copyText('text', { navigator: {}, document }), 'execCommand');
  assert.equal(document.created[0].value, 'text');
});
