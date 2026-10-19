// Procedural canvas textures: wood, wallpaper, brick, rug, and book art.
// Everything is drawn in code, so the project needs no image assets.
import * as THREE from 'three'
import { hexToRgb, readableInk, shade } from '../data/themes'

/* ---------------------------------------------------------------- noise -- */

function makeNoise(seed = 1) {
  const perm = new Uint8Array(512)
  let s = seed * 9301 + 49297
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const grid = (x, y) => perm[(perm[x & 255] + y) & 511] / 255
  const smooth = (t) => t * t * (3 - 2 * t)

  const value = (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = smooth(x - xi)
    const yf = smooth(y - yi)
    const a = grid(xi, yi)
    const b = grid(xi + 1, yi)
    const c = grid(xi, yi + 1)
    const d = grid(xi + 1, yi + 1)
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
  }
  const fbm = (x, y, oct = 4) => {
    let f = 0
    let amp = 0.5
    let freq = 1
    for (let o = 0; o < oct; o++) {
      f += amp * value(x * freq, y * freq)
      freq *= 2
      amp *= 0.5
    }
    return f / (1 - Math.pow(0.5, oct))
  }
  return { value, fbm, rand }
}

const mix = (a, b, t) => a + (b - a) * t

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function toTexture(c, { repeat, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  tex.needsUpdate = true
  return tex
}

/* ----------------------------------------------------------------- wood -- */

/**
 * Wood planks with grain running along the length (texture y axis).
 * Returns { map, bump } — a colour map and a matching greyscale bump map.
 */
export function makeWoodTexture({
  size = 1024,
  planks = 6,
  light = '#7a4a2a',
  dark = '#3b2114',
  seed = 3,
  joints = true,
  grainScale = 1,
  repeat,
} = {}) {
  const c = canvas(size, size)
  const b = canvas(size, size)
  const ctx = c.getContext('2d')
  const bctx = b.getContext('2d')
  const img = ctx.createImageData(size, size)
  const bimg = bctx.createImageData(size, size)
  const n = makeNoise(seed)
  const L = hexToRgb(light)
  const D = hexToRgb(dark)
  const pw = size / planks
  const tones = Array.from({ length: planks }, () => 0.78 + n.rand() * 0.38)
  const offsets = Array.from({ length: planks }, () => n.rand() * 100)
  const jointY = Array.from({ length: planks }, () => n.rand() * size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.min(planks - 1, Math.floor(x / pw))
      const u = (x - col * pw) / pw
      const o = offsets[col]
      // Long streaky grain: low frequency across, very low along the plank.
      const warp = n.fbm((u * 3 + o) * grainScale, (y / size) * 2.5 + o, 3) * 6
      const rings = Math.sin((u * 22 * grainScale + warp) * Math.PI)
      const fine = n.value((x * 0.9 + o * 50) * grainScale, y * 0.02)
      let g = 0.5 + 0.28 * rings + 0.22 * (fine - 0.5) * 2
      g = Math.max(0, Math.min(1, g)) * 0.8 + n.fbm(x * 0.01 + o, y * 0.003, 2) * 0.2
      const tone = tones[col]
      let r = mix(D.r, L.r, g) * tone
      let gg = mix(D.g, L.g, g) * tone
      let bb = mix(D.b, L.b, g) * tone
      let h = 120 + g * 100

      // Seams between planks and staggered end joints.
      const edge = Math.min(x - col * pw, (col + 1) * pw - x)
      const seam = planks > 1 && edge < 2.2
      const joint = joints && Math.abs(((y - jointY[col] + size) % size) - 0) < 2
      if (seam || joint) {
        r *= 0.35
        gg *= 0.35
        bb *= 0.35
        h = 20
      }
      const i = (y * size + x) * 4
      img.data[i] = r
      img.data[i + 1] = gg
      img.data[i + 2] = bb
      img.data[i + 3] = 255
      bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = h
      bimg.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  bctx.putImageData(bimg, 0, 0)
  return { map: toTexture(c, { repeat }), bump: toTexture(b, { repeat, srgb: false }) }
}

/* ------------------------------------------------------------ wallpaper -- */

export function makeWallpaperTexture({ base = '#2f3a2c', motif = '#3b4836', repeat = [14, 4.5] } = {}) {
  const w = 256
  const h = 256
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  // Subtle stripes.
  for (let x = 0; x < w; x += 32) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(x, 0, 3, h)
  }
  // Small diamond-and-leaf motif.
  ctx.fillStyle = motif
  const drawMotif = (cx, cy, s) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy - s)
    ctx.quadraticCurveTo(cx + s * 0.55, cy, cx, cy + s)
    ctx.quadraticCurveTo(cx - s * 0.55, cy, cx, cy - s)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy - s * 1.25, s * 0.18, 0, Math.PI * 2)
    ctx.arc(cx, cy + s * 1.25, s * 0.18, 0, Math.PI * 2)
    ctx.fill()
  }
  drawMotif(64, 64, 22)
  drawMotif(192, 192, 22)
  drawMotif(192, -64, 22)
  drawMotif(64, 320, 22)
  // Paper grain.
  const n = makeNoise(11)
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const p = i / 4
    const v = (n.value((p % w) * 0.5, Math.floor(p / w) * 0.5) - 0.5) * 14
    img.data[i] += v
    img.data[i + 1] += v
    img.data[i + 2] += v
  }
  ctx.putImageData(img, 0, 0)
  return toTexture(c, { repeat })
}

