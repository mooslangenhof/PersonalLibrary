// Global app state (zustand). Books are persisted to localStorage on every change.
import { create } from 'zustand'
import { loadBooks, saveBooks, resetBooks } from '../data/storage'

const PASSCODE = (import.meta.env.VITE_LIBRARY_PASSCODE ?? '').trim()
const UNLOCK_KEY = 'cozy-library/unlocked'

function initiallyUnlocked() {
  if (!PASSCODE) return true
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

function newId(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
  return `${slug || 'book'}-${Date.now().toString(36)}`
}

export const useLibrary = create((set, get) => ({
  books: loadBooks(),

  // Reading flow: idle -> opening -> open -> closing -> idle
  activeId: null,
  phase: 'idle',
  openingAck: null, // id of the book that has started moving off the shelf
  hoveredId: null,
  justAddedId: null,

  // UI panels: null | 'add' | 'edit' | 'unlock'
  panel: null,
  editingId: null,
  pendingAction: null,
  unlocked: initiallyUnlocked(),
  passcodeRequired: Boolean(PASSCODE),
  toast: null,

  /* ---------------------------------------------------------- reading -- */
  openBook: (id) => {
    const { phase, panel } = get()
    if (phase !== 'idle' || panel) return
    set({ activeId: id, phase: 'opening', hoveredId: null, openingAck: null })
  },
  ackOpening: (id) => set({ openingAck: id }),
  markOpen: () => set({ phase: 'open' }),
  closeBook: () => {
    if (get().phase === 'open' || get().phase === 'opening') set({ phase: 'closing' })
  },
  finishClose: () => set({ activeId: null, phase: 'idle' }),
  setHovered: (id) => set({ hoveredId: id }),
  clearJustAdded: () => set({ justAddedId: null }),

  /* ----------------------------------------------------------- admin -- */
  /** Run `action` now if unlocked, otherwise ask for the passcode first. */
  requireAdmin: (action) => {
    if (get().unlocked) action()
    else set({ panel: 'unlock', pendingAction: action })
  },
  tryUnlock: (code) => {
    if (code.trim() !== PASSCODE) return false
    try {
      window.sessionStorage.setItem(UNLOCK_KEY, '1')
    } catch {
      /* ignore */
    }
    const action = get().pendingAction
    set({ unlocked: true, panel: null, pendingAction: null })
    if (action) setTimeout(action, 0)
    return true
  },
  openAddPanel: () => get().requireAdmin(() => set({ panel: 'add', editingId: null })),
  openEditPanel: (id) => get().requireAdmin(() => set({ panel: 'edit', editingId: id })),
  closePanel: () => set({ panel: null, editingId: null, pendingAction: null }),

  /* ----------------------------------------------------------- books -- */
  addBook: (data) => {
    const book = {
      id: newId(data.title),
      title: data.title.trim(),
      author: data.author.trim(),
      theme: { ...data.theme },
      teachings: data.teachings.trim(),
      reflections: data.reflections.trim(),
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ books: [...s.books, book], justAddedId: book.id, panel: null }))
    get().showToast(`“${book.title}” has a home on your shelf.`)
    return book.id
  },
  updateBook: (id, data) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === id
          ? {
              ...b,
              title: data.title.trim(),
              author: data.author.trim(),
              theme: { ...data.theme },
              teachings: data.teachings.trim(),
              reflections: data.reflections.trim(),
              updatedAt: new Date().toISOString(),
            }
          : b,
      ),
      panel: null,
      editingId: null,
    }))
    get().showToast('Saved.')
  },
  deleteBook: (id) => {
    const title = get().books.find((b) => b.id === id)?.title
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
      phase: s.activeId === id ? 'idle' : s.phase,
      panel: null,
      editingId: null,
    }))
    if (title) get().showToast(`“${title}” was removed from the shelf.`)
  },
  replaceBooks: (books) => {
    set({ books, activeId: null, phase: 'idle', panel: null })
    get().showToast(`Restored ${books.length} book${books.length === 1 ? '' : 's'} from backup.`)
  },
  resetLibrary: () => {
    set({ books: resetBooks(), activeId: null, phase: 'idle', panel: null })
    get().showToast('The library is back to its three starting books.')
  },

  showToast: (message) => {
    const id = Date.now()
    set({ toast: { id, message } })
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null })
    }, 3800)
  },
}))

// Persist every change to the book list.
let lastBooks = useLibrary.getState().books
useLibrary.subscribe((state) => {
  if (state.books !== lastBooks) {
    lastBooks = state.books
    if (!saveBooks(state.books)) {
      useLibrary.getState().showToast('Could not save — browser storage is unavailable.')
    }
  }
})
