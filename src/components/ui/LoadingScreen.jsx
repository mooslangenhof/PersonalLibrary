import { useEffect, useState } from 'react'

export default function LoadingScreen({ done }) {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 1400)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  return (
    <div className={`loading ${done ? 'is-done' : ''}`}>
      <div className="loading-flame" />
      <p>Lighting the fire…</p>
    </div>
  )
}
