// Brick fireplace on the left wall with a flickering fire, mantel and candles.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { ROOM } from '../../utils/layout'
import { getMaterials } from './materials'
import { Candle, Flame } from './Flame'

const WALL_X = -ROOM.width / 2
const CENTER_Z = 0.85
const BREAST_DEPTH = 0.55 // how far the chimney breast sticks out from the wall
const OPEN_W = 1.1
const OPEN_H = 0.92
const BREAST_W = 2.3

export default function Fireplace() {
  const m = getMaterials()
  const front = WALL_X + BREAST_DEPTH
  const pierW = (BREAST_W - OPEN_W) / 2
  const fireX = WALL_X + 0.28

  return (
    <group>
      {/* Hearth slab */}
      <mesh position={[WALL_X + 0.42, 0.035, CENTER_Z]} material={m.stone} receiveShadow castShadow>
        <boxGeometry args={[0.84, 0.07, BREAST_W + 0.3]} />
      </mesh>

      {/* Piers either side of the opening */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[WALL_X + BREAST_DEPTH / 2, (OPEN_H + 0.12) / 2, CENTER_Z + s * (OPEN_W / 2 + pierW / 2)]}
          material={m.brick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[BREAST_DEPTH, OPEN_H + 0.12, pierW]} />
        </mesh>
      ))}
      {/* Lintel */}
      <mesh position={[WALL_X + BREAST_DEPTH / 2, OPEN_H + 0.06 + 0.06, CENTER_Z]} material={m.brick} castShadow receiveShadow>
        <boxGeometry args={[BREAST_DEPTH, 0.12, OPEN_W]} />
      </mesh>

      {/* Firebox interior */}
      <mesh position={[WALL_X + 0.02, OPEN_H / 2, CENTER_Z]} material={m.soot}>
        <boxGeometry args={[0.04, OPEN_H, OPEN_W]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[WALL_X + BREAST_DEPTH / 2, OPEN_H / 2, CENTER_Z + s * (OPEN_W / 2 - 0.01)]} material={m.soot}>
          <boxGeometry args={[BREAST_DEPTH - 0.02, OPEN_H, 0.02]} />
        </mesh>
      ))}
      <mesh position={[WALL_X + BREAST_DEPTH / 2, OPEN_H - 0.01, CENTER_Z]} material={m.soot}>
        <boxGeometry args={[BREAST_DEPTH - 0.02, 0.02, OPEN_W]} />
      </mesh>

      {/* Mantel shelf */}
      <mesh position={[WALL_X + BREAST_DEPTH / 2 + 0.07, 1.2, CENTER_Z]} material={m.shelf} castShadow receiveShadow>
        <boxGeometry args={[BREAST_DEPTH + 0.14, 0.09, BREAST_W + 0.25]} />
      </mesh>
      <mesh position={[WALL_X + BREAST_DEPTH / 2 + 0.05, 1.13, CENTER_Z]} material={m.shelfBack} castShadow>
        <boxGeometry args={[BREAST_DEPTH + 0.08, 0.05, BREAST_W + 0.12]} />
      </mesh>

      {/* Chimney breast above the mantel */}
      <mesh
        position={[WALL_X + (BREAST_DEPTH - 0.08) / 2, (1.245 + ROOM.height) / 2, CENTER_Z]}
        material={m.brick}
        receiveShadow
      >
        <boxGeometry args={[BREAST_DEPTH - 0.08, ROOM.height - 1.245, BREAST_W - 0.1]} />
      </mesh>

      {/* Painting above the mantel */}
      <group position={[front - 0.07, 2.25, CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={m.shelf} castShadow>
          <boxGeometry args={[1.08, 0.84, 0.05]} />
        </mesh>
        <mesh position={[0, 0, 0.026]} material={m.brass}>
          <planeGeometry args={[0.98, 0.74]} />
        </mesh>
        <mesh position={[0, 0, 0.028]} material={m.painting}>
          <planeGeometry args={[0.92, 0.68]} />
        </mesh>
      </group>

      {/* Candles and a little clock on the mantel */}
      <Candle position={[front + 0.02, 1.245, CENTER_Z - 0.9]} height={0.24} radius={0.035} light lightIntensity={0.7} seed={11} />
      <Candle position={[front + 0.04, 1.245, CENTER_Z - 0.76]} height={0.15} radius={0.03} seed={12} />
      <Candle position={[front + 0.02, 1.245, CENTER_Z + 0.88]} height={0.19} radius={0.035} seed={13} />
      <group position={[front + 0.02, 1.245, CENTER_Z + 0.45]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.12, 0]} material={m.shelfBack} castShadow>
          <boxGeometry args={[0.2, 0.24, 0.1]} />
        </mesh>
        <mesh position={[0, 0.14, 0.051]}>
          <circleGeometry args={[0.065, 32]} />
          <meshStandardMaterial color="#efe3c7" roughness={0.5} />
        </mesh>
      </group>

      {/* Logs, embers and fire */}
      <group position={[fireX, 0.07, CENTER_Z]}>
        <mesh position={[0, 0.06, -0.12]} rotation={[0.15, 0, Math.PI / 2 - 0.1]} material={m.log} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.7, 10]} />
        </mesh>
        <mesh position={[0.06, 0.06, 0.14]} rotation={[-0.25, 0, Math.PI / 2 + 0.15]} material={m.log} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 0.65, 10]} />
        </mesh>
        <mesh position={[0.02, 0.16, 0]} rotation={[Math.PI / 2, 0.2, 0]} material={m.log}>
          <cylinderGeometry args={[0.06, 0.07, 0.62, 10]} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={i}
            position={[((i * 7) % 5) * 0.05 - 0.1, 0.015, ((i * 13) % 9) * 0.07 - 0.3]}
            rotation={[0, i, 0]}
            material={m.ember}
          >
            <boxGeometry args={[0.06, 0.03, 0.05]} />
          </mesh>
        ))}
        <Flame position={[0.02, 0.06, -0.18]} width={0.34} height={0.58} seed={0.1} />
        <Flame position={[0.0, 0.06, 0.05]} width={0.42} height={0.72} seed={0.45} />
        <Flame position={[0.04, 0.06, 0.24]} width={0.3} height={0.5} seed={0.8} />
        <Flame position={[0.05, 0.08, -0.02]} width={0.22} height={0.38} seed={0.3} intensity={3} />
        <Sparkles count={24} scale={[0.4, 0.9, 0.8]} position={[0.05, 0.6, 0]} size={2.2} speed={0.9} color="#ff9a4a" />
      </group>

      <FireLight position={[front + 0.25, 0.55, CENTER_Z]} />
    </group>
  )
}

function FireLight(props) {
  const light = useRef()
  useFrame((state) => {
    if (!light.current) return
    const t = state.clock.elapsedTime
    const flicker = Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1 + 1.3) * 0.06 + Math.sin(t * 2.1) * 0.07 + (Math.random() - 0.5) * 0.08
    light.current.intensity = 9 * (1 + flicker)
    light.current.position.y = 0.55 + Math.sin(t * 5.3) * 0.02
  })
  return (
    <pointLight
      ref={light}
      {...props}
      color="#ff8a3d"
      intensity={9}
      distance={14}
      decay={1.6}
      castShadow
      shadow-mapSize={[512, 512]}
      shadow-bias={-0.002}
      shadow-camera-near={0.1}
      shadow-camera-far={14}
    />
  )
}
