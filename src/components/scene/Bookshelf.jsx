// The central wooden bookcase, its decorations, and the books on it.
import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useLibrary } from '../../state/useLibrary'
import { BOOKCASE as B, computeSlots } from '../../utils/layout'
import { getMaterials } from './materials'
import { Candle } from './Flame'
import Book from './Book'

export default function Bookshelf() {
  const books = useLibrary((s) => s.books)
  const slots = useMemo(() => computeSlots(books), [books])

  return (
    <group>
      <Bookcase />
      <ShelfDecor />
      {books.map((book) => (
        <Book key={book.id} book={book} slot={slots.get(book.id)} />
      ))}
    </group>
  )
}

function Bookcase() {
  const m = getMaterials()
  const depth = B.frontZ - B.backZ
  const zMid = (B.frontZ + B.backZ) / 2
  const height = B.topY + 0.05
  const innerW = (B.halfWidth - B.sideThickness) * 2
  const bt = B.boardThickness

  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, height / 2, B.backZ + 0.012]} material={m.shelfBack} receiveShadow>
        <boxGeometry args={[B.halfWidth * 2, height, 0.024]} />
      </mesh>

      {/* Side panels */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (B.halfWidth - B.sideThickness / 2), height / 2, zMid]}
          material={m.shelf}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[B.sideThickness, height, depth]} />
        </mesh>
      ))}

      {/* Centre divider */}
      <mesh position={[0, (B.plinthTop + B.topY) / 2, zMid]} material={m.shelf} castShadow receiveShadow>
        <boxGeometry args={[B.dividerThickness, B.topY - B.plinthTop, depth - 0.02]} />
      </mesh>

      {/* Plinth */}
      <mesh position={[0, B.plinthTop / 2, zMid + 0.02]} material={m.shelf} castShadow receiveShadow>
        <boxGeometry args={[innerW, B.plinthTop, depth - 0.04]} />
      </mesh>
      <mesh position={[0, 0.05, B.frontZ + 0.012]} material={m.shelfBack}>
        <boxGeometry args={[B.halfWidth * 2 + 0.04, 0.1, 0.03]} />
      </mesh>

      {/* Shelves, each with a slightly proud front lip */}
      {B.levels.slice(1).map((y) => (
        <group key={y}>
          <mesh position={[0, y - bt / 2, zMid]} material={m.shelf} castShadow receiveShadow>
            <boxGeometry args={[innerW, bt, depth - 0.02]} />
          </mesh>
          <mesh position={[0, y - bt / 2, B.frontZ + 0.005]} material={m.shelf} castShadow>
            <boxGeometry args={[innerW, bt + 0.018, 0.022]} />
          </mesh>
        </group>
      ))}

      {/* Top and crown moulding */}
      <mesh position={[0, B.topY + 0.025, zMid]} material={m.shelf} castShadow receiveShadow>
        <boxGeometry args={[B.halfWidth * 2, 0.05, depth]} />
      </mesh>
      <mesh position={[0, B.topY + 0.075, zMid + 0.03]} material={m.shelf} castShadow>
        <boxGeometry args={[B.halfWidth * 2 + 0.12, 0.05, depth + 0.1]} />
      </mesh>
      <mesh position={[0, B.topY + 0.11, zMid + 0.05]} material={m.shelfBack}>
        <boxGeometry args={[B.halfWidth * 2 + 0.2, 0.025, depth + 0.16]} />
      </mesh>

      {/* Fluted front trims on the sides */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (B.halfWidth - 0.03), height / 2, B.frontZ + 0.01]} material={m.shelfBack}>
          <boxGeometry args={[0.07, height, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

function ShelfDecor() {
  const m = getMaterials()
  const L = B.levels
  const z = B.frontZ - 0.26
  const right = B.halfWidth - B.sideThickness
  return (
    <group>
      {/* Eye-level shelf, right end: a pair of candles */}
      <Candle position={[right - 0.12, L[1], z + 0.05]} height={0.17} radius={0.028} light lightIntensity={0.55} seed={1} />
      <Candle position={[right - 0.25, L[1], z + 0.1]} height={0.11} radius={0.024} seed={2} />

      {/* Eye-level shelf, left end: potted plant */}
      <group position={[-right + 0.16, L[1], z]}>
        <mesh position={[0, 0.07, 0]} material={m.terracotta} castShadow>
          <cylinderGeometry args={[0.08, 0.06, 0.14, 20]} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2
          const tilt = 0.55 + (i % 3) * 0.18
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.05, 0.2 + (i % 2) * 0.04, Math.sin(a) * 0.05]}
              rotation={[Math.sin(a) * tilt, 0, -Math.cos(a) * tilt]}
              scale={[0.035, 0.13, 0.012]}
              material={m.leaf}
              castShadow
            >
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          )
        })}
      </group>

      {/* Upper shelf, right: a globe */}
      <group position={[right - 0.2, L[2], z]}>
        <mesh position={[0, 0.015, 0]} material={m.darkMetal} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.03, 20]} />
        </mesh>
        <mesh position={[0, 0.09, 0]} material={m.brass}>
          <cylinderGeometry args={[0.008, 0.008, 0.13, 8]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, 0.4]} castShadow>
          <sphereGeometry args={[0.12, 32, 24]} />
          <meshStandardMaterial color="#c9a46a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0.4, 0]} material={m.brass}>
          <torusGeometry args={[0.135, 0.006, 8, 48]} />
        </mesh>
      </group>

      {/* Upper shelf, left: hourglass */}
      <group position={[-right + 0.13, L[2], z]}>
        {[0.005, 0.255].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={m.shelfBack} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
          </mesh>
        ))}
        <mesh position={[0, 0.07, 0]} material={m.glass}>
          <coneGeometry args={[0.055, 0.11, 20, 1, true]} />
        </mesh>
        <mesh position={[0, 0.19, 0]} rotation={[Math.PI, 0, 0]} material={m.glass}>
          <coneGeometry args={[0.055, 0.11, 20, 1, true]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} material={m.sand}>
          <coneGeometry args={[0.045, 0.05, 16]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.06, 0.13, Math.sin(a) * 0.06]} material={m.shelfBack}>
              <cylinderGeometry args={[0.006, 0.006, 0.25, 6]} />
            </mesh>
          )
        })}
      </group>

      {/* Bottom shelf, right: a stack of old books lying flat */}
      <group position={[right - 0.28, L[0], z + 0.02]}>
        {[
          ['#5b3a29', 0.06, 0.06],
          ['#2e3b4f', 0.05, -0.04],
          ['#6b2a26', 0.045, 0.08],
        ].reduce(
          (acc, [color, t, rot], i) => {
            acc.items.push(
              <RoundedBox
                key={i}
                args={[0.42 - i * 0.04, t, 0.3 - i * 0.02]}
                radius={0.008}
                position={[0, acc.y + t / 2, 0]}
                rotation={[0, rot, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial color={color} roughness={0.8} />
              </RoundedBox>,
            )
            acc.y += t
            return acc
          },
          { y: 0, items: [] },
        ).items}
      </group>

      {/* Top shelf, right: ceramic vase */}
      <mesh position={[right - 0.15, L[3] + 0.13, z]} material={m.ceramic} castShadow>
        <latheGeometry
          args={[
            [
              [0.001, 0],
              [0.06, 0.01],
              [0.085, 0.08],
              [0.07, 0.17],
              [0.035, 0.22],
              [0.045, 0.26],
            ].map(([x, y]) => ({ x, y: y - 0.13 })),
            28,
          ]}
        />
      </mesh>

      {/* Top shelf, left: small framed picture leaning back */}
      <group position={[-right + 0.17, L[3], z - 0.05]} rotation={[-0.12, 0.15, 0]}>
        <mesh position={[0, 0.14, 0]} material={m.brass} castShadow>
          <boxGeometry args={[0.22, 0.28, 0.02]} />
        </mesh>
        <mesh position={[0, 0.14, 0.011]} material={m.painting}>
          <planeGeometry args={[0.17, 0.23]} />
        </mesh>
      </group>
    </group>
  )
}
