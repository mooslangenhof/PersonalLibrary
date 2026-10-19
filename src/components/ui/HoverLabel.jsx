import { useLibrary } from '../../state/useLibrary'

export default function HoverLabel() {
  const book = useLibrary((s) => s.books.find((b) => b.id === s.hoveredId))
  const phase = useLibrary((s) => s.phase)
  const visible = Boolean(book) && phase === 'idle'
  return (
    <div className={`hover-label ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {book && (
        <>
          <span className="hover-dot" style={{ background: book.theme.cover, borderColor: book.theme.accent }} />
          <span className="hover-title">{book.title}</span>
          <span className="hover-author">{book.author}</span>
        </>
      )}
    </div>
  )
}
