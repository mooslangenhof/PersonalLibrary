// Preset colour themes for book covers.
// `cover` is the cloth/leather colour, `accent` is the foil used for lettering and trim.
export const THEME_PRESETS = [
  { id: 'rose-gold', name: 'Rose & Gold', cover: '#d99ea4', accent: '#e2bd72' },
  { id: 'ocean-teal', name: 'Ocean Teal', cover: '#1d5c75', accent: '#8fd8cc' },
  { id: 'forest', name: 'Forest & Brass', cover: '#24452f', accent: '#d1ad62' },
  { id: 'crimson', name: 'Deep Crimson', cover: '#6e1620', accent: '#e0b46a' },
  { id: 'midnight', name: 'Midnight Ink', cover: '#1b2240', accent: '#c7cde8' },
  { id: 'amber', name: 'Amber Hearth', cover: '#a4561c', accent: '#f4d29a' },
  { id: 'lavender', name: 'Lavender Dusk', cover: '#6d5a8e', accent: '#ecd9f4' },
  { id: 'sage', name: 'Sage & Linen', cover: '#7d9277', accent: '#f3ead2' },
  { id: 'cocoa', name: 'Cocoa Leather', cover: '#4a2e22', accent: '#d9a85b' },
]

export const DEFAULT_THEME = THEME_PRESETS[0]

/** Pick a readable text colour (dark or light) for a given background hex. */
export function readableInk(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.62 ? '#2b1a12' : '#fbf3e4'
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. amt is -1..1 */
export function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex)
  const f = (c) => {
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)
    return Math.round(Math.min(255, Math.max(0, v)))
  }
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}
