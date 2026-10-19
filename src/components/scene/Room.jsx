// The room: floor, panelled walls, ceiling beams, rug, window, furniture.
import { useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ROOM } from '../../utils/layout'
import { getMaterials } from './materials'
import { Candle } from './Flame'

const W = ROOM.width / 2
const DEPTH = ROOM.front - ROOM.back
const ZMID = (ROOM.front + ROOM.back) / 2
const WAINSCOT = 1.15

export default function Room() {
  const m = getMaterials()
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ZMID]} material={m.floor} receiveShadow>
        <planeGeometry args={[ROOM.width, DEPTH]} />
      </mesh>

      {/* Ceiling with beams */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, ZMID]} material={m.ceiling}>
        <planeGeometry args={[ROOM.width, DEPTH]} />
      </mesh>
      {[-1.5, 0.5, 2.5, 4.5].map((z) => (
        <mesh key={z} position={[0, ROOM.height - 0.12, z]} material={m.beam} castShadow>
          <boxGeometry args={[ROOM.width, 0.24, 0.22]} />
        </mesh>
      ))}

      {/* Walls: back, left, right, front */}
      <Wall position={[0, 0, ROOM.back]} rotation={[0, 0, 0]} length={ROOM.width} />
      <Wall position={[-W, 0, ZMID]} rotation={[0, Math.PI / 2, 0]} length={DEPTH} />
      <Wall position={[W, 0, ZMID]} rotation={[0, -Math.PI / 2, 0]} length={DEPTH} window />
      <Wall position={[0, 0, ROOM.front]} rotation={[0, Math.PI, 0]} length={ROOM.width} />

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 1.1]} material={m.rug} receiveShadow>
        <planeGeometry args={[3.8, 2.6]} />
      </mesh>

      <Armchair position={[-3.35, 0, 3.05]} rotation={[0, -2.3, 0]} />
      <SideTable position={[-4.45, 0, 3.55]} />
      <FloorLamp position={[2.35, 0, -2.15]} />
      <ReadingLantern position={[0, ROOM.height, 2.3]} />
    </group>
  )
}

/** A wall with wood wainscoting below and wallpaper above. */
function Wall({ position, rotation, length, window: hasWindow = false }) {
  const m = getMaterials()
  const upper = ROOM.height - WAINSCOT
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, WAINSCOT / 2, 0]} material={m.panel} receiveShadow>
        <planeGeometry args={[length, WAINSCOT]} />
      </mesh>
      <mesh position={[0, WAINSCOT + upper / 2, 0]} material={m.wallpaper} receiveShadow>
        <planeGeometry args={[length, upper]} />
      </mesh>
      {/* Chair rail and skirting */}
      <mesh position={[0, WAINSCOT, 0.02]} material={m.shelf} castShadow>
        <boxGeometry args={[length, 0.06, 0.04]} />
      </mesh>
      <mesh position={[0, 0.08, 0.015]} material={m.shelfBack}>
        <boxGeometry args={[length, 0.16, 0.03]} />
      </mesh>
      {hasWindow && <NightWindow position={[-1.6, 2.15, 0.01]} />}
    </group>
  )
}

function NightWindow({ position }) {
  const m = getMaterials()
  const w = 1.3
  const h = 1.7
  return (
    <group position={position}>
      <mesh material={m.nightSky}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0.28, 0.42, 0.005]} material={m.moon}>
        <circleGeometry args={[0.1, 32]} />
      </mesh>
      {/* Stars */}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[((i * 37) % 120) / 100 - 0.6, ((i * 53) % 150) / 100 - 0.75, 0.004]}>
          <circleGeometry args={[0.006 + (i % 3) * 0.002, 6]} />
          <meshBasicMaterial color="#e9e2ff" toneMapped={false} />
        </mesh>
      ))}
      {/* Frame and mullions */}
      {[
        [0, h / 2, w + 0.12, 0.08],
        [0, -h / 2, w + 0.16, 0.1],
        [0, 0, w, 0.04],
      ].map(([x, y, len, th], i) => (
        <mesh key={i} position={[x, y, 0.03]} material={m.shelf} castShadow>
          <boxGeometry args={[len, th, 0.06]} />
        </mesh>
      ))}
      {[-w / 2, 0, w / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0.03]} material={m.shelf} castShadow>
          <boxGeometry args={[x === 0 ? 0.04 : 0.08, h, 0.06]} />
        </mesh>
      ))}
      {/* Curtains */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 0.2), -0.1, 0.12]} material={m.fabricGreen} castShadow>
          <cylinderGeometry args={[0.16, 0.24, h + 0.6, 12, 1, false]} />
        </mesh>
      ))}
      <mesh position={[0, h / 2 + 0.28, 0.14]} rotation={[0, 0, Math.PI / 2]} material={m.brass}>
        <cylinderGeometry args={[0.015, 0.015, w + 1.0, 8]} />
      </mesh>
    </group>
  )
}

