# Asset notes

All pixel numbers are in the file's own pixel space. `measurements.json` has the same numbers for the build to read.

## What's here

| File | What | Notes |
|------|------|-------|
| `img/handheld-body.webp` | Handheld, front/top-down view (790 x 1290) | Screen is a transparent hole at x175 y210, 440 x 396. The live screen sits in a layer behind this image. Buttons, D-pad and A/B are faint baked recesses; overlay CSS buttons on them. |
| `img/tv-crt.webp` | Retro TV, front (1278 x 999) | Screen hole at x154 y152, 798 x 661. Same layering. |
| `img/console-topload.webp` | Top-loading console (2262 x 1061) | Slot opening x456 y127, 1353 x 97. Clip the cartridge at y232 so it disappears behind the front rim as it descends. |
| `img/room-backdrop.webp` | Wall + table, 2752 x 1536 | Table top edge about y1090, front lip about y1310, objects rest on y1230 to 1255. Table's left corner is at about x110, so keep objects right of it. |
| `img/desk-top.webp` | Wooden board, interior only (2280 x 1100) | Landscape, for the laptop-sized handheld scene or backgrounds. Not tileable. |
| `img/desk-top-portrait.webp` | Same board rotated 90 degrees (1100 x 2280) | Use for the phone handheld scene. |
| `svg/cartridge-shell.svg` | Cartridge, 800 x 900, connector at the bottom | Label area x140 y210, 520 x 390 (4:3). Title plate x180 y640, 440 x 72 for HTML text. |
| `svg/label-*.svg` | Five label illustrations, 960 x 720 (4:3) | murces teal, sentric red, cireu violet, cfplink amber, aggregator lime. No text; add names in HTML. |
| `svg/glass-overlay.svg` | Screen glass, real transparency | Stretches to any screen shape (`preserveAspectRatio="none"`). No blend mode needed. |
| `svg/favicon.svg` | Cartridge icon | Readable at 16 px. |
| `style-check-*.png` | Test composites of the assets | Placement is rough. They only prove the styles match. |

## Layer order

**TV scene (bottom to top):** backdrop, live screen, TV, console, cartridge (clipped at console y232).

**Handheld scene:** desk, live screen, cartridge sliding in from above, handheld on top so the cartridge tucks behind the top edge. Cartridges enter downward in both scenes, so one shell orientation covers both.

## Things to know

- The shell and labels are separate on purpose. Layer a label over the shell's label area and put the project name in HTML on the title plate.
- The desk is more orange than the backdrop's table. Tone it with `filter: saturate(.8) hue-rotate(-6deg)` or similar if you want them to match.
- The three object images had a thin magenta halo from background removal. It has been cleaned and the edges trimmed 1 px.
- The handheld's overall layout (bezel with a cut corner, D-pad, pill A/B, diagonal speaker grille) follows the classic Game Boy closely. There are no logos or text, but if you want more distance from it, change the grille or bezel shape before launch.
