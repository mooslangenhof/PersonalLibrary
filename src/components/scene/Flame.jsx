// Animated flame (shader on a camera-facing plane) and a candle built around it.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { getMaterials } from './materials'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 1.7 + uSeed * 13.0;
    float n = fbm(vec2(uv.x * 3.0 + uSeed * 7.0, uv.y * 2.4 - t));
    float x = (uv.x - 0.5) * 2.0;
    x += (n - 0.5) * 1.1 * uv.y;
    float width = mix(0.9, 0.02, pow(uv.y, 0.85));
    float shape = 1.0 - smoothstep(width * 0.45, width, abs(x));
    float top = 1.0 - smoothstep(0.45, 1.0, uv.y + (n - 0.5) * 0.55);
    float body = shape * smoothstep(0.0, 0.1, uv.y) * top;
    float core = (1.0 - smoothstep(0.0, 0.38, abs(x))) * (1.0 - smoothstep(0.05, 0.55, uv.y));
    vec3 col = mix(vec3(1.0, 0.25, 0.04), vec3(1.0, 0.68, 0.24), body);
    col = mix(col, vec3(1.0, 0.94, 0.72), core * 0.85);
    float a = clamp(body * (0.8 + 0.2 * n), 0.0, 1.0);
    gl_FragColor = vec4(col * a * uIntensity, a);
  }
`

export function Flame({ width = 0.3, height = 0.6, seed = 0, intensity = 2.4, ...props }) {
  const mat = useRef()
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSeed: { value: seed }, uIntensity: { value: intensity } }),
    [seed, intensity],
  )
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <Billboard {...props} lockX lockZ>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  )
}

/** A small candle. Set `light` to give it its own flickering glow. */
export function Candle({ height = 0.14, radius = 0.025, light = false, lightIntensity = 0.6, seed = 0, ...props }) {
  const m = getMaterials()
  const lightRef = useRef()
  useFrame((state) => {
    if (!lightRef.current) return
    const t = state.clock.elapsedTime + seed * 10
    lightRef.current.intensity = lightIntensity * (0.85 + Math.sin(t * 9.1) * 0.06 + Math.sin(t * 3.7) * 0.06 + Math.random() * 0.05)
  })
  return (
    <group {...props}>
      <mesh position={[0, height / 2, 0]} material={m.wax} castShadow>
        <cylinderGeometry args={[radius, radius * 1.05, height, 20]} />
      </mesh>
      <mesh position={[0, 0.006, 0]} material={m.brass} receiveShadow>
        <cylinderGeometry args={[radius * 1.9, radius * 2.2, 0.012, 24]} />
      </mesh>
      <mesh position={[0, height + 0.006, 0]}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.014, 4]} />
        <meshBasicMaterial color="#1a120c" />
      </mesh>
      <Flame position={[0, height + 0.004, 0]} width={radius * 1.5} height={radius * 2.6} seed={seed} intensity={2.8} />
      {light && (
        <pointLight ref={lightRef} position={[0, height + 0.06, 0]} color="#ffa552" intensity={lightIntensity} distance={2.6} decay={2} />
      )}
    </group>
  )
}
