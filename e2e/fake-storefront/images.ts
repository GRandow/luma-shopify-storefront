/**
 * Product photos for the fake catalog: small SVG placeholders tinted by the
 * colour in the file name (`stoneware-mug-charcoal.svg`), so variant changes
 * are still visible and nothing is fetched from the network.
 */

const SWATCHES: Record<string, string> = {
  sand: '#d9c8a9',
  charcoal: '#45443f',
  sage: '#a7b392',
  oat: '#e4d8c1',
  forest: '#35503f',
  rust: '#b1603f',
  stone: '#bab4a8',
  white: '#f1efe9',
  clay: '#c4826a',
};

const NEUTRALS = ['#e8e1d6', '#dfe6dc', '#e9ddd3', '#dcdfe4', '#ece4cf', '#e2d9e3'];

function hash(value: string): number {
  let result = 0;
  for (const character of value) result = (result * 31 + character.charCodeAt(0)) >>> 0;
  return result;
}

function background(name: string): string {
  const swatch = Object.keys(SWATCHES).find((color) => name.endsWith(`-${color}`));
  return swatch
    ? (SWATCHES[swatch] ?? '#e8e1d6')
    : (NEUTRALS[hash(name) % NEUTRALS.length] ?? '#e8e1d6');
}

/** `name` is the file name without extension; only `[a-z0-9-]` is accepted. */
export function renderPlaceholder(name: string): string | null {
  if (!/^[a-z0-9-]{1,80}$/.test(name)) return null;
  const fill = background(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <rect width="1200" height="1200" fill="${fill}"/>
  <circle cx="600" cy="560" r="300" fill="#ffffff" fill-opacity="0.28"/>
  <rect x="380" y="820" width="440" height="36" rx="18" fill="#000000" fill-opacity="0.08"/>
</svg>`;
}
