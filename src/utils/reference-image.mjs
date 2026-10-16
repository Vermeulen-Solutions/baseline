export const referenceLimits = { bytes: 10 * 1024 * 1024, pixels: 32_000_000, width: 16000, height: 60000 };

/** Inspect bounded raster headers before asking the browser to decode pixels. */
export function inspectReference(bytes, mime = '') {
  if (!bytes.length || bytes.length > referenceLimits.bytes) throw Error('Choose a nonempty reference of at most 10 MiB.');
  const b = bytes, view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let width, height, type;
  if (b.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v) && String.fromCharCode(...b.slice(12,16)) === 'IHDR') {
    type = 'image/png'; width = view.getUint32(16); height = view.getUint32(20);
  } else if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
    type = 'image/jpeg';
    for (let p = 2; p + 3 < b.length;) {
      if (b[p++] !== 255) break;
      while (b[p] === 255) p++;
      const marker = b[p++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (p + 2 > b.length) break;
      const length = view.getUint16(p);
      if (length < 2 || p + length > b.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 8) {
        height = view.getUint16(p + 3); width = view.getUint16(p + 5); break;
      }
      p += length;
    }
  } else if (b.length >= 30 && String.fromCharCode(...b.slice(0,4)) === 'RIFF' && String.fromCharCode(...b.slice(8,12)) === 'WEBP') {
    type = 'image/webp'; const chunk = String.fromCharCode(...b.slice(12,16));
    if (chunk === 'VP8X') { width = 1 + b[24] + (b[25] << 8) + (b[26] << 16); height = 1 + b[27] + (b[28] << 8) + (b[29] << 16); }
    if (chunk === 'VP8L' && b[20] === 47) { width = 1 + b[21] + ((b[22] & 63) << 8); height = 1 + (b[22] >> 6) + (b[23] << 2) + ((b[24] & 15) << 10); }
    if (chunk === 'VP8 ' && b[23] === 157 && b[24] === 1 && b[25] === 42) { width = view.getUint16(26, true) & 16383; height = view.getUint16(28, true) & 16383; }
  }
  if (!type || !width || !height || (mime && mime !== type)) throw Error('Choose a valid PNG, JPEG or WebP raster reference. SVG and remote URLs are unsupported.');
  if (width > referenceLimits.width || height > referenceLimits.height || width * height > referenceLimits.pixels) throw Error('Reference exceeds 32 megapixels or the 16000×60000 bitmap bounds.');
  return { width, height, type };
}
