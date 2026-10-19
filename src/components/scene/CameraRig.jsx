// Camera behaviour: an intro glide on load, gentle user orbiting, and a smooth
// move to the reading spot while a book is open.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { useLibrary } from '../../state/useLibrary'
import { DEFAULT_CAMERA, READING } from '../../utils/layout'

const tmp = new THREE.Vector3()

export default function CameraRig() {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const phase = useLibrary((s) => s.phase)

  // 'intro' -> 'free' <-> 'focus' -> 'returning' -> 'free'
  const mode = useRef('intro')
  const saved = useRef({
    position: new THREE.Vector3(...DEFAULT_CAMERA.position),
    target: new THREE.Vector3(...DEFAULT_CAMERA.target),
  })

  useEffect(() => {
    if (phase === 'opening') {
      if (mode.current === 'free' && controls.current) {
        saved.current.position.copy(camera.position)
        saved.current.target.copy(controls.current.target)
      }
      mode.current = 'focus'
    } else if (phase === 'closing' || (phase === 'idle' && mode.current === 'focus')) {
      mode.current = 'returning'
    }
  }, [phase, camera])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c) return
    const dt = Math.min(delta, 0.1)
    const m = mode.current

    if (m === 'intro') {
      easing.damp3(camera.position, DEFAULT_CAMERA.position, 1.1, dt)
      easing.damp3(c.target, DEFAULT_CAMERA.target, 1.1, dt)
      if (camera.position.distanceTo(tmp.set(...DEFAULT_CAMERA.position)) < 0.03) mode.current = 'free'
    } else if (m === 'focus') {
      easing.damp3(camera.position, READING.cameraPosition, 0.5, dt)
      easing.damp3(c.target, READING.bookPosition, 0.45, dt)
    } else if (m === 'returning') {
      easing.damp3(camera.position, saved.current.position, 0.55, dt)
      easing.damp3(c.target, saved.current.target, 0.55, dt)
      if (camera.position.distanceTo(saved.current.position) < 0.02 && useLibrary.getState().phase === 'idle') {
        mode.current = 'free'
      }
    }
    c.enabled = mode.current === 'free'
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={DEFAULT_CAMERA.target}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.45}
      zoomSpeed={0.6}
      minDistance={2.2}
      maxDistance={6}
      minPolarAngle={1.12}
      maxPolarAngle={1.68}
      minAzimuthAngle={-0.85}
      maxAzimuthAngle={0.85}
    />
  )
}
