// All the measurements for the room, bookcase and book placement live here so
// the scene components and the animation code agree on where things are.

export const ROOM = {
  width: 11, // x from -5.5 to 5.5
  front: 6.5, // z of the wall behind the camera
  back: -3.05, // z of the wall behind the bookcase
  height: 4.4,
}

export const BOOKCASE = {
  halfWidth: 1.62,
  sideThickness: 0.07,
  dividerThickness: 0.05,
  backZ: -2.98,
  frontZ: -2.34,
  plinthTop: 0.3,
  levels: [0.3, 1.12, 1.94, 2.76], // top surfaces of the shelves books stand on
  topY: 3.58,
  boardThickness: 0.045,
}

// Where a book floats while it is being read, and where the camera sits.
export const READING = {
  bookPosition: [0, 1.72, -1.3],
  cameraPosition: [0, 1.75, 0.08],
}

export const DEFAULT_CAMERA = {
  position: [0.3, 1.85, 2.55],
  target: [0, 1.6, -1.9],
}

export const BOOK_DEPTH = 0.44
const GAP = 0.012
const SIDE_INNER = BOOKCASE.halfWidth - BOOKCASE.sideThickness
const DIV = BOOKCASE.dividerThickness / 2 + 0.02

// Shelf segments in the order they fill up. Eye-level shelf first, starting at
// the centre divider and working outward, so a small collection looks
// balanced. `reserve` is room kept free at the outer end for decorations.
export const SEGMENTS = [
  { level: 1, side: 1, reserve: 0.34 },
  { level: 1, side: -1, reserve: 0.32 },
  { level: 2, side: 1, reserve: 0.4 },
  { level: 2, side: -1, reserve: 0.26 },
  { level: 0, side: 1, reserve: 0.52 },
  { level: 0, side: -1, reserve: 0.18 },
  { level: 3, side: 1, reserve: 0.3 },
  { level: 3, side: -1, reserve: 0.34 },
].map((s) => ({
  ...s,
  start: s.side * DIV,
  end: s.side * (SIDE_INNER - s.reserve),
}))

/** Stable pseudo-random number in [0,1) from a string. */
export function hashRandom(str, salt = 0) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  return ((h >>> 0) % 100000) / 100000
}

/** Physical size of a book. Stored size wins; otherwise derived from its id. */
export function bookSize(book) {
  const height = book.size?.height ?? 0.6 + hashRandom(book.id, 1) * 0.13
  const thickness = book.size?.thickness ?? 0.1 + hashRandom(book.id, 2) * 0.07
  return { height, thickness, depth: BOOK_DEPTH - (0.74 - height) * 0.15 }
}

/**
 * Work out where every book sits. Returns a Map of id -> { position, rotation }.
 * When the shelves are full, extra books are stacked flat on top of the bookcase.
 */
export function computeSlots(books) {
  const slots = new Map()
  let seg = 0
  let cursor = SEGMENTS[0].start
  let overflow = 0
  const stackHeights = [0, 0, 0, 0]

  for (const book of books) {
    const { height, thickness, depth } = bookSize(book)
    let placed = false

    while (seg < SEGMENTS.length) {
      const s = SEGMENTS[seg]
      const next = cursor + s.side * thickness
      const fits = s.side > 0 ? next <= s.end : next >= s.end
      if (fits) {
        const x = cursor + (s.side * thickness) / 2
        const y = BOOKCASE.levels[s.level] + height / 2
        const z = BOOKCASE.frontZ - 0.035 - depth / 2
        const jitter = (hashRandom(book.id, 3) - 0.5) * 0.04
        slots.set(book.id, { position: [x, y, z], rotation: [0, jitter, 0], lying: false })
        cursor = next + s.side * GAP
        placed = true
        break
      }
      seg += 1
      if (seg < SEGMENTS.length) cursor = SEGMENTS[seg].start
    }

    if (!placed) {
      // Lying flat in stacks on top of the bookcase.
      const stacks = [-1.15, -0.4, 0.4, 1.15]
      const stack = overflow % stacks.length
      const y = BOOKCASE.topY + 0.012 + stackHeights[stack] + thickness / 2
      stackHeights[stack] += thickness + 0.004
      slots.set(book.id, {
        position: [stacks[stack] + (hashRandom(book.id, 4) - 0.5) * 0.06, y, BOOKCASE.frontZ - 0.05 - depth / 2],
        rotation: [0, (hashRandom(book.id, 5) - 0.5) * 0.12, Math.PI / 2],
        lying: true,
      })
      overflow += 1
    }
  }
  return slots
}
