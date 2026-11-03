import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  resolveFormAction,
  resolveFormTransport,
  getInstalledProfile,
  isExecutableScheme,
  hasCredentials,
  normalizeToCRLF,
  encodePlainTextFormData,
  sanitizeFormValue,
  validateFormField,
  formatFormErrors,
} from '../src/lib/form-transport.ts';

test('skeleton shimmer defines geometry tokens, non-cyclic card height, accessible busy states, and reduced motion fallback', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');

  // Geometry tokens
  assert.ok(css.includes('--skeleton-width'), 'CSS must define --skeleton-width');
  assert.ok(css.includes('--skeleton-height'), 'CSS must define --skeleton-height');
  assert.ok(css.includes('--skeleton-radius'), 'CSS must define --skeleton-radius');
  assert.ok(css.includes('--skeleton-aspect-ratio'), 'CSS must define --skeleton-aspect-ratio');

  // Variants & non-cyclic card height
  assert.ok(css.includes('.skeleton-shimmer--text'), 'CSS must define .skeleton-shimmer--text variant');
  assert.ok(css.includes('.skeleton-shimmer--circle'), 'CSS must define .skeleton-shimmer--circle variant');
  assert.ok(css.includes('.skeleton-shimmer--card'), 'CSS must define .skeleton-shimmer--card variant');
  assert.ok(
    !css.includes('--skeleton-height: var(--skeleton-height'),
    'Card skeleton must not declare a cyclic self-reference on --skeleton-height'
  );
  assert.ok(
    css.includes('min-block-size: var(--skeleton-height'),
    'Card skeleton must declare min-block-size to prevent collapsing to 0px'
  );

  // Accessibility & busy semantics
  assert.ok(css.includes(':where([aria-busy="true"])'), 'CSS must style [aria-busy="true"]');
  assert.ok(css.includes('cursor: progress'), '[aria-busy="true"] must set cursor: progress');
  assert.ok(css.includes('pointer-events: none'), 'Skeletons must suppress pointer events');

  // Reduced motion
  const reducedMotionIndex = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(reducedMotionIndex !== -1, 'CSS must include prefers-reduced-motion: reduce');
  const reducedCss = css.slice(reducedMotionIndex);
  assert.ok(reducedCss.includes('animation: none'), 'Reduced motion must disable shimmer animation');
  assert.ok(reducedCss.includes('background: var(--color-elevated)'), 'Reduced motion must fall back to static elevated background');
});

test('resolveFormTransport & resolveFormAction reject executable schemes and credentials', () => {
  // Executable schemes
  assert.ok(isExecutableScheme('javascript:alert(1)'));
  assert.ok(isExecutableScheme('  java\tscript:alert(2)  '));
  assert.ok(isExecutableScheme('data:text/html,<script>alert(1)</script>'));
  assert.ok(isExecutableScheme('vbscript:msgbox(1)'));
  assert.ok(!isExecutableScheme('https://example.com/api'));
  assert.ok(!isExecutableScheme('/api/contact'));

  // Credentials in URLs
  assert.ok(hasCredentials('https://admin:secret@example.com/api'));
  assert.ok(!hasCredentials('https://example.com/api'));
  assert.ok(!hasCredentials('/api/contact'));

  // Rejection via resolveFormAction
  assert.equal(resolveFormAction('javascript:alert(1)', 'static'), '');
  assert.equal(resolveFormAction('javascript:alert(1)', 'emdash'), '');
  assert.equal(resolveFormAction('https://user:pass@example.com/api', 'static'), '');
  assert.equal(resolveFormAction({ endpoint: 'data:text/html,evil' }, 'emdash'), '');
});

