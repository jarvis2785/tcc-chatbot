import { useState, useEffect, useRef } from 'react'
import { detectEmail, extractLeadData } from '../lib/extractLeadData'
import { saveLead, updateLead } from '../lib/supabase'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const leadSaved = useRef(false)

  // Guard against React Strict Mode double-invoking this effect
  const initFetched = useRef(false)
  useEffect(() => {
    if (initFetched.current) return
    initFetched.current = true
    fetchReply([])
  }, [])

  async function fetchReply(history) {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(text) {
    const userMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)

    // Silently capture lead when email is detected (once per session)
    if (!leadSaved.current) {
      const email = detectEmail(text)
      if (email) {
        leadSaved.current = true
        console.log('[LeadCapture] email detected:', email)

        // Step 1: Quick INSERT to secure the email immediately
        saveLead({ email })
          .then(() => {
            // Step 2: Extract all fields from full conversation history
            const fullData = extractLeadData(updated, email)
            console.log('[LeadCapture] enriched data:', fullData)
            // Step 3: UPDATE the existing row with all enriched fields
            return updateLead(email, fullData)
          })
          .catch(err => console.error('[LeadCapture] pipeline error:', err))
      }
    }

    await fetchReply(updated)
  }

  return { messages, loading, sendMessage }
}
