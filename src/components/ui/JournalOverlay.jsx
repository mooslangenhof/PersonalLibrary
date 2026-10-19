// The journal-page overlay shown while a book is open.
import { useEffect, useRef } from 'react'
import { useLibrary } from '../../state/useLibrary'
import { readableInk, shade } from '../../data/themes'

function toLines(text) {
  return (text || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function JournalOverlay() {
  const phase = useLibrary((s) => s.phase)
  const book = useLibrary((s) => s.books.find((b) => b.id === s.activeId))
  const closeBook = useLibrary((s) => s.closeBook)
  const openEditPanel = useLibrary((s) => s.openEditPanel)
  const visible = phase === 'open' && Boolean(book)

  // Keep showing the last book while the overlay fades out.
  const last = useRef(null)
  if (book) last.current = book
  const shown = book ?? last.current

  const closeBtn = useRef()
  useEffect(() => {
    if (visible) setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 400)
  }, [visible])

  if (!shown) return null
  const teachings = toLines(shown.teachings)
  const reflections = (shown.reflections || '').trim()
  const style = {
    '--book-cover': shown.theme.cover,
    '--book-accent': shown.theme.accent,
    '--book-cover-ink': readableInk(shown.theme.cover),
    '--book-cover-deep': shade(shown.theme.cover, -0.35),
  }

  return (
    <div className={`journal-layer ${visible ? 'is-visible' : ''}`} aria-hidden={!visible} inert={!visible} style={style}>
      <div className="journal-backdrop" onClick={closeBook} />
      <div className="journal-wrap" role="dialog" aria-modal="true" aria-labelledby="journal-title">
      <article className="journal">
        <div className="journal-ribbon" aria-hidden="true" />

        <section className="page page-left">
          <p className="page-kicker">From the shelf</p>
          <h2 id="journal-title" className="journal-title">
            {shown.title}
          </h2>
          <p className="journal-author">{shown.author}</p>
          <div className="ornament" aria-hidden="true">
            <span />◆<span />
          </div>

          <h3 className="page-heading">Core Teachings</h3>
          {teachings.length > 0 ? (
            <ol className="teachings">
              {teachings.map((t, i) => (
                <li key={i}>
                  <span className="teaching-num">{toRoman(i + 1)}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-note">No teachings written down yet.</p>
          )}
          <footer className="page-footer">Added {formatDate(shown.createdAt)}</footer>
        </section>

        <section className="page page-right">
          <h3 className="page-heading handwritten-heading">My Reflections</h3>
          {reflections ? (
            <div className="reflections">
              {reflections.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="reflections reflections-empty">
              This page is waiting for you. What stayed with you after reading it? Use <em>Edit</em> below to write it
              down.
            </p>
          )}
          <footer className="page-footer page-footer-right">
            {shown.updatedAt ? `Last written ${formatDate(shown.updatedAt)}` : ''}
          </footer>
        </section>
      </article>

        <div className="journal-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => openEditPanel(shown.id)}>
            Edit
          </button>
          <button type="button" ref={closeBtn} className="btn btn-primary" onClick={closeBook}>
            Return to Shelf
          </button>
        </div>
      </div>
    </div>
  )
}

function toRoman(n) {
  const map = [
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ]
  let out = ''
  for (const [v, s] of map) while (n >= v) (out += s), (n -= v)
  return out
}
