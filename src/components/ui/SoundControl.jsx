// Corner sound button with a small mixer: fireplace, rain, music and volume.
// Browsers only allow sound after a click, so it always starts muted.
import { useEffect, useRef, useState } from 'react'
import { createAmbience } from '../../audio/ambience'

const PREFS_KEY = 'cozy-library/sound'
const DEFAULTS = { volume: 0.6, layers: { fire: true, rain: true, music: true } }

const LAYERS = [
  { id: 'fire', label: 'Fireplace' },
  { id: 'rain', label: 'Rain on the window' },
  { id: 'music', label: 'Soft piano' },
]

function loadPrefs() {
  try {
    const p = JSON.parse(window.localStorage.getItem(PREFS_KEY))
    if (p && typeof p.volume === 'number' && p.layers) return { volume: p.volume, layers: { ...DEFAULTS.layers, ...p.layers } }
  } catch {
    /* use defaults */
  }
  return DEFAULTS
}

export default function SoundControl() {
  const engine = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [mixerOpen, setMixerOpen] = useState(false)
  const [prefs, setPrefs] = useState(loadPrefs)
  const wrap = useRef()

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* ignore */
    }
  }, [prefs])

  // Close the mixer when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!mixerOpen) return
    const onDown = (e) => wrap.current && !wrap.current.contains(e.target) && setMixerOpen(false)
    const onKey = (e) => e.key === 'Escape' && setMixerOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [mixerOpen])

  useEffect(() => () => engine.current?.stop(), [])

  const toggle = async () => {
    if (!engine.current) {
      engine.current = createAmbience()
      engine.current.configure(prefs)
    }
    if (playing) {
      engine.current.stop()
      setPlaying(false)
    } else {
      try {
        await engine.current.start()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }

  const setLayer = (id, on) => {
    setPrefs((p) => ({ ...p, layers: { ...p.layers, [id]: on } }))
    engine.current?.setLayer(id, on)
  }
  const setVolume = (v) => {
    setPrefs((p) => ({ ...p, volume: v }))
    engine.current?.setVolume(v)
  }

  return (
    <div className="sound" ref={wrap}>
      {mixerOpen && (
        <div className="mixer" role="group" aria-label="Room sounds">
          <p className="mixer-title">Room sounds</p>
          {LAYERS.map((l) => (
            <label key={l.id} className="mixer-row">
              <span>{l.label}</span>
              <input
                id={`sound-${l.id}`}
                type="checkbox"
                role="switch"
                className="switch"
                checked={prefs.layers[l.id]}
                onChange={(e) => setLayer(l.id, e.target.checked)}
              />
            </label>
          ))}
          <label className="mixer-volume">
            <span>Volume</span>
            <input
              id="sound-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={prefs.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
          {!playing && <p className="mixer-hint">Press the speaker to start the sound.</p>}
        </div>
      )}
      <button
        type="button"
        className={`sound-btn ${playing ? 'is-on' : ''}`}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Mute room sounds' : 'Play room sounds'}
        title={playing ? 'Mute' : 'Play room sounds'}
      >
        {playing ? <SpeakerOn /> : <SpeakerOff />}
        {playing && (
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      <button
        type="button"
        className={`mixer-btn ${mixerOpen ? 'is-open' : ''}`}
        onClick={() => setMixerOpen((o) => !o)}
        aria-expanded={mixerOpen}
        aria-label="Sound settings"
        title="Sound settings"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="10" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>
    </div>
  )
}

function SpeakerOn() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function SpeakerOff() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