test('resolveFormTransport strictly preserves profile boundaries and normalizes URL protocols', () => {
  // Static profile: strictly requires HTTPS external URLs
  const externalUrl = 'https://api.formspree.io/f/xyz123';
  for (const staticProfile of ['static', 'static-sveltia']) {
    assert.equal(
      resolveFormAction(externalUrl, staticProfile),
      externalUrl,
      `${staticProfile} profile must accept external HTTPS form endpoints`
    );

    // Rejects HTTP regardless of scheme format (http:// or http:)
    assert.equal(
      resolveFormAction('http://insecure.test/api', staticProfile),
      '',
      `${staticProfile} profile must reject insecure http:// endpoints`
    );
    assert.equal(
      resolveFormAction('http:outside.test/form', staticProfile),
      '',
      `${staticProfile} profile must reject http:without-slashes endpoints`
    );

    // Rejects protocol-relative URLs (which submit plain HTTP from HTTP documents)
    assert.equal(
      resolveFormAction('//outside.test/form', staticProfile),
      '',
      `${staticProfile} profile must reject protocol-relative // destinations`
    );

    // Rejects backslash network references
    assert.equal(
      resolveFormAction('\\\\outside.test\\form', staticProfile),
      '',
      `${staticProfile} profile must reject backslash network destinations`
    );

    // Refuses local /_actions routes and path traversal variants
    assert.equal(
      resolveFormAction({ profile: staticProfile, endpoint: '/_actions/contact' }),
      '',
      `${staticProfile} profile must refuse local /_actions routes`
    );
    assert.equal(
      resolveFormAction('./_actions/contact', staticProfile),
      '',
      `${staticProfile} profile must refuse ./_actions path traversal`
    );
    assert.equal(
      resolveFormAction('/x/../_actions/contact', staticProfile),
      '',
      `${staticProfile} profile must refuse /x/../_actions path traversal`
    );

    // Refuses action queries regardless of query parameter position
    assert.equal(
      resolveFormAction('?lang=en&_action=contact', staticProfile),
      '',
      `${staticProfile} profile must refuse non-leading _action query parameters`
    );
    assert.equal(
      resolveFormAction('?foo=1&_action=test', staticProfile),
      '',
      `${staticProfile} profile must refuse _action query parameter`
    );
    assert.equal(
      resolveFormAction('?foo=1&_astroAction=test', staticProfile),
      '',
      `${staticProfile} profile must refuse _astroAction query parameter`
    );

    // Refuses actionName to prevent server promotion
    assert.equal(
      resolveFormAction({ profile: staticProfile, actionName: 'contact' }),
      '',
      `${staticProfile} profile must refuse actionName to prevent server promotion`
    );

    // Static profile is authoritative: caller configuration cannot widen to emdash
    const callerOverride = resolveFormTransport({ profile: 'emdash', actionName: 'contact' }, staticProfile);
    assert.equal(
      callerOverride.action,
      '',
      `${staticProfile} profile must be authoritative and reject caller profile: emdash action override`
    );
    assert.equal(
      callerOverride.rpcAction,
      undefined,
      `${staticProfile} profile must not emit RPC action endpoint on caller override`
    );

    const callerEndpointOverride = resolveFormTransport(
      { profile: 'emdash', endpoint: 'http://outside.test/form' },
      staticProfile
    );
    assert.equal(
      callerEndpointOverride.action,
      '',
      `${staticProfile} profile must reject caller profile: emdash insecure endpoint override`
    );
  }

  // Profile auto-detection helper exists and returns known profile
  const detected = getInstalledProfile();
  assert.ok(['static', 'static-sveltia', 'emdash'].includes(detected));

  // Server / EmDash profile: distinguishes native fallback (?_action=...) from enhanced RPC (/_actions/...)
  if (detected === 'emdash') {
    const emdashTransport = resolveFormTransport({ profile: 'emdash', actionName: 'contact' });
    assert.equal(
      emdashTransport.action,
      '?_action=contact',
      'Native form action must target query string (?_action=contact) to preserve zero-JS HTML fallback'
    );
    assert.equal(
      emdashTransport.rpcAction,
      '/_actions/contact',
      'Enhanced RPC action must target /_actions/contact for JSON fetch calls'
    );
  } else {
    // In an installed static project, caller attempting profile: 'emdash' must be refused
    const staticInstalledTransport = resolveFormTransport({ profile: 'emdash', actionName: 'contact' });
    assert.equal(
      staticInstalledTransport.action,
      '',
      'Installed static environment must reject caller profile: emdash action override'
    );
    assert.equal(
      staticInstalledTransport.rpcAction,
      undefined,
      'Installed static environment must not emit RPC action endpoint'
    );
  }
});

test('sanitizeFormValue trims whitespace and enforces payload length ceilings', () => {
  assert.equal(sanitizeFormValue('  hello world  '), 'hello world');
  assert.equal(sanitizeFormValue(12345), '');
  assert.equal(sanitizeFormValue(null), '');

  const longString = 'a'.repeat(3000);
  assert.equal(sanitizeFormValue(longString, 2000).length, 2000, 'Payload values must be capped at maxLength');
});

test('validateFormField enforces bounds before truncation and handles stateful regexes deterministically', () => {
  // Max length check must NOT truncate before measuring length
  const codeRule = { required: true, maxLength: 3, fieldName: 'Code' };
  assert.equal(
    validateFormField('123456', codeRule),
    'Code cannot exceed 3 characters.',
    'Length validation must run on untruncated input'
  );
  assert.equal(validateFormField('123', codeRule), null);

  // Stateful regexes (with /g flag) must not alternate success/failure
  const statefulPattern = /^ok$/g;
  const statusRule = { fieldName: 'Status', pattern: statefulPattern };
  assert.equal(validateFormField('ok', statusRule), null, 'First match with /g pattern');
  assert.equal(validateFormField('ok', statusRule), null, 'Second successive match with /g pattern must also succeed');
  assert.equal(validateFormField('invalid', statusRule), 'Enter a valid format for status.');
  assert.equal(validateFormField('ok', statusRule), null, 'Subsequent match with /g pattern must succeed');
});

