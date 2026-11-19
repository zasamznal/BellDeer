// Bundled JetBrains Mono (OFL) so the HUD type is identical offline and inside
// a portal iframe; nothing is fetched from a font CDN.
import latin from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import cyrillic from '@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-400-normal.woff2?url';

export function loadFonts(): void {
  if (typeof FontFace === 'undefined') return;
  const faces = [
    new FontFace('BD Mono', `url(${latin}) format('woff2')`, { weight: '400', unicodeRange: 'U+0000-00FF, U+2010-2027, U+2212' }),
    new FontFace('BD Mono', `url(${cyrillic}) format('woff2')`, { weight: '400', unicodeRange: 'U+0400-04FF, U+2116' }),
  ];
  for (const f of faces) {
    document.fonts.add(f);
    void f.load().catch(() => undefined);
  }
}
