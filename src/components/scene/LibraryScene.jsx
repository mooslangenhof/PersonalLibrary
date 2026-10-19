// Everything inside the 3D canvas.
import { Sparkles } from '@react-three/drei'
import Room from './Room'
import Fireplace from './Fireplace'
import Bookshelf from './Bookshelf'
import Lighting from './Lighting'
import CameraRig from './CameraRig'
import Effects from './Effects'

export default function LibraryScene() {
  return (
    <>
      <color attach="background" args={['#0b0604']} />
      <fog attach="fog" args={['#120904', 9, 20]} />
      <Lighting />
      <Room />
      <Fireplace />
      <Bookshelf />
      {/* Dust drifting in the lamplight */}
      <Sparkles count={70} scale={[8, 3.4, 7]} position={[0, 2, 1]} size={1.6} speed={0.18} opacity={0.45} color="#ffd9a8" />
      <CameraRig />
      <Effects />
    </>
  )
}
