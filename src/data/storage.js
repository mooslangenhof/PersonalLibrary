// Persistence layer. Books are saved to the browser's localStorage, so the
// library is still there the next time you open the app in the same browser.
// Use "Export backup" / "Import backup" in the admin portal to move it between
// browsers or computers.
import { DEFAULT_BOOKS } from './defaultBooks'

const STORAGE_KEY = 'cozy-library/books/v1'

export function loadBooks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return structuredClone(DEFAULT_BOOKS)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isValidBook) : structuredClone(DEFAULT_BOOKS)
  } catch {
    return structuredClone(DEFAULT_BOOKS)
  }
}

export function saveBooks(books) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
    return true
  } catch {
    return false
  }
}

export function resetBooks() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — nothing to clear */
  }
  return structuredClone(DEFAULT_BOOKS)
}

export function exportBooks(books) {
  const blob = new Blob([JSON.stringify({ version: 1, books }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cozy-library-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importBooksFromFile(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  const books = Array.isArray(data) ? data : data?.books
  if (!Array.isArray(books)) throw new Error('This file does not look like a library backup.')
  const valid = books.filter(isValidBook)
  if (valid.length === 0) throw new Error('No books found in this backup.')
  return valid
}

function isValidBook(b) {
  return (
    b &&
    typeof b.id === 'string' &&
    typeof b.title === 'string' &&
    typeof b.author === 'string' &&
    b.theme &&
    typeof b.theme.cover === 'string' &&
    typeof b.theme.accent === 'string'
  )
}
