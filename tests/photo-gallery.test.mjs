import test from 'node:test';
import assert from 'node:assert/strict';
import { photo, albumPhotos, photoUrl, galleryJsonLd } from '../src/lib/photo-gallery.ts';

test('native editor and seeded media shapes preserve ordered duplicates and context', () => {
  const editor = { _type: 'image', asset: { _ref: 'one', provider: 'local', url: '/_emdash/api/media/file/one.jpg' }, width: 1200, height: 800, alt: '', caption: '<b>Caption</b>' };
  const seeded = { _type: 'image', asset: { id: 'two', provider: 'local', meta: { storageKey: 'two.jpeg' }, width: 800, height: 1200, alt: 'Library alt' }, alt: 'Album alt' };
  const images = albumPhotos([{ _type: 'gallery', images: [editor, seeded, editor] }]);
  assert.deepEqual(images.map(p => p.asset._ref), ['one', 'two', 'one']);
  assert.equal(images[0].alt, '');
  assert.equal(images[0].caption, '<b>Caption</b>');
  assert.equal(images[1].alt, 'Album alt');
  assert.equal(images[1].width, 800);
  assert.equal(photoUrl(images[1]), '/_emdash/api/media/file/two.jpeg');
});

test('storage keys remain distinct from media IDs and can use the public media origin', () => {
  assert.equal(photoUrl(photo({ id: 'bare-id', provider: 'local' })), '');
  const p = photo({ id: 'different-media-id', src: '/_emdash/api/media/file/one.jpg', provider: 'local' });
  assert.equal(photoUrl(p, key => `https://cdn.example/${key}`), 'https://cdn.example/one.jpg');
  assert.equal(photoUrl(photo({ id: 'remote-id', provider: 'unsplash' })), '');
});

test('malformed input and unsafe full-image links do not become substitute images', () => {
  assert.deepEqual(albumPhotos(null), []);
  assert.deepEqual(albumPhotos([{ _type: 'gallery', images: [null, 'wordpress-attachment:3', {}] }]), []);
  for (const src of ['javascript:alert(1)', 'data:text/html,hello', '//example.com/photo.jpg']) {
    assert.equal(photoUrl(photo({ src })), '');
  }
  const p = photo({ id: 'one', width: -1, height: Infinity });
  assert.equal(p.width, undefined); assert.equal(p.height, undefined);
});

test('galleryJsonLd generates valid Schema.org ImageGallery structured data', () => {
  const photos = albumPhotos([{
    _type: 'gallery',
    images: [
      { _type: 'image', asset: { _ref: 'img1', url: '/_emdash/api/media/file/one.jpg' }, width: 1200, height: 800, alt: 'Photo 1', caption: 'First photo' },
      { _type: 'image', asset: { _ref: 'img2', url: 'https://cdn.example.com/two.jpg' }, width: 800, height: 600, alt: 'Photo 2' }
    ]
  }]);

  const jsonLd = galleryJsonLd(photos, {
    siteUrl: 'https://example.com',
    title: 'Exhibition 2026'
  });

  assert.ok(jsonLd);
  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.equal(jsonLd['@type'], 'ImageGallery');
  assert.equal(jsonLd.name, 'Exhibition 2026');
  assert.equal(jsonLd.associatedMedia.length, 2);

  // Relative URL resolved against siteUrl
  assert.equal(jsonLd.associatedMedia[0].contentUrl, 'https://example.com/_emdash/api/media/file/one.jpg');
  assert.equal(jsonLd.associatedMedia[0].name, 'Photo 1');
  assert.equal(jsonLd.associatedMedia[0].caption, 'First photo');
  assert.equal(jsonLd.associatedMedia[0].width, 1200);

  // Absolute URL preserved
  assert.equal(jsonLd.associatedMedia[1].contentUrl, 'https://cdn.example.com/two.jpg');
  assert.equal(jsonLd.associatedMedia[1].name, 'Photo 2');
  assert.equal(jsonLd.associatedMedia[1].caption, undefined);

  // Empty or invalid input returns null
  assert.equal(galleryJsonLd([]), null);
  assert.equal(galleryJsonLd(null), null);
});
