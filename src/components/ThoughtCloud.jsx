import { useEffect, useRef, useState } from 'react'
import '../styles/ThoughtCloud.css'

export default function ThoughtCloud({ content = '', loading = false, onSpeakingChange }) {
  const [displayed, setDisplayed] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(content.length > 0)

  // Extract text and remove expression tags
  const EXPRESSION_RE = /^\[(EXCITED|CURIOUS|FUNNY|APPRECIATIVE|ANALYTICAL)\]\s*/i
  const text = (content || '').replace(EXPRESSION_RE, '').trim()

  // Typewriter effect
  useEffect(() => {
    if (loading || !text) {
      setIsSpeaking(false)
      setDisplayed('')
      return
    }

    setIsSpeaking(true)
    setDisplayed('')
    let i = 0
    let active = true

    const id = setInterval(() => {
      if (!active) return
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        if (active) setIsSpeaking(false)
      }
    }, 22) // milliseconds per character

    return () => {
      active = false
      clearInterval(id)
    }
  }, [text, loading])

  // Emit speaking state to parent
  useEffect(() => {
    onSpeakingChange?.(isSpeaking)
  }, [isSpeaking]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="thought-cloud-anchor">
      {/* Cloud shape with text content */}
      <div className="cloud-bubble">
        {loading ? (
          <div className="cloud-loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        ) : (
          <p className="cloud-text">
            {displayed}
            {isSpeaking && <span className="text-cursor" />}
          </p>
        )}
      </div>

      {/* Trailing bubbles below cloud toward Syke */}
      <div className="trailing-bubble trailing-bubble-1" aria-hidden="true" />
      <div className="trailing-bubble trailing-bubble-2" aria-hidden="true" />
      <div className="trailing-bubble trailing-bubble-3" aria-hidden="true" />
    </div>
  )
}
