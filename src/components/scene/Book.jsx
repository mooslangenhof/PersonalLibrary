// A single interactive 3D book.
//
// Local frame of a closed book: height along y, thickness along x, depth along z.
// The spine faces +z (out of the shelf), the front cover is on +x and is hinged
// along the spine so it can swing open.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import * as THREE from 'three'
import { useLibrary } from '../../state/useLibrary'
import { READING, bookSize } from '../../utils/layout'
import { shade } from '../../data/themes'
import {
  getPageEdgeTexture,
  makeBackTexture,
  makeCoverTexture,
  makeEndpaperTexture,
  makeSpineTexture,
  makeTitlePageTexture,
} from '../../utils/textures'

const COVER_T = 0.011
const OPEN_ANGLE = -Math.PI * 0.965
const PULL_OUT = 0.55
const READING_ROT = new THREE.Euler(0.06, -Math.PI / 2, 0)

const v3 = new THREE.Vector3()

export default function Book({ book, slot }) {
  const group = useRef()
  const coverPivot = useRef()
  const glowMats = useRef([])
  const anim = useRef(null)

  const activeId = useLibrary((s) => s.activeId)
  const phase = useLibrary((s) => s.phase)
  const hoveredId = useLibrary((s) => s.hoveredId)
  const isActive = activeId === book.id
  const isHovered = hoveredId === book.id

  const size = useMemo(() => bookSize(book), [book])
  const { height: h, thickness: t, depth: d } = size

  /* --------------------------------------------------------- materials -- */
  const mats = useMemo(() => {
    const plainColor = new THREE.Color(shade(book.theme.cover, -0.1))
    const glow = new THREE.Color(book.theme.accent)
    const cloth = (map) =>
      new THREE.MeshStandardMaterial({
        map: map ?? null,
        color: map ? '#ffffff' : plainColor,
        roughness: 0.78,
        metalness: 0.05,
        emissive: glow,
        emissiveIntensity: 0,
      })
    const paper = (map) => new THREE.MeshStandardMaterial({ map: map ?? null, color: map ? '#ffffff' : '#efe3c8', roughness: 0.92 })
    const edges = new THREE.MeshStandardMaterial({ map: getPageEdgeTexture(), roughness: 0.95 })

    const plain = cloth()
    const front = cloth(makeCoverTexture(book, size))
    const spine = cloth(makeSpineTexture(book, size))
    const back = cloth(makeBackTexture(book, size))
    const endpaper = paper(makeEndpaperTexture(book, size))
    const titlePage = paper(makeTitlePageTexture(book, size))
    const blank = paper()

    return {
      // BoxGeometry material order: +x, -x, +y, -y, +z, -z
      frontCover: [front, endpaper, plain, plain, plain, plain],
      backCover: [plain, back, plain, plain, plain, plain],
      spine: [plain, plain, plain, plain, spine, plain],
      pages: [titlePage, blank, edges, edges, blank, edges],
      glow: [plain, front, spine, back],
      disposable: [plain, front, spine, back, endpaper, titlePage, blank],
    }
    // Rebuild only when what is drawn on the book changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, book.title, book.author, book.theme.cover, book.theme.accent, size.height, size.thickness])

  useEffect(() => {
    glowMats.current = mats.glow
    return () => {
      for (const m of mats.disposable) {
        if (m.map && m.map !== getPageEdgeTexture()) m.map.dispose()
        m.dispose()
      }
    }
  }, [mats])

  /* ------------------------------------------------- animation state -- */
  // Set up once per mount: where the book starts and which stage it is in.
  if (anim.current === null) {
    const justAdded = useLibrary.getState().justAddedId === book.id
    anim.current = {
      stage: justAdded ? 'arriving' : 'shelf',
      cover: 0,
      opened: false,
      initial: justAdded
        ? {
            position: [slot.position[0] + 1.4, slot.position[1] + 0.9, slot.position[2] + 2.6],
            rotation: [0.4, slot.rotation[1] - 1.4, slot.rotation[2] + 0.3],
            scale: 0.4,
          }
        : { position: slot.position, rotation: slot.rotation, scale: 1 },
    }
  }

  // React to the reading flow.
  useEffect(() => {
    const a = anim.current
    if (isActive && phase === 'opening' && (a.stage === 'shelf' || a.stage === 'arriving')) a.stage = 'pull'
    if (isActive && phase === 'closing') a.stage = 'closing'
  }, [isActive, phase])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const a = anim.current
    const dt = Math.min(delta, 0.1)
    const [sx, sy, sz] = slot.position
    const outside = [sx, sy, sz + PULL_OUT]
    let targetPos = slot.position
    let targetRot = slot.rotation
    let coverTarget = 0
    let posTime = 0.22
    let rotTime = 0.25

    switch (a.stage) {
      case 'arriving':
        targetPos = outside
        posTime = 0.45
        rotTime = 0.45
        if (g.position.distanceTo(v3.set(...outside)) < 0.04) a.stage = 'inserting'
        break
      case 'inserting':
        if (g.position.distanceTo(v3.set(...slot.position)) < 0.004) {
          a.stage = 'shelf'
          if (useLibrary.getState().justAddedId === book.id) useLibrary.getState().clearJustAdded()
        }
        break
      case 'pull':
        targetPos = outside
        posTime = 0.12
        if (g.position.distanceTo(v3.set(...outside)) < 0.06) a.stage = 'travel'
        break
      case 'travel':
      case 'reading': {
        const openFrac = a.cover / OPEN_ANGLE
        targetPos = [READING.bookPosition[0] + (d / 2) * openFrac, READING.bookPosition[1], READING.bookPosition[2]]
        targetRot = READING_ROT
        posTime = 0.32
        rotTime = 0.35
        if (a.stage === 'travel' && g.position.distanceTo(v3.set(...targetPos)) < 0.03) a.stage = 'reading'
        if (a.stage === 'reading') {
          coverTarget = OPEN_ANGLE
          // Gentle floating while it is open.
          targetPos = [targetPos[0], targetPos[1] + Math.sin(state.clock.elapsedTime * 1.3) * 0.006, targetPos[2]]
          if (!a.opened && a.cover < OPEN_ANGLE * 0.9) {
            a.opened = true
            useLibrary.getState().markOpen()
          }
        }
        break
      }
      case 'closing': {
        const openFrac = a.cover / OPEN_ANGLE
        targetPos = [READING.bookPosition[0] + (d / 2) * openFrac, READING.bookPosition[1], READING.bookPosition[2]]
        targetRot = READING_ROT
        coverTarget = 0
        if (a.cover > -0.06) a.stage = 'returning'
        break
      }
      case 'returning':
        targetPos = outside
        posTime = 0.3
        rotTime = 0.3
        if (g.position.distanceTo(v3.set(...outside)) < 0.05) a.stage = 'putting-back'
        break
      case 'putting-back':
        posTime = 0.14
        if (g.position.distanceTo(v3.set(...slot.position)) < 0.006) {
          a.stage = 'shelf'
          a.opened = false
          useLibrary.getState().finishClose()
        }
        break
      default: {
        // On the shelf: slide forward a little when hovered.
        if (isHovered) targetPos = [sx, sy, sz + 0.075]
        posTime = 0.15
      }
    }

    easing.damp3(g.position, targetPos, posTime, dt)
    easing.dampE(g.rotation, targetRot, rotTime, dt)
    easing.damp(g.scale, 'x', 1, 0.35, dt)
    g.scale.y = g.scale.z = g.scale.x

    // Hinged front cover.
    const coverSpeed = coverTarget === 0 ? 0.22 : 0.38
    a.cover = THREE.MathUtils.damp(a.cover, coverTarget, 1 / coverSpeed, dt)
    if (coverPivot.current) coverPivot.current.rotation.y = a.cover

    // Hover glow.
    const glowTarget = isHovered && a.stage === 'shelf' ? 0.22 : 0
    for (const m of glowMats.current) m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, glowTarget, 10, dt)
  })

  /* ------------------------------------------------------ interaction -- */
  const interactive = phase === 'idle'
  const onOver = (e) => {
    e.stopPropagation()
    if (!interactive) return
    useLibrary.getState().setHovered(book.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (useLibrary.getState().hoveredId === book.id) useLibrary.getState().setHovered(null)
    document.body.style.cursor = ''
  }
  const onClick = (e) => {
    e.stopPropagation()
    if (!interactive || e.delta > 6) return // ignore clicks that were really camera drags
    document.body.style.cursor = ''
    useLibrary.getState().openBook(book.id)
  }

  const pagesDepth = d - COVER_T - 0.008
  return (
    <group
      ref={group}
      position={anim.current.initial.position}
      rotation={anim.current.initial.rotation}
      scale={anim.current.initial.scale}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={onClick}
    >
      {/* Page block */}
      <mesh position={[0, 0, -COVER_T / 2 - 0.002]} material={mats.pages} castShadow receiveShadow>
        <boxGeometry args={[t - COVER_T * 2, h * 0.968, pagesDepth]} />
      </mesh>
      {/* Back cover */}
      <mesh position={[-t / 2 + COVER_T / 2, 0, -COVER_T / 2]} material={mats.backCover} castShadow receiveShadow>
        <boxGeometry args={[COVER_T, h, d - COVER_T]} />
      </mesh>
      {/* Spine */}
      <mesh position={[0, 0, d / 2 - COVER_T / 2]} material={mats.spine} castShadow receiveShadow>
        <boxGeometry args={[t, h, COVER_T]} />
      </mesh>
      {/* Front cover, hinged along the spine */}
      <group ref={coverPivot} position={[t / 2 - COVER_T, 0, d / 2 - COVER_T]}>
        <mesh position={[COVER_T / 2, 0, -(d - COVER_T) / 2]} material={mats.frontCover} castShadow receiveShadow>
          <boxGeometry args={[COVER_T, h, d - COVER_T]} />
        </mesh>
      </group>
    </group>
  )
}
