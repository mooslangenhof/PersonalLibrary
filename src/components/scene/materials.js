// Shared materials, created once and reused across the scene.
import * as THREE from 'three'
import {
  makeBrickTexture,
  makePaintingTexture,
  makeRugTexture,
  makeWallpaperTexture,
  makeWoodTexture,
} from '../../utils/textures'

let cache = null

export function getMaterials() {
  if (cache) return cache

  const floor = makeWoodTexture({ planks: 6, light: '#74462a', dark: '#3a2112', seed: 4, repeat: [2.4, 2.4] })
  const shelf = makeWoodTexture({
    size: 512,
    planks: 1,
    light: '#7a4a2c',
    dark: '#4a2918',
    seed: 9,
    joints: false,
    grainScale: 0.45,
    repeat: [1, 1],
  })
  const darkShelf = makeWoodTexture({
    size: 512,
    planks: 4,
    light: '#4a2a17',
    dark: '#1d0f07',
    seed: 13,
    joints: false,
    repeat: [2, 2],
  })
  const panel = makeWoodTexture({
    size: 512,
    planks: 5,
    light: '#5c361f',
    dark: '#33200f',
    seed: 21,
    joints: false,
    repeat: [6, 1],
  })
  const beam = makeWoodTexture({ size: 512, planks: 1, light: '#3f2414', dark: '#170c06', seed: 31, joints: false, repeat: [1, 4] })

  const wood = (tex, extra = {}) =>
    new THREE.MeshStandardMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 0.6, roughness: 0.62, metalness: 0, ...extra })

  cache = {
    floor: wood(floor, { roughness: 0.48 }),
    shelf: wood(shelf, { roughness: 0.55 }),
    shelfBack: wood(darkShelf, { roughness: 0.75 }),
    panel: wood(panel, { roughness: 0.6 }),
    beam: wood(beam, { roughness: 0.8 }),
    wallpaper: new THREE.MeshStandardMaterial({ map: makeWallpaperTexture(), roughness: 0.9 }),
    brick: new THREE.MeshStandardMaterial({ map: makeBrickTexture({ repeat: [1.2, 2.5] }), roughness: 0.95 }),
    soot: new THREE.MeshStandardMaterial({ color: '#120a07', roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ color: '#4a4039', roughness: 0.85 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#1c120c', roughness: 1 }),
    rug: new THREE.MeshStandardMaterial({ map: makeRugTexture(), roughness: 1 }),
    painting: new THREE.MeshStandardMaterial({ map: makePaintingTexture(), roughness: 0.7 }),
    brass: new THREE.MeshStandardMaterial({ color: '#b8893f', roughness: 0.35, metalness: 0.85 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: '#1f1915', roughness: 0.5, metalness: 0.7 }),
    leather: new THREE.MeshStandardMaterial({ color: '#5c1d17', roughness: 0.55, metalness: 0.05 }),
    leatherDark: new THREE.MeshStandardMaterial({ color: '#3d120e', roughness: 0.6 }),
    fabricGreen: new THREE.MeshStandardMaterial({ color: '#1f3a2c', roughness: 0.95 }),
    wax: new THREE.MeshStandardMaterial({ color: '#f1e3c6', roughness: 0.6, emissive: '#ff9a4a', emissiveIntensity: 0.06 }),
    terracotta: new THREE.MeshStandardMaterial({ color: '#9c4f2e', roughness: 0.85 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#2f5a32', roughness: 0.7 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#2d4a5a', roughness: 0.25, metalness: 0.1 }),
    glass: new THREE.MeshStandardMaterial({ color: '#e8d8b8', roughness: 0.1, transparent: true, opacity: 0.35 }),
    sand: new THREE.MeshStandardMaterial({ color: '#d9b67a', roughness: 0.9 }),
    lampShade: new THREE.MeshStandardMaterial({
      color: '#f0d5a8',
      emissive: '#ffb062',
      emissiveIntensity: 1.1,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    nightSky: new THREE.MeshBasicMaterial({ color: '#16203d' }),
    moon: new THREE.MeshBasicMaterial({ color: '#f4ecd2', toneMapped: false }),
    ember: new THREE.MeshStandardMaterial({ color: '#2a0d04', emissive: '#ff5a1a', emissiveIntensity: 2.2 }),
    log: new THREE.MeshStandardMaterial({ color: '#3a2416', roughness: 1 }),
  }
  return cache
}