/* ---------------------------------------------------------------- brick -- */

export function makeBrickTexture({ repeat = [1, 1] } = {}) {
  const w = 512
  const h = 512
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  const n = makeNoise(7)
  ctx.fillStyle = '#2b201b'
  ctx.fillRect(0, 0, w, h)
  const bh = 32
  const bw = 96
  const palette = ['#7a3b28', '#6b3222', '#83462f', '#5e2c1f', '#8a5038', '#70402f']
  for (let row = 0; row < h / bh; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let x = -bw; x < w + bw; x += bw) {
      ctx.fillStyle = palette[Math.floor(n.rand() * palette.length)]
      ctx.fillRect(x + off + 3, row * bh + 3, bw - 6, bh - 6)
    }
  }
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const p = i / 4
    const v = (n.fbm((p % w) * 0.08, Math.floor(p / w) * 0.08, 3) - 0.5) * 50
    img.data[i] += v
    img.data[i + 1] += v * 0.8
    img.data[i + 2] += v * 0.7
  }
  ctx.putImageData(img, 0, 0)
  return toTexture(c, { repeat })
}

/* ----------------------------------------------------------------- rug -- */

export function makeRugTexture() {
  const s = 1024
  const c = canvas(s, s * 0.68)
  const ctx = c.getContext('2d')
  const W = c.width
  const H = c.height
  const colors = { field: '#6a1a1c', deep: '#3b0f13', gold: '#c9974f', navy: '#1f2a44', cream: '#e9d6b0' }
  ctx.fillStyle = colors.deep
  ctx.fillRect(0, 0, W, H)
  const band = (inset, color, width) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2)
  }
  ctx.fillStyle = colors.field
  ctx.fillRect(70, 70, W - 140, H - 140)
  band(28, colors.gold, 6)
  band(46, colors.navy, 20)
  band(64, colors.gold, 4)
  // Repeating diamonds in the border.
  ctx.fillStyle = colors.cream
  for (let x = 60; x < W - 40; x += 40) {
    diamond(ctx, x, 46, 6)
    diamond(ctx, x, H - 46, 6)
  }
  for (let y = 60; y < H - 40; y += 40) {
    diamond(ctx, 46, y, 6)
    diamond(ctx, W - 46, y, 6)
  }
  // Central medallion.
  const cx = W / 2
  const cy = H / 2
  ctx.fillStyle = colors.navy
  diamond(ctx, cx, cy, 190, 0.62)
  ctx.fillStyle = colors.gold
  diamond(ctx, cx, cy, 150, 0.62)
  ctx.fillStyle = colors.field
  diamond(ctx, cx, cy, 134, 0.62)
  ctx.fillStyle = colors.cream
  diamond(ctx, cx, cy, 60, 0.62)
  ctx.fillStyle = colors.deep
  diamond(ctx, cx, cy, 30, 0.62)
  // Corner motifs and scattered field ornaments.
  ctx.fillStyle = colors.gold
  for (const [x, y] of [
    [120, 120],
    [W - 120, 120],
    [120, H - 120],
    [W - 120, H - 120],
  ])
    diamond(ctx, x, y, 34, 0.7)
  ctx.fillStyle = 'rgba(233,214,176,0.35)'
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2
    diamond(ctx, cx + Math.cos(a) * 300, cy + Math.sin(a) * 180, 8)
  }
  // Woven texture.
  const n = makeNoise(5)
  const img = ctx.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) {
    const p = i / 4
    const x = p % W
    const y = Math.floor(p / W)
    const weave = ((x + y) % 4 < 2 ? 1 : -1) * 4 + (n.value(x * 0.3, y * 0.3) - 0.5) * 22
    img.data[i] += weave
    img.data[i + 1] += weave
    img.data[i + 2] += weave
  }
  ctx.putImageData(img, 0, 0)
  return toTexture(c)
}

