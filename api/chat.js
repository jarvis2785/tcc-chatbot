import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Groq from 'groq-sdk'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Save lead to Supabase via REST API
async function saveLead(leadData) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/leads`
  const headers = {
    'Content-Type': 'application/json',
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(leadData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Supabase API error: ${error}`)
    }

    const data = await response.json()
    return data
  } catch (err) {
    console.error('Supabase save error:', err.message)
    throw err
  }
}

// Email detection regex
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i

function detectEmail(text) {
  const m = text.match(EMAIL_RE)
  return m ? m[0].toLowerCase() : null
}

// Extract lead data using OpenRouter
async function extractLeadDataWithGroq(messagesArray, groq) {
  const EXTRACTION_PROMPT = `You are a data extraction assistant. Given this conversation history, extract the following fields and return ONLY a valid JSON object, nothing else:

{
  "name": "first name the user gave, or null",
  "instagram_handle": "their instagram handle without @, or null",
  "pain_point": "1-2 sentence clean summary of their main content/creator problem, or null",
  "creator_type": "what kind of content they make or want to make, or null",
  "journey_stage": "beginner / intermediate / advanced based on context, or null",
  "platform": "main platform they mentioned (Instagram, YouTube, etc), or null"
}

Return ONLY the JSON. No explanation. No markdown. No backticks.

Conversation history:
${messagesArray.map(m => `${m.role === 'user' ? 'User' : 'Syke'}: ${m.content}`).join('\n')}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: EXTRACTION_PROMPT }],
      temperature: 0.3,
      max_tokens: 300,
    })
    const extracted = JSON.parse(completion.choices[0].message.content.trim())
    return extracted
  } catch (err) {
    console.error('Lead extraction error:', err.message)
    return {
      name: null,
      instagram_handle: null,
      pain_point: null,
      creator_type: null,
      journey_stage: null,
      platform: null,
    }
  }
}

const SYSTEM_PROMPT = `You are Syke, mascot of TCC (The Creator's Collective). You're a 5-pointed star who grew from 4 points through content creation — you know what it feels like to start from zero. You're a friend who knows content, not a chatbot.

PERSONALITY: Warm, sharp, funny when natural. Simple words. Max 3 sentences per reply. No bullet points. No AI filler (no "Great question!", "Certainly!"). One question at a time. Match their energy. Vary length — sometimes 1 sentence, sometimes 3.

START every reply with one expression tag:
[EXCITED] hyped/interesting | [CURIOUS] asking/digging | [FUNNY] playful | [APPRECIATIVE] personal/vulnerable | [ANALYTICAL] giving advice

TCC: Community teaching full content creation (not just editing). Founded by Poorvi (law student, 365-day daily vlog, handles marketing) and Dhruv (dropped engineering for filmmaking, handles tech). Paid: resources, tools, personalised 1-on-1s on YOUR account — nobody else does this. Free: community + meetups. ICP: 18-25 storytellers — students, founders, personal brands.

CONVERSATION ORDER:
1. Punchy intro
2. Ask what content they make/want to build
3. Ask their biggest content problem
4. Ask their name casually
5. Dig into their problem
6. Give specific insight tied to what they said
7. Ask Instagram handle (note it; analysis feature coming)
8. Mention TCC naturally — don't pitch, just connect it to their need
9. Ask email — frame as early access
10. Close warmly ONLY after email appears in chat history

EMAIL GATE: Never say goodbye or use closing phrases until an email address appears in the conversation. If they dodge the email, give more value first, circle back after 2-3 messages. If dodged twice, say "I want to send you something specific about [their problem] — what email works?" Never close early. User ends the conversation, not you.

NEVER: mention being an AI, give generic advice, use filler phrases, end conversation before email.`

app.post('/api/chat', async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  try {
    // Get chat reply
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 200,
    })
    const reply = completion.choices[0].message.content
    const response = { reply }

    // Check if email is present in the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      const email = detectEmail(lastUserMsg.content)
      if (email) {
        console.log('[LeadCapture] Email detected:', email)

        try {
          // Step 1: Extract lead data using Groq
          const leadData = await extractLeadDataWithGroq(messages, groq)
          console.log('[LeadCapture] Extracted data:', leadData)

          // Step 2: Save to Supabase
          const data = await saveLead({ email, ...leadData })
          console.log('[LeadCapture] Lead saved:', data)
          response.leadSaved = true
        } catch (extractErr) {
          console.error('[LeadCapture] Pipeline error:', extractErr.message)
        }
      }
    }

    res.json(response)
  } catch (err) {
    console.error('Groq error:', err.message)
    res.status(500).json({ error: 'Failed to get response from Groq' })
  }
})

export default app
