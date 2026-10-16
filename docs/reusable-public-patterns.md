# Reusable public patterns

These are neutral infrastructure, not a client theme. Choose brand tokens and a real art direction before composing site pages. No client assets, sponsor collection, form storage or mail provider is installed by these patterns.

## Responsive media

ResponsiveImage uses native Astro `getImage`; static public originals receive Vite metadata and CMS images use EmDash’s storage-backed image endpoint. No prepared renditions or manifest is required. Pass accurate `sizes`, descriptive `alt`, and eager/high priority only for the primary above-fold image. Use `optimize={false}` for original artwork or animated media. Small originals remain unchanged and candidates never enlarge the source. See [image delivery](image-delivery.md) for hosting, live uploads, failure recovery and verification.

RichText wraps EmDash PortableText with shared image/gallery renderers. Use it inside `.flow`. Public image rendering respects native width, captions, links and alignment. The native PortableText editor remains owned by EmDash. Justified gallery previews receive actual row sizes and open original files in PhotoSwipe. Verify both public/editor contexts before launch.

## Cards

```astro
<Card title="Article title" href="/article/" action="Read article" headingLevel={2}
  image="/media/article.jpg" imageAlt="Describe the actual image"
  sizes="(max-width: 40rem) calc(100vw - 4rem), 50vw">
  <time slot="metadata" datetime="2026-10-05">5 October 2026</time>
  <p>Short introduction.</p>
</Card>
```

Use layout="horizontal" for wide rows, imageFit="contain" for full posters/artwork and imageAspect for an intentional frame. Slots support custom media, metadata and copy. This whole-link component must not contain links, buttons, inputs or other interactive descendants. For multi-action content compose a semantic article with independent links instead. Card actions align at the bottom of equal-height grid rows. Stress long/translated titles, absent media, uneven copy and odd final rows; don't force equal slots to fill empty space.

## CMS-owned partners

PartnersPanel receives items; partnersFromEntries normalizes structured logo references, active flags and ordering. No collection is added to the seed. When a site needs editor-owned partners, define title, URL, native logo, alt_text, sort_order, active and optional logo_ground fields in its collection, then use one shared querying component for all consuming pages.

```astro
---
import CMSPartnersPanel from '../components/CMSPartnersPanel.astro';
---
<CMSPartnersPanel collection="sponsors" locale={Astro.currentLocale} />
```

CMSPartnersPanel explicitly queries published entries, registers cache hints and applies no limit. Installed EmDash 1.3.0 returns the complete collection when limit is omitted; recheck this contract during upgrades. Choose deliberate shared/translatable collection semantics, not duplicate page lists. Add/remove/unpublish/deactivate in CMS and verify all consuming pages stay in sync. `logo_ground="dark"` places a dark inset behind artwork inside the light tile. Logos keep original colors. Hover changes no layout geometry; motion respects reduced motion. URL fields should use CMS URL validation.

## Form recovery and error summaries

The optional utility is independent of form storage/delivery. Configure Astro sessions (persistent shared storage for multi-instance/Cloudflare hosts) before claiming values can be recovered. In a POST handler, extract text fields and validate on the server; never persist passwords/tokens/files in recovery. Call `await saveFormRecovery(session, formName, {values,fields,reason}, allowedFields)` and redirect to the form with only a nonsensitive status. It returns false without a session: do not tell visitors answers were saved unless it succeeded.

On GET, `await readFormRecovery(session, formName)` consumes the 10-minute state once. Render values through escaped Astro expressions, use `<FormError message={localizedMessage} fields={[{id:'email',label:'Email'}]} />`, and associate field-specific errors with aria-invalid/aria-describedby. Messages/contact address/locales belong to the site. Form names must be fixed server-owned identifiers; recovery is per form/session, not a multi-tab submission store. Limits are 80 allowlisted strings, 2000 characters each and 16000 total; adapt limits and disclose truncation when longer answers are supported. Secret-like keys are omitted even if accidentally allowlisted.

Use native date inputs; birthDate accepts ISO and legacy dates, rejects impossible/future calendar values. Pass the site's current ISO date explicitly if its timezone differs from UTC. Put required fees/documents/process details before the form on mobile. Optional fields may use a native disclosure that opens when recovered answers exist. Preserve factual/consent copy. Provider selection, submission storage and email remain separate decisions.

## Focus and practical information

`data-surface="dark"` switches the focus role to color-focus-on-dark; it does not install a dark theme or alter body text/background. Set both roles from the real site palette and verify them against their actual grounds. Tables, filters and count/status belong together; deduplicate contacts without hiding distinct roles. Calendar actions should represent a real dated appointment, not imply a recurring schedule from a programme period.
