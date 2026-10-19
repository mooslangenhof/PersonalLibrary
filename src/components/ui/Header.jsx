import { useLibrary } from '../../state/useLibrary'

export default function Header() {
  const count = useLibrary((s) => s.books.length)
  return (
    <header className="header">
      <h1>The Cozy Library</h1>
      <p className="header-count">
        {count} {count === 1 ? 'book' : 'books'} on the shelf
      </p>
      <p className="header-hint">Drag to look around · scroll to lean in · click a book to open it</p>
    </header>
  )
}
