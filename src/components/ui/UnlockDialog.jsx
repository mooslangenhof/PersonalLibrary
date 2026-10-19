import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../../state/useLibrary'

export default function UnlockDialog() {
  const open = useLibrary((s) => s.panel === 'unlock')
  const tryUnlock = useLibrary((s) => s.tryUnlock)
  const closePanel = useLibrary((s) => s.closePanel)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const input = useRef()

  useEffect(() => {
    if (open) {
      setCode('')
      setError(false)
      setTimeout(() => input.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null
  const submit = (e) => {
    e.preventDefault()
    if (!tryUnlock(code)) setError(true)
  }
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closePanel()}>
      <form className="unlock-card" onSubmit={submit}>
        <h2>The librarian’s key</h2>
        <p>Enter your passcode to add or change books.</p>
        <input
          ref={input}
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
          aria-label="Passcode"
          className={error ? 'has-error' : ''}
          autoComplete="current-password"
        />
        {error && <p className="field-error">That passcode doesn’t match.</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={closePanel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Unlock
          </button>
        </div>
      </form>
    </div>
  )
}
