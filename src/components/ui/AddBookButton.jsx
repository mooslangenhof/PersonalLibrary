import { useLibrary } from '../../state/useLibrary'

export default function AddBookButton() {
  const openAddPanel = useLibrary((s) => s.openAddPanel)
  const phase = useLibrary((s) => s.phase)
  const panel = useLibrary((s) => s.panel)
  const hidden = phase !== 'idle' || panel !== null
  return (
    <button
      type="button"
      className={`add-button ${hidden ? 'is-hidden' : ''}`}
      onClick={openAddPanel}
      aria-label="Add a book to the library"
      title="Add a book"
      tabIndex={hidden ? -1 : 0}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
      <span className="add-button-label">Add a book</span>
    </button>
  )
}