function diamond(ctx, x, y, r, squash = 1) {
  ctx.beginPath()
  ctx.moveTo(x, y - r * squash)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r * squash)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}

/* --------------------------------------------------------------- painting -- */

/** An original abstract landscape for the picture frame above the fireplace. */
export function makePaintingTexture() {
  const c = canvas(512, 384)
  const ctx = c.getContext('2d')
  const sky = ctx.createLinearGradient(0, 0, 0, 384)
  sky.addColorStop(0, '#2c2a45')
  sky.addColorStop(0.55, '#c9774a')
  sky.addColorStop(1, '#f0c27a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 512, 384)
  ctx.fillStyle = 'rgba(255,226,170,0.9)'
  ctx.beginPath()
  ctx.arc(330, 230, 34, 0, Math.PI * 2)
  ctx.fill()
  const hill = (color, base, amp, freq, phase) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 384)
    for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, base + Math.sin(x * freq + phase) * amp)
    ctx.lineTo(512, 384)
    ctx.fill()
  }
  hill('#6b3b33', 250, 18, 0.012, 1)
  hill('#4a2a2a', 285, 22, 0.009, 3)
  hill('#2c1b1d', 320, 14, 0.014, 5)
  return toTexture(c)
}

/* ---------------------------------------------------------- book artwork -- */

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const ch = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}
function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
/** Lettering colour: foil accent when it reads well, otherwise dark/light ink. */
export function letteringColor(theme) {
  return contrast(theme.accent, theme.cover) >= 2.4 ? theme.accent : readableInk(theme.cover)
}

const SERIF = '"Cormorant Garamond", "Iowan Old Style", Georgia, serif'

function clothBackground(ctx, w, h, color, seed) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  const n = makeNoise(seed)
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const p = i / 4
    const x = p % w
    const y = Math.floor(p / w)
    const v = (n.value(x * 0.7, y * 0.7) - 0.5) * 16 + (n.fbm(x * 0.01, y * 0.01, 3) - 0.5) * 26
    img.data[i] += v
    img.data[i + 1] += v
    img.data[i + 2] += v
  }
  ctx.putImageData(img, 0, 0)
  // Soft worn vignette.
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.32)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function seedFrom(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h % 997) + 1
}

