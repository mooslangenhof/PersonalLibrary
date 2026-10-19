// Soft base lighting. The warm "practical" lights (fire, lamp, lantern, candles)
// live next to the objects that emit them.
export default function Lighting() {
  return (
    <>
      <ambientLight color="#ffe2c4" intensity={0.3} />
      <hemisphereLight args={['#ffdcb5', '#2a160b', 0.55]} />
      {/* Cool moonlight from the window side, very faint, for contrast. */}
      <directionalLight position={[8, 5, 1]} color="#7d93d6" intensity={0.18} />
      {/* A gentle warm fill so the shelf reads from the default view. */}
      <pointLight position={[0.4, 2.6, 0.9]} color="#ffc48a" intensity={9} distance={9} decay={2} />
    </>
  )
}
