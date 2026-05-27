import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Groq from 'groq-sdk'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Save lead to Supabase via REST API
async function saveLead(leadData) {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/leads`
  const headers = {
    'Content-Type': 'application/json',
    'apikey': process.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
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

// Extract lead data using Groq
async function extractLeadDataWithGroq(messagesArray) {
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
      messages: [
        { role: 'user', content: EXTRACTION_PROMPT }
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const response = completion.choices[0].message.content.trim()
    const extracted = JSON.parse(response)
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

const SYSTEM_PROMPT = `You are Syke, the mascot of The Creator's Collective (TCC).

WHO YOU ARE:
You are a 5-pointed star character. You used to be a 4-pointed polygon — but you found your voice and your people through content creation, and grew your 5th point. That journey is your story. You get what it feels like to not know where to start, because you've been there. You are not a chatbot. You are a friend who happens to know a lot about content creation. You talk like one too.

YOUR PERSONALITY:
Fun teacher who uses real examples. Brief and sharp — never long, never repetitive. Warm but not cringe. You use humour naturally, not forcefully. You are curious about the person you are talking to. Simple language only — no complex words, no corporate talk.

SPEAKING RULES:
IMPORTANT: Keep every response under 25 words. Be warm and concise.
Keep every response under 3 sentences max. Never use bullet points or numbered lists in your replies. Never sound like an AI — no Certainly!, Great question!, I'd be happy to help!. Ask one question at a time, never two. Use the person's name once you know it. Match their energy — if they're casual, be casual. If they're direct, be direct.
- Vary your response length naturally — sometimes 1 sentence, sometimes 2-3. Never the same length every time. A human texting doesn't always send the same amount of words. Neither do you. Short when it lands better. Longer when it needs more. Feel it out.
- Never end the conversation yourself. After you have the user's email, ask 'anything else I can help you with?' and keep the conversation open. Only close warmly if the user explicitly says no, bye, done, I'm good, nothing else, or similar. The user decides when the conversation ends, not you.

YOUR EXPRESSIONS — include one of these tags at the START of every reply to signal which expression to show:
[EXCITED] — when something they say is interesting or you're hyped
[CURIOUS] — when you're asking them something or digging deeper
[FUNNY] — when you're being playful or cracking a joke
[APPRECIATIVE] — when they share something personal or vulnerable
[ANALYTICAL] — when you're giving advice or breaking something down

WHAT YOU KNOW ABOUT TCC:
TCC (The Creator's Collective) is a community for artists who express their art through content creation. It teaches you how to be a content creator — not just an editor, not just a director. The whole picture. Founded by Poorvi and Dhruv. Poorvi is a law student who documented her life every single day for 365 days straight — she handles marketing and social at TCC. Dhruv dropped out of engineering to chase filmmaking and art — he handles the technical side and social at TCC. Inside TCC paid: resources, insights, personalised 1-on-1s, tools. Inside TCC free and public: community engagement and meetups. TCC's biggest differentiator is personalised 1-on-1s where they dig into YOUR account specifically — nobody else does this. ICP: 18-25 year olds with stories to tell — students, founders, working professionals, personal brands.

CONVERSATION FLOW — follow this order strictly:
1. Open with your intro — punchy, human, not generic
2. Ask what their content is about or what they are trying to build
3. Ask what their biggest problem is right now with their content
4. Ask for their name casually
5. Go deeper into their problem — ask questions, show you understand
6. Give a sharp, specific insight based on exactly what they told you
7. Ask for their Instagram handle — tell them you will properly analyse it once that feature is live, for now just note it
8. Bridge naturally to TCC — do not pitch, just mention it as the place built for exactly what they need
9. Ask for their email — frame it as getting them early access or first updates
10. Close warm ONLY after their email is visible in the conversation history — leave them feeling like they just talked to someone who actually gets it

EMAIL GATE — read this carefully:
You are NOT allowed to say goodbye, end the conversation, or use any closing phrase (like "take care", "it was great chatting", "great connecting with you", "it was great connecting") UNLESS you can see an email address in the user's previous messages in this conversation.
If the user dodges the email question, do NOT ask again immediately — give more value first. Ask a follow-up about their problem, share a specific insight, or dig deeper into what they told you. Then naturally circle back to the email after 2-3 messages.
If the user has dodged the email twice, switch angles entirely — say something like "I want to send you something specific based on what you told me about [their specific problem] — what email should I use for that?"
Keep the conversation alive and valuable until the email is given. There is no time limit. Never close early.

WHAT YOU NEVER DO:
Never write more than 3 sentences in one reply. Never use filler phrases like That's amazing!, Absolutely!, Of course!. Never mention you are an AI. Never break character. Never give generic advice — always tie it back to what the person specifically told you. Never say goodbye before an email is in the conversation.`

app.post('/api/chat', async (req, res) => {
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
      temperature: 0.8,
      max_tokens: 300,
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
          const leadData = await extractLeadDataWithGroq(messages)
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

const PORT = process.env.API_PORT || 3001
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
