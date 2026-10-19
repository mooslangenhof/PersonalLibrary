// The "Admin Portal": a side panel for adding a new book or editing one.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../state/useLibrary'
import { DEFAULT_THEME, THEME_PRESETS } from '../../data/themes'
import { exportBooks, importBooksFromFile } from '../../data/storage'
import { letteringColor } from '../../utils/textures'

const EMPTY = {
  title: '',
  author: '',
  theme: { cover: DEFAULT_THEME.cover, accent: DEFAULT_THEME.accent },
  teachings: '',
  reflections: '',
}

export default function BookForm() {
  const panel = useLibrary((s) => s.panel)
  const editingId = useLibrary((s) => s.editingId)
  const books = useLibrary((s) => s.books)
  const { addBook, updateBook, deleteBook, closePanel, replaceBooks, resetLibrary, showToast } = useLibrary.getState()

  const open = panel === 'add' || panel === 'edit'
  const editing = panel === 'edit' ? books.find((b) => b.id === editingId) : null

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const titleInput = useRef()
  const fileInput = useRef()

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            title: editing.title,
            author: editing.author,
            theme: { ...editing.theme },
            teachings: editing.teachings ?? '',
            reflections: editing.reflections ?? '',
          }
        : EMPTY,
    )
    setErrors({})
    setConfirmDelete(false)
    setConfirmReset(false)
    setTimeout(() => titleInput.current?.focus(), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closePanel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closePanel])

  const activePreset = useMemo(
    () => THEME_PRESETS.find((p) => p.cover === form.theme.cover && p.accent === form.theme.accent)?.id ?? 'custom',
    [form.theme],
  )

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }
  const setTheme = (theme) => setForm((f) => ({ ...f, theme: { ...f.theme, ...theme } }))

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'Every book needs a title.'
    if (!form.author.trim()) next.author = 'Who wrote it?'
    setErrors(next)
    if (Object.keys(next).length) return
    if (editing) updateBook(editing.id, form)
    else addBook(form)
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      replaceBooks(await importBooksFromFile(file))
    } catch (err) {
      showToast(err.message || 'Could not read that backup file.')
    }
  }

  const ink = letteringColor(form.theme)

  return (
    <div className={`panel-layer ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="panel-backdrop" onClick={closePanel} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">{editing ? 'Rewrite a page' : 'A new arrival'}</p>
            <h2 id="panel-title">{editing ? 'Edit book' : 'Add a book'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={closePanel} aria-label="Close">
            ×
          </button>
        </div>

        <form className="panel-body" onSubmit={submit} noValidate>
          <div className="preview-row">
            <div
              className="cover-preview"
              style={{ background: form.theme.cover, color: ink, borderColor: form.theme.accent }}
              aria-hidden="true"
            >
              <span className="cover-preview-frame" style={{ borderColor: form.theme.accent }} />
              <span className="cover-preview-title">{form.title || 'Your book'}</span>
              <span className="cover-preview-diamond" style={{ color: form.theme.accent }}>
                ◆
              </span>
              <span className="cover-preview-author">{form.author || 'Author'}</span>
            </div>
            <div className="preview-fields">
              <label className="field">
                <span>Book title</span>
                <input ref={titleInput} value={form.title} onChange={set('title')} placeholder="e.g. The Art of Loving" className={errors.title ? 'has-error' : ''} maxLength={120} />
                {errors.title && <em className="field-error">{errors.title}</em>}
              </label>
              <label className="field">
                <span>Author</span>
                <input value={form.author} onChange={set('author')} placeholder="e.g. Erich Fromm" className={errors.author ? 'has-error' : ''} maxLength={120} />
                {errors.author && <em className="field-error">{errors.author}</em>}
              </label>
            </div>
          </div>

          <fieldset className="field">
            <legend>Cover colours</legend>
            <div className="swatches">
              {THEME_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`swatch ${activePreset === p.id ? 'is-active' : ''}`}
                  onClick={() => setTheme({ cover: p.cover, accent: p.accent })}
                  title={p.name}
                  aria-label={p.name}
                  aria-pressed={activePreset === p.id}
                >
                  <span style={{ background: p.cover }} />
                  <span style={{ background: p.accent }} />
                </button>
              ))}
            </div>
            <div className="custom-colors">
              <label>
                <input type="color" value={form.theme.cover} onChange={(e) => setTheme({ cover: e.target.value })} />
                Cover
              </label>
              <label>
                <input type="color" value={form.theme.accent} onChange={(e) => setTheme({ accent: e.target.value })} />
                Foil &amp; lettering
              </label>
              <span className="preset-name">
                {THEME_PRESETS.find((p) => p.id === activePreset)?.name ?? 'Custom colours'}
              </span>
            </div>
          </fieldset>

          <label className="field">
            <span>Core teachings</span>
            <small>One idea per line.</small>
            <textarea value={form.teachings} onChange={set('teachings')} rows={6} placeholder={'Love is an art that has to be learned and practised.\nCare, responsibility, respect and knowledge…'} />
          </label>

          <label className="field">
            <span>My personal reflections</span>
            <small>Leave an empty line between paragraphs.</small>
            <textarea className="handwritten" value={form.reflections} onChange={set('reflections')} rows={7} placeholder="What did this book change in me?" />
          </label>

          <div className="form-actions sticky-actions">
            {editing &&
              (confirmDelete ? (
                <button type="button" className="btn btn-danger" onClick={() => deleteBook(editing.id)}>
                  Yes, remove it
                </button>
              ) : (
                <button type="button" className="btn btn-ghost btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
                  Remove book
                </button>
              ))}
            <span className="spacer" />
            <button type="button" className="btn btn-ghost" onClick={closePanel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save changes' : 'Save & shelve'}
            </button>
          </div>

          {!editing && (
            <div className="backup">
              <p>
                Your library is saved in this browser. Keep a backup to move it to another device.
              </p>
              <div className="backup-actions">
                <button type="button" className="link-btn" onClick={() => exportBooks(books)}>
                  Export backup
                </button>
                <button type="button" className="link-btn" onClick={() => fileInput.current?.click()}>
                  Import backup
                </button>
                {confirmReset ? (
                  <button type="button" className="link-btn link-danger" onClick={resetLibrary}>
                    Really reset to the 3 starting books?
                  </button>
                ) : (
                  <button type="button" className="link-btn" onClick={() => setConfirmReset(true)}>
                    Reset library
                  </button>
                )}
                <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
              </div>
            </div>
          )}
        </form>
      </aside>
    </div>
  )
}
