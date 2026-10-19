import { useLibrary } from '../../state/useLibrary'

export default function Toast() {
  const toast = useLibrary((s) => s.toast)
  return (
    <div className={`toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite">
      {toast?.message}
    </div>
  )
}
