// Post-processing: bloom for flames and glowing lamps, a soft vignette.
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.75} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
    </EffectComposer>
  )
}