function Armchair(props) {
  const m = getMaterials()
  return (
    <group {...props}>
      <RoundedBox args={[0.95, 0.22, 0.85]} radius={0.06} position={[0, 0.38, 0]} material={m.leather} castShadow receiveShadow />
      <RoundedBox args={[0.95, 0.85, 0.2]} radius={0.08} position={[0, 0.8, -0.36]} rotation={[-0.12, 0, 0]} material={m.leather} castShadow />
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.17, 0.42, 0.85]}
          radius={0.07}
          position={[s * 0.5, 0.58, 0]}
          material={m.leatherDark}
          castShadow
        />
      ))}
      <RoundedBox args={[0.78, 0.1, 0.62]} radius={0.04} position={[0, 0.53, 0.06]} material={m.leather} castShadow />
      {[
        [-0.4, -0.34],
        [0.4, -0.34],
        [-0.4, 0.34],
        [0.4, 0.34],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]} material={m.shelfBack} castShadow>
          <cylinderGeometry args={[0.03, 0.022, 0.26, 10]} />
        </mesh>
      ))}
      {/* Folded throw */}
      <RoundedBox args={[0.5, 0.05, 0.5]} radius={0.02} position={[0.22, 0.6, 0.12]} rotation={[0, 0.3, 0.05]} castShadow>
        <meshStandardMaterial color="#b9925a" roughness={1} />
      </RoundedBox>
    </group>
  )
}

function SideTable(props) {
  const m = getMaterials()
  return (
    <group {...props}>
      <mesh position={[0, 0.58, 0]} material={m.shelf} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 32]} />
      </mesh>
      <mesh position={[0, 0.29, 0]} material={m.shelf} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.56, 12]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={m.shelf} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 24]} />
      </mesh>
      <Candle position={[0.1, 0.6, 0.05]} height={0.2} radius={0.034} light lightIntensity={0.8} seed={5} />
      {/* Mug */}
      <mesh position={[-0.12, 0.65, -0.05]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.1, 20]} />
        <meshStandardMaterial color="#e7dcc8" roughness={0.4} />
      </mesh>
      <mesh position={[-0.17, 0.65, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.025, 0.007, 8, 16]} />
        <meshStandardMaterial color="#e7dcc8" roughness={0.4} />
      </mesh>
    </group>
  )
}

function FloorLamp({ position }) {
  const m = getMaterials()
  const [x, , z] = position
  // Aim the spotlight at the middle of the bookcase.
  const [target] = useState(() => new THREE.Object3D())
  return (
    <group position={position}>
      <primitive object={target} position={[-0.2 - x, 1.3, -2.6 - z]} />
      <mesh position={[0, 0.02, 0]} material={m.brass} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 28]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={m.brass} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.9, 10]} />
      </mesh>
      <mesh position={[0, 2.0, 0]} material={m.lampShade} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 0.32, 32, 1, true]} />
      </mesh>
      <pointLight position={[0, 1.98, 0]} color="#ffb165" intensity={2.2} distance={6} decay={2} />
      <spotLight
        position={[0, 1.9, 0]}
        target={target}
        color="#ffbf78"
        intensity={38}
        angle={0.85}
        penumbra={0.9}
        distance={9}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </group>
  )
}

/** A brass lantern hanging over the rug, the main warm fill light. */
function ReadingLantern({ position }) {
  const m = getMaterials()
  const drop = 1.05
  return (
    <group position={position}>
      <mesh position={[0, -drop / 2, 0]} material={m.darkMetal}>
        <cylinderGeometry args={[0.006, 0.006, drop, 6]} />
      </mesh>
      <group position={[0, -drop - 0.15, 0]}>
        <mesh material={m.darkMetal} position={[0, 0.17, 0]}>
          <coneGeometry args={[0.16, 0.12, 6]} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.12, 0.1, 0.24, 6, 1, true]} />
          <meshStandardMaterial
            color="#ffd29a"
            emissive="#ffab55"
            emissiveIntensity={1.6}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh material={m.darkMetal} position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.1, 0.07, 0.03, 6]} />
        </mesh>
        <pointLight color="#ffb062" intensity={9} distance={10} decay={2} />
      </group>
    </group>
  )
}
