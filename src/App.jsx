import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import LibraryScene from './components/scene/LibraryScene'
import Header from './components/ui/Header'
import HoverLabel from './components/ui/HoverLabel'
import AddBookButton from './components/ui/AddBookButton'
import BookForm from './components/ui/BookForm'
import UnlockDialog from './components/ui/UnlockDialog'
import JournalOverlay from './components/ui/JournalOverlay'
import Toast from './components/ui/Toast'
import LoadingScreen from './components/ui/LoadingScreen'
import { useLibrary } from './state/useLibrary'

// Book covers are drawn with web fonts, so wait (briefly) for them first.
function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const fonts = document.fonts
    if (!fonts) return setReady(true)
    const loads = Promise.all([
      fonts.load('700 48px "Cormorant Garamond"'),
      fonts.load('italic 500 48px "Cormorant Garamond"'),
      fonts.load('500 32px "Caveat"'),
    ]).catch(() => {})
    const timeout = new Promise((r) => setTimeout(r, 2500))
    Promise.race([loads, timeout]).then(() => setReady(true))
  }, [])
  return ready
}

export default function App() {
  const fontsReady = useFontsReady()
  const [sceneReady, setSceneReady] = useState(false)
  const phase = useLibrary((s) => s.phase)
  const closeBook = useLibrary((s) => s.closeBook)

  // Escape closes an open book.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !useLibrary.getState().panel) closeBook()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeBook])

  return (
    <div className={`app phase-${phase}`}>
      {fontsReady && (
        <Canvas
          className="scene"
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 45, near: 0.05, far: 40, position: [0.6, 2.4, 6.0] }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          onCreated={() => setSceneReady(true)}
        >
          <Suspense fallback={null}>
            <LibraryScene />
          </Suspense>
        </Canvas>
      )}
      <Header />
      <HoverLabel />
      <AddBookButton />
      <JournalOverlay />
      <BookForm />
      <UnlockDialog />
      <Toast />
      <LoadingScreen done={fontsReady && sceneReady} />
    </div>
  )
}
