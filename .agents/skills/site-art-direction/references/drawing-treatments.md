# Drawing treatments

A figure from a drawn set (`npm run design:icons`) is a professional silhouette, but it is still an icon. Recoloured flat, it reads as a logo or clip-art: a trial sprayed a barn owl from game-icons flat in orange on a log end, and the reviewer called it "a heart-faced icon … a logo or clip-art, not a stencil sprayed on wood". The same owl read as paint only once three things were done. The world's medium was applied to it (a spray filter, stencil bridges cut through it, overspray around it). It was shown at about 780px. And it sat on the world's object (the log end), not on a plain ground. A turtle from the same set, with the same treatment at 150 to 300px, was still judged "close to an icon stamp" by two reviewers.

So a figure from a set gets all three:

1. **The world's medium, not only a colour.** Pick the process the world would mark a surface with: spray through a stencil, an ink stamp, a brand burnt into wood, a cross-stitch, an enamel sign, a screen print, a linocut. Build it as an SVG filter (the texture) and, where the medium has them, a mask (the cuts). The recipes below are starting points. Tune them at full size against the world's surface.
2. **Large.** Show the figure at least 480px on its short side on a 1,440px screen. That makes it an object of the page, not a mark beside a heading. Below about 300px a set figure reads as an icon whatever the treatment. At that size use the word, a photograph or a geometric mark instead, or keep the figure as one repeated small mark (a stamp on every tag) and not as a picture.
3. **On the world's object, and not quite whole.** Put it on the surface it was applied to (a log end, a crate, a label, a wall), with `mix-blend-mode: multiply` where the surface should show through. Let the object's edge crop it, turn it a few degrees, or let the coverage break. A reviewer still saw "the very clean, symmetrical wing panels" of the treated owl: the set's symmetry is the last thing that reads as an icon.

Where the set has no drawing of the subject, the word in the same treatment (sprayed, stamped, burnt) carries it. Do not substitute a nearby animal.

## Recipes

Each filter goes once in the layout, in a hidden `<svg width="0" height="0" aria-hidden="true" focusable="false">`. Apply it to a group around the figure: `<g filter="url(#spray-paint)"><path fill="currentColor" mask="url(#stencil-bridges)" d="…"/></g>`. Filter numbers are in the drawing's own units (game-icons uses a 512 viewBox), so a set with a 24 viewBox needs them scaled down about twenty times. Each recipe states the size it was tuned at.

### Spray through a stencil (tested in a trial at 780px)

The filter has four parts. A fine-noise displacement roughens the edge. A low-frequency noise makes the coverage patchy. A speckled mist of overspray sits around the figure. A soft drift falls to one side.

```html
<filter id="spray-paint" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="grain" />
  <feDisplacementMap in="SourceGraphic" in2="grain" scale="7" xChannelSelector="R" yChannelSelector="G" result="edge" />
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="patch" />
  <feColorMatrix in="patch" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.05" result="cover" />
  <feComposite in="edge" in2="cover" operator="in" result="paint" />
  <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="halo" />
  <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="21" result="speck" />
  <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 -6.6" result="dots" />
  <feComposite in="dots" in2="halo" operator="in" result="overspray" />
  <feMorphology in="SourceGraphic" operator="dilate" radius="14" result="wide" />
  <feComposite in="wide" in2="overspray" operator="in" result="mist" />
  <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="cloud" />
  <feOffset in="cloud" dx="12" dy="9" result="drift" />
  <feComponentTransfer in="drift" result="drift-soft"><feFuncA type="linear" slope="0.32" /></feComponentTransfer>
  <feComposite in="drift-soft" in2="dots" operator="out" result="drift-grain" />
  <feMerge><feMergeNode in="drift-grain" /><feMergeNode in="mist" /><feMergeNode in="paint" /></feMerge>
</filter>
```

Stencil bridges are the thin strips a cut stencil needs to hold together. They are geometry, so code draws them well. Two or three straight cuts through the figure, turned a few degrees, are enough:

```html
<mask id="stencil-bridges" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
  <rect width="512" height="512" fill="white" />
  <g fill="black" transform="rotate(-12 256 256)">
    <rect x="-60" y="176" width="632" height="10" />
    <rect x="-60" y="338" width="632" height="10" />
    <rect x="248" y="-60" width="9" height="632" />
  </g>
</mask>
```

Move the cuts for each figure so that they cross its body and not its eyes or face. Sprayed lettering (a title, the client's name) takes the same filter on an SVG `<text>`, or a stencil typeface.

### Ink stamp (tuned at 560px)

The edge is slightly rough. Blotches are missing where the ink did not take. The pressure is uneven, lighter towards one side.

```html
<filter id="ink-stamp" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" result="grain" />
  <feDisplacementMap in="SourceGraphic" in2="grain" scale="4" xChannelSelector="R" yChannelSelector="G" result="edge" />
  <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="3" seed="8" result="speck" />
  <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 7.2" result="voids" />
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="press" />
  <feColorMatrix in="press" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.3" result="pressure" />
  <feComposite in="edge" in2="voids" operator="in" result="inked" />
  <feComposite in="inked" in2="pressure" operator="in" />
</filter>
```

A stamp also wants its frame: the rubber block's rectangle or circle, as geometry around the figure, with the same filter.

### Brand burnt into wood (tuned at 560px)

The core is dark and charred unevenly, inside a scorched halo. Set the figure's own colour aside: the filter floods its own browns. Put it on the wood with `mix-blend-mode: multiply` so the grain shows through.

```html
<filter id="brand-burn" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="6" result="grain" />
  <feDisplacementMap in="SourceAlpha" in2="grain" scale="5" xChannelSelector="R" yChannelSelector="G" result="shape" />
  <feGaussianBlur in="shape" stdDeviation="6" result="heat" />
  <feFlood flood-color="#6b3514" flood-opacity="0.6" />
  <feComposite in2="heat" operator="in" result="scorch" />
  <feMorphology in="shape" operator="erode" radius="1.5" result="core-shape" />
  <feFlood flood-color="#24120a" />
  <feComposite in2="core-shape" operator="in" result="core" />
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" result="char" />
  <feColorMatrix in="char" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 0.15" result="depth" />
  <feComposite in="core" in2="depth" operator="in" result="charred" />
  <feMerge><feMergeNode in="scorch" /><feMergeNode in="charred" /></feMerge>
</filter>
```

Take the browns from the site's tokens.

## Cost and motion

A filter on a large figure is repainted whenever the figure changes. Move or reveal the figure through its wrapper: `transform`, `opacity` or a `clip-path` wipe that sprays it on. Never animate the filter's own attributes. Do not put a filtered figure inside an element that scrolls with a parallax transform on every frame. Change a filter's `seed` between figures so that two sprays on one page do not share the same mottling.

## Judging

Judge each figure in a capture at full size, beside the site's photographs. The reviewer's question is: "does this read as paint, ink or a burn on this object, or as an icon or a logo?" One "icon" or "logo" answer means the figure is enlarged, cropped or treated further. If it still reads as an icon after that, it is replaced by the word or a photograph.