test('formatFormErrors maps error dictionaries to FormError accessible schema', () => {
  const errors = {
    email: 'Email address is invalid',
    message: 'Message cannot be empty',
  };
  const formatted = formatFormErrors(errors);
  assert.deepEqual(formatted, [
    { id: 'email', label: 'Email address is invalid' },
    { id: 'message', label: 'Message cannot be empty' },
  ]);
});

test('encodePlainTextFormData complies with WHATWG HTML form submission spec', () => {
  // LF normalization to CRLF
  assert.equal(normalizeToCRLF('hello\nworld'), 'hello\r\nworld');
  // CR normalization to CRLF
  assert.equal(normalizeToCRLF('hello\rworld'), 'hello\r\nworld');
  // Pre-existing CRLF idempotence
  assert.equal(normalizeToCRLF('hello\r\nworld'), 'hello\r\nworld');
  // Mixed line breaks
  assert.equal(normalizeToCRLF('a\nb\r\nc\rd'), 'a\r\nb\r\nc\r\nd');

  // Serialization of string fields and File entries
  const entries = [
    ['subject', 'Feedback Form'],
    ['message', 'Line 1\nLine 2\r\nLine 3'],
    ['attachment', { name: 'document.pdf', size: 1024, type: 'application/pdf' }],
  ];

  const serialized = encodePlainTextFormData(entries);
  assert.equal(
    serialized,
    'subject=Feedback Form\r\nmessage=Line 1\r\nLine 2\r\nLine 3\r\nattachment=document.pdf\r\n'
  );
});

test('Form.astro primitive complies with 0 KB JS fallback, unique error summary IDs, and in-flight/submitter semantics', () => {
  const component = readFileSync('src/components/Form.astro', 'utf8');

  // Semantic structure
  assert.ok(component.includes('<form'), 'Must render semantic <form>');
  assert.ok(component.includes('method={method.toUpperCase()}'), 'Form method must default to uppercase string');
  assert.ok(component.includes('action={transport.action'), 'Must bind transport action');
  assert.ok(component.includes('data-form-rpc={transport.rpcAction'), 'Must bind transport RPC endpoint');

  // Accessible announcements & unique IDs
  assert.ok(component.includes('role="status"'), 'Must render role="status" for live success announcement');
  assert.ok(component.includes('aria-live="polite"'), 'Success status must be polite');
  assert.ok(component.includes('data-form-success'), 'Success element must be marked data-form-success');
  assert.ok(component.includes("role") && component.includes("'alert'"), 'Error summary must declare role="alert"');
  assert.ok(
    component.includes('`${form.id}-errors`'),
    'Error summary ID must be dynamically derived from form.id to prevent duplicate DOM IDs'
  );

  // Selector-safe element removal without unescaped querySelector(#id) bugs
  assert.ok(
    component.includes('document.getElementById(errorSummaryId)') ||
    component.includes('data-form-error-summary'),
    'Error cleanup must not query unescaped ID selectors susceptible to colon/dot syntax errors'
  );

  // In-flight guard & submitter capture
  assert.ok(component.includes("dataset.formSubmitting === 'true'"), 'Must guard against concurrent/duplicate in-flight submissions');
  assert.ok(component.includes('new FormData(form, submitter'), 'Must capture submitter in FormData before disabling controls');
  assert.ok(component.includes('button:not([type="button"]):not([type="reset"])'), 'Must select all submit buttons');

  // Submitter overrides and effective method / action
  assert.ok(component.includes('formmethod'), 'Must inspect submitter formmethod override');
  assert.ok(component.includes('formaction'), 'Must inspect submitter formaction override');
  assert.ok(component.includes('formenctype'), 'Must inspect submitter formenctype override');

  // GET and text/plain encoding support with WHATWG CRLF and File name serialization
  assert.ok(component.includes("effectiveMethod === 'GET'"), 'Must handle effective GET method without request body');
  assert.ok(component.includes("effectiveEnctype === 'text/plain'"), 'Must handle text/plain encoding format');
  assert.ok(component.includes('normalizeCRLF'), 'text/plain submission must normalize line breaks to CRLF');
  assert.ok(component.includes("'name' in val"), 'text/plain submission must serialize File objects as filename');

  // CSS contracts
  assert.ok(component.includes('@layer components'), 'Styles must belong to @layer components');
  assert.ok(component.includes(':where([aria-busy="true"])'), 'Contextual styles must use :where()');
});