/** Front cover: title, ornament and author. */
export function makeCoverTexture(book, size) {
  const W = 512
  const H = Math.round((W * size.height) / size.depth)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const { cover, accent } = book.theme
  const ink = letteringColor(book.theme)
  clothBackground(ctx, W, H, cover, seedFrom(book.id))

  // Hinge groove near the spine (left edge).
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(18, 0, 5, H)

  // Foil frame.
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.9
  ctx.lineWidth = 3
  ctx.strokeRect(48, 40, W - 84, H - 80)
  ctx.lineWidth = 1.2
  ctx.strokeRect(58, 50, W - 104, H - 100)
  ctx.globalAlpha = 1
  ctx.fillStyle = accent
  for (const [x, y] of [
    [48, 40],
    [W - 36, 40],
    [48, H - 40],
    [W - 36, H - 40],
  ])
    diamond(ctx, x, y, 9)

  // Title.
  const maxW = W - 150
  let fontSize = 66
  let lines
  do {
    ctx.font = `700 ${fontSize}px ${SERIF}`
    lines = wrapLines(ctx, book.title, maxW)
    fontSize -= 3
  } while ((lines.length > 4 || lines.some((l) => ctx.measureText(l).width > maxW)) && fontSize > 26)
  fontSize += 3
  const lineH = fontSize * 1.08
  const cx = W / 2 + 6
  let y = H * 0.36 - ((lines.length - 1) * lineH) / 2
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 2
  for (const l of lines) {
    ctx.fillText(l, cx, y)
    y += lineH
  }
  ctx.shadowBlur = 0

  // Ornament.
  const oy = y + 18
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - 70, oy)
  ctx.lineTo(cx - 14, oy)
  ctx.moveTo(cx + 14, oy)
  ctx.lineTo(cx + 70, oy)
  ctx.stroke()
  ctx.fillStyle = accent
  diamond(ctx, cx, oy, 8)

  // Author.
  let aSize = 34
  ctx.font = `italic 500 ${aSize}px ${SERIF}`
  while (ctx.measureText(book.author).width > maxW && aSize > 18) {
    aSize -= 2
    ctx.font = `italic 500 ${aSize}px ${SERIF}`
  }
  ctx.fillStyle = ink
  ctx.fillText(book.author, cx, H * 0.8)

  return toTexture(c)
}

/** Spine: title running top to bottom, author surname, foil bands. */
export function makeSpineTexture(book, size) {
  const W = 128
  const H = Math.round((W * size.height) / size.thickness)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const { cover, accent } = book.theme
  const ink = letteringColor(book.theme)
  clothBackground(ctx, W, H, shade(cover, -0.06), seedFrom(book.id) + 3)

  // Rounded-spine shading.
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.35)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.06)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.1)')
  g.addColorStop(0.8, 'rgba(0,0,0,0.05)')
  g.addColorStop(1, 'rgba(0,0,0,0.38)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Foil bands.
  ctx.fillStyle = accent
  const band = (y) => {
    ctx.fillRect(10, y, W - 20, 4)
    ctx.fillRect(10, y + 10, W - 20, 2)
  }
  band(H * 0.06)
  band(H * 0.92)

  // Title, rotated to read top-to-bottom.
  const surname = book.author.split('&')[0].trim().split(/\s+/).pop()
  const titleSpan = H * 0.6
  ctx.save()
  ctx.translate(W / 2, H * 0.12)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = ink
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  let fs = Math.min(W * 0.56, 64)
  ctx.font = `700 ${fs}px ${SERIF}`
  while (ctx.measureText(book.title).width > titleSpan && fs > 16) {
    fs -= 2
    ctx.font = `700 ${fs}px ${SERIF}`
  }
  ctx.fillText(book.title, 0, 0)
  ctx.restore()

  ctx.save()
  ctx.translate(W / 2, H * 0.76)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = accent
  ctx.textBaseline = 'middle'
  let as = Math.min(W * 0.34, 40)
  ctx.font = `italic 600 ${as}px ${SERIF}`
  while (ctx.measureText(surname).width > H * 0.14 && as > 12) {
    as -= 2
    ctx.font = `italic 600 ${as}px ${SERIF}`
  }
  ctx.fillText(surname, 0, 0)
  ctx.restore()

  return toTexture(c)
}

