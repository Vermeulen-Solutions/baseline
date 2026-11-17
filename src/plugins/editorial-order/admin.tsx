import { Button } from '@cloudflare/kumo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { COLLECTION, IMAGE_FIELD, LOCALES, ORDER_FIELD, TEXT, TITLE_FIELD } from './config';
import { dropIndex, move, orderChanges, orderRows, type OrderItem, type OrderRow } from './order';
import './styles.css';

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/_emdash/api${path}`, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error?.message || `HTTP ${response.status}`);
  return result.data;
}

async function listLocale(locale: string): Promise<OrderItem[]> {
  const items: OrderItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await api<{ items: OrderItem[]; nextCursor?: string }>(`/content/${COLLECTION}?locale=${encodeURIComponent(locale)}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return items;
}

const titleOf = (row: OrderRow) => String(row.entry.data?.[TITLE_FIELD] ?? '');
const imageOf = (row: OrderRow): string | undefined => (IMAGE_FIELD ? row.entry.data?.[IMAGE_FIELD]?.url : undefined);

function EditorialOrderPage() {
  const [rows, setRows] = useState<readonly OrderRow[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  // The drag origin lives in a ref: a quick drag can end before React re-renders with the new state.
  const dragFrom = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = (await Promise.all(LOCALES.map(listLocale))).flat();
      const next = orderRows(items, { field: ORDER_FIELD, preferredLocale: LOCALES[0], titleField: TITLE_FIELD });
      setRows(next);
      setSaved(next.map(row => row.group));
    } catch (error) {
      setMessage({ kind: 'alert', text: `${TEXT.loadFailed} ${(error as Error).message}` });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const dirty = rows.map(row => row.group).join() !== saved.join();
  const shift = (from: number, to: number, focus = false) => {
    setRows(current => move(current, from, to));
    setMessage(null);
    if (focus) requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('[data-handle]')[to]?.focus());
  };

  // Pointer events cover mouse, pen and touch; HTML5 drag-and-drop does not fire on touch screens.
  // A mouse grabs a row anywhere; touch grabs only the ⠿ handle (touch-action: none) so the page still scrolls.
  const targetIndex = (clientY: number) => dropIndex([...(listRef.current?.children ?? [])].map(item => item.getBoundingClientRect()), clientY);
  const startDrag = (event: React.PointerEvent<HTMLLIElement>, index: number) => {
    const target = event.target as HTMLElement;
    const onHandle = Boolean(target.closest('[data-handle]'));
    if (saving || event.button !== 0 || (!onHandle && (event.pointerType !== 'mouse' || target.closest('button, a')))) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragFrom.current = index;
    setDragging(index);
    setOver(index);
  };
  const moveDrag = (event: React.PointerEvent<HTMLLIElement>) => {
    if (dragFrom.current === null) return;
    const next = targetIndex(event.clientY);
    if (next !== over) setOver(next);
  };
  const endDrag = (event: React.PointerEvent<HTMLLIElement>, commit: boolean) => {
    const from = dragFrom.current;
    if (from === null) return;
    dragFrom.current = null;
    if (commit) shift(from, targetIndex(event.clientY));
    setDragging(null);
    setOver(null);
  };

  const save = async () => {
    const { changes, blocked } = orderChanges(rows, ORDER_FIELD);
    if (blocked.length) {
      setMessage({ kind: 'alert', text: TEXT.blocked(blocked.map(({ row }) => titleOf(row)).join(', ')) });
      return;
    }
    setSaving(true);
    setMessage(null);
    let done = 0;
    try {
      for (const { row, position } of changes) {
        const { id, status } = row.entry;
        const current = await api<{ _rev?: string }>(`/content/${COLLECTION}/${id}`);
        await api(`/content/${COLLECTION}/${id}`, 'PUT', { data: { [ORDER_FIELD]: position }, _rev: current._rev });
        // Publishing makes the number live and, for a non-translatable field, copies it to the other locales.
        if (status === 'published') {
          const updated = await api<{ _rev?: string }>(`/content/${COLLECTION}/${id}`);
          await api(`/content/${COLLECTION}/${id}/publish`, 'POST', { _rev: updated._rev });
        }
        done += 1;
      }
      setMessage({ kind: 'status', text: changes.length ? TEXT.saved : TEXT.unchanged });
    } catch (error) {
      setMessage({ kind: 'alert', text: TEXT.partial(done, changes.length, (error as Error).message) });
    } finally {
      setSaving(false);
      await load();
    }
  };

  const restore = () => {
    setRows(current => saved.map(group => current.find(row => row.group === group)).filter((row): row is OrderRow => Boolean(row)));
    setMessage(null);
  };

  return <section className="site-order">
    <header>
      <h1>{TEXT.heading}</h1>
      <p>{TEXT.intro}</p>
      <p className="site-order-hint">{TEXT.keyboardHint}</p>
    </header>
    {loading && !rows.length && <p role="status">{TEXT.loading}</p>}
    <ol ref={listRef} aria-label={TEXT.listLabel}>
      {rows.map((row, index) => <li
        key={row.group}
        className={[dragging === index && 'is-dragging', dragging !== null && over === index && dragging !== index && (index < dragging ? 'is-drop-before' : 'is-drop-after')].filter(Boolean).join(' ') || undefined}
        onPointerDown={event => startDrag(event, index)}
        onPointerMove={moveDrag}
        onPointerUp={event => endDrag(event, true)}
        onPointerCancel={event => endDrag(event, false)}
      >
        <button
          type="button" data-handle className="site-order-handle" disabled={saving}
          aria-label={TEXT.handle(titleOf(row), index + 1, rows.length)}
          onKeyDown={event => {
            if (event.key === 'ArrowUp' && index > 0) { event.preventDefault(); shift(index, index - 1, true); }
            if (event.key === 'ArrowDown' && index < rows.length - 1) { event.preventDefault(); shift(index, index + 1, true); }
          }}
        >⠿</button>
        <span className="site-order-position">{index + 1}</span>
        <span className="site-order-image">{imageOf(row) ? <img src={imageOf(row)} alt="" loading="lazy" draggable={false} /> : null}</span>
        <span className="site-order-name">
          <strong>{titleOf(row)}</strong>
          {row.entry.status !== 'published' && <span>{TEXT.notPublished}</span>}
        </span>
        <span className="site-order-moves">
          <Button type="button" variant="secondary" size="sm" disabled={saving || index === 0} onClick={() => shift(index, index - 1)} aria-label={TEXT.up(titleOf(row))}>↑</Button>
          <Button type="button" variant="secondary" size="sm" disabled={saving || index === rows.length - 1} onClick={() => shift(index, index + 1)} aria-label={TEXT.down(titleOf(row))}>↓</Button>
        </span>
      </li>)}
    </ol>
    <div className="site-order-actions">
      <Button type="button" variant="primary" disabled={!dirty || saving || loading} onClick={() => void save()}>{saving ? TEXT.saving : TEXT.save}</Button>
      <Button type="button" variant="secondary" disabled={!dirty || saving} onClick={restore}>{TEXT.restore}</Button>
      {dirty && !saving && <span className="site-order-unsaved">{TEXT.unsaved}</span>}
    </div>
    {message && <p role={message.kind} className={`site-order-message is-${message.kind}`}>{message.text}</p>}
  </section>;
}

export const pages = { '/': EditorialOrderPage };
