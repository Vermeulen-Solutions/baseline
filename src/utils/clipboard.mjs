/**
 * Copy text to the clipboard, trying the most capable strategy first and degrading to one
 * that still works when the document is not focused.
 *
 * `navigator.clipboard.writeText` is refused with `NotAllowedError: Document is not focused`
 * whenever the document lacks focus - DevTools focused, browser window not the active window,
 * or an embedded frame. That rejection is not a permission problem and not a secure-context
 * problem, and it looks exactly like a dead button. The legacy selection route is deprecated
 * but keeps working in those cases, so it is the fallback rather than the replacement.
 *
 * @param {string} text the text to place on the clipboard
 * @param {{navigator?: object, document?: object}} [env] injection point for tests
 * @returns {Promise<'clipboard' | 'execCommand' | 'manual'>} which strategy reached the clipboard
 */
export async function copyText(text, env = globalThis) {
  const clipboard = env?.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return 'clipboard';
    } catch {
      // Fall through: the usual cause is an unfocused document, which the next strategy tolerates.
    }
  }

  const document = env?.document;
  if (document && typeof document.execCommand === 'function') {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
    document.body.appendChild(field);
    try {
      field.focus();
      field.select();
      if (document.execCommand('copy')) return 'execCommand';
    } catch {
      // Fall through to manual: the caller reveals the text instead.
    } finally {
      field.remove();
    }
  }

  return 'manual';
}