/** Back cover: plain cloth with a small foil emblem. */
export function makeBackTexture(book, size) {
  const W = 256
  const H = Math.round((W * size.height) / size.depth)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  clothBackground(ctx, W, H, book.theme.cover, seedFrom(book.id) + 7)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(W - 12, 0, 3, H)
  ctx.fillStyle = book.theme.accent
  ctx.globalAlpha = 0.8
  diamond(ctx, W / 2, H * 0.86, 7)
  ctx.globalAlpha = 1
  return toTexture(c)
}

/** Inside of the front cover: tinted endpaper with an ex-libris plate. */
export function makeEndpaperTexture(book, size) {
  const W = 512
  const H = Math.round((W * size.height) / size.depth)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const tint = shade(book.theme.accent, 0.55)
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = shade(book.theme.cover, 0.35)
  ctx.globalAlpha = 0.35
  for (let y = 20; y < H; y += 40) for (let x = (y / 40) % 2 ? 20 : 40; x < W; x += 40) diamond(ctx, x, y, 5)
  ctx.globalAlpha = 1
  // Ex-libris plate.
  const pw = 260
  const ph = 170
  const px = (W - pw) / 2
  const py = H * 0.5 - ph / 2
  ctx.fillStyle = '#f6ecd6'
  ctx.fillRect(px, py, pw, ph)
  ctx.strokeStyle = book.theme.cover
  ctx.lineWidth = 3
  ctx.strokeRect(px + 10, py + 10, pw - 20, ph - 20)
  ctx.fillStyle = '#3a2618'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `italic 600 42px ${SERIF}`
  ctx.fillText('Ex Libris', W / 2, py + ph * 0.42)
  ctx.font = `500 20px ${SERIF}`
  ctx.fillText('— the cozy library —', W / 2, py + ph * 0.7)
  return toTexture(c)
}

/** The first page seen when the book opens. */
export function makeTitlePageTexture(book, size) {
  const W = 512
  const H = Math.round((W * size.height) / size.depth)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#f4ead4'
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, 'rgba(90,60,30,0.28)')
  g.addColorStop(0.08, 'rgba(90,60,30,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#2f2016'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let fs = 46
  ctx.font = `700 ${fs}px ${SERIF}`
  let lines = wrapLines(ctx, book.title, W - 140)
  while (lines.length > 3 && fs > 24) {
    fs -= 3
    ctx.font = `700 ${fs}px ${SERIF}`
    lines = wrapLines(ctx, book.title, W - 140)
  }
  let y = H * 0.3
  for (const l of lines) {
    ctx.fillText(l, W / 2 + 10, y)
    y += fs * 1.1
  }
  ctx.fillStyle = book.theme.cover
  diamond(ctx, W / 2 + 10, y + 16, 7)
  ctx.fillStyle = '#4a3423'
  ctx.font = `italic 500 28px ${SERIF}`
  ctx.fillText(book.author, W / 2 + 10, y + 60)
  return toTexture(c)
}

let pageEdgeTex
/** Cream page edges with fine lines (shared by all books). */
export function getPageEdgeTexture() {
  if (pageEdgeTex) return pageEdgeTex
  const c = canvas(64, 256)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#efe2c4'
  ctx.fillRect(0, 0, 64, 256)
  for (let x = 0; x < 64; x += 2) {
    ctx.fillStyle = `rgba(120,90,50,${0.08 + Math.random() * 0.12})`
    ctx.fillRect(x, 0, 1, 256)
  }
  pageEdgeTex = toTexture(c)
  return pageEdgeTex
}
