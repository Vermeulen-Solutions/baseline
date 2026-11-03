import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  resolveFormAction,
  sanitizeFormValue,
  validateFormField,
  formatFormErrors,
} from '../src/lib/form-transport.ts';

test('skeleton shimmer defines geometry tokens, accessible busy states, and reduced motion fallback', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');

  // Geometry tokens
  assert.ok(css.includes('--skeleton-width'), 'CSS must define --skeleton-width');
  assert.ok(css.includes('--skeleton-height'), 'CSS must define --skeleton-height');
  assert.ok(css.includes('--skeleton-radius'), 'CSS must define --skeleton-radius');
  assert.ok(css.includes('--skeleton-aspect-ratio'), 'CSS must define --skeleton-aspect-ratio');

  // Variants
  assert.ok(css.includes('.skeleton-shimmer--text'), 'CSS must define .skeleton-shimmer--text variant');
  assert.ok(css.includes('.skeleton-shimmer--circle'), 'CSS must define .skeleton-shimmer--circle variant');
  assert.ok(css.includes('.skeleton-shimmer--card'), 'CSS must define .skeleton-shimmer--card variant');

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

test('resolveFormAction strictly preserves profile boundaries and transport modes', () => {
  // Static profile: accepts full external HTTPS URLs
  const externalUrl = 'https://api.formspree.io/f/xyz123';
  assert.equal(
    resolveFormAction({ profile: 'static', endpoint: externalUrl }),
    externalUrl,
    'Static profile must accept external HTTPS form endpoints'
  );

  // Static profile: refuses relative server action routes without promotion
  assert.equal(
    resolveFormAction({ profile: 'static', endpoint: '/_actions/contact' }),
    '',
    'Static profile must refuse local /_actions routes to avoid silent server promotion'
  );

  // Server / EmDash profile: accepts local actions and routes
  assert.equal(
    resolveFormAction({ profile: 'emdash', actionName: 'contact' }),
    '/_actions/contact',
    'EmDash profile must resolve Astro Actions paths'
  );

  assert.equal(
    resolveFormAction({ profile: 'emdash', endpoint: '/api/contact' }),
    '/api/contact',
    'EmDash profile must resolve custom API endpoints'
  );
});

test('sanitizeFormValue trims whitespace and enforces payload length ceilings', () => {
  assert.equal(sanitizeFormValue('  hello world  '), 'hello world');
  assert.equal(sanitizeFormValue(12345), '');
  assert.equal(sanitizeFormValue(null), '');

  const longString = 'a'.repeat(3000);
  assert.equal(sanitizeFormValue(longString, 2000).length, 2000, 'Payload values must be capped at maxLength');
});

test('validateFormField enforces bounds, required constraints, and format patterns', () => {
  const nameRule = { required: true, minLength: 2, maxLength: 50, fieldName: 'Name' };
  assert.equal(validateFormField('', nameRule), 'Name is required.');
  assert.equal(validateFormField('a', nameRule), 'Name must be at least 2 characters.');
  assert.equal(validateFormField('Valid Name', nameRule), null);

  const emailRule = {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    fieldName: 'Email',
  };
  assert.equal(validateFormField('not-an-email', emailRule), 'Enter a valid format for email.');
  assert.equal(validateFormField('person@example.test', emailRule), null);
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

test('Form.astro primitive complies with 0 KB JS fallback and accessible enhancement contracts', () => {
  const component = readFileSync('src/components/Form.astro', 'utf8');

  // Semantic structure
  assert.ok(component.includes('<form'), 'Must render semantic <form>');
  assert.ok(component.includes('method={method.toUpperCase()}'), 'Form method must default to uppercase string');
  assert.ok(component.includes('action={resolvedAction'), 'Must bind resolved action');

  // Accessible announcements
  assert.ok(component.includes('role="status"'), 'Must render role="status" for live success announcement');
  assert.ok(component.includes('aria-live="polite"'), 'Success status must be polite');
  assert.ok(component.includes('data-form-success'), 'Success element must be marked data-form-success');
  assert.ok(component.includes("role") && component.includes("'alert'"), 'Error summary must declare role="alert"');
  assert.ok(component.includes("id = 'form-errors'") || component.includes("'form-errors'"), 'Error summary must use #form-errors ID for linking');

  // Native constraint checking before JS fetch
  assert.ok(component.includes('form.checkValidity()'), 'Progressive enhancement must check native constraints first');
  assert.ok(component.includes('form.reportValidity()'), 'Invalid native constraints must report validity');

  // Busy state and submit button protection
  assert.ok(component.includes("form.setAttribute('aria-busy', 'true')"), 'In-flight submission must set aria-busy="true"');
  assert.ok(component.includes("submitBtn.setAttribute('disabled', 'true')"), 'Submit button must be disabled during submission');
  assert.ok(component.includes("form.removeAttribute('aria-busy')"), 'Completion must clear aria-busy');

  // CSS contracts
  assert.ok(component.includes('@layer components'), 'Styles must belong to @layer components');
  assert.ok(component.includes(':where([aria-busy="true"])'), 'Contextual styles must use :where()');
});
