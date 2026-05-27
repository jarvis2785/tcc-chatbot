import { useState } from 'react'

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4"
      style={{ borderTop: '1px solid #1f1f1f' }}
    >
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Say something..."
        disabled={disabled}
        className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        style={{
          backgroundColor: '#1a1a1a',
          color: '#fff',
          border: '1px solid #2a2a2a',
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-xl px-5 py-3 text-sm font-medium text-white transition-opacity"
        style={{
          backgroundColor: '#7c3aed',
          opacity: disabled || !value.trim() ? 0.4 : 1,
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Send
      </button>
    </form>
  )
}
