export const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i

// @ NOT preceded by alphanumeric → standalone handle, not part of an email address
// @shaaann.soni → handle ✅   shaansoni16@gmail.com → email, skipped ✅
const HANDLE_RE = /(?<![A-Za-z0-9])@([A-Za-z0-9_.]{2,30})/

// Detects assistant turns unambiguously asking for the user's name
const NAME_QUESTION_RE = /what(?:'?s|\s+is)\s+your\s+name\b|what\s+do\s+i\s+call\s+you\b/i

// Detects assistant turns asking what kind of content they want to make
const CONTENT_QUESTION_RE =
  /what.*(?:content|creat|build|make).*(?:you|your)|what.*you.*(?:creat|build|make)|what.*passionate|what.*niche|what.*trying to/i

// Words that score up the emotional weight of a message (pain point detection)
const PAIN_KEYWORDS = [
  'nervous', 'scared', 'afraid', "don't know", "dont know", "can't", 'cant',
  'struggle', 'struggling', 'problem', 'hard', 'difficult', 'confusing', 'confused',
  'worried', 'frustrat', 'stuck', 'lost', 'unsure', 'no idea', "haven't", 'havent',
  'not sure', "don't have", 'dont have', 'judging', 'judged', 'fear', 'anxious',
  'overwhelm', 'challenge', 'fail', 'no one', 'nobody', 'alone', 'shy', 'camera',
  'embarrass', 'cringe', "can't figure", 'never posted', 'no views', 'no engagement',
]

// Journey stage signals
const BEGINNER_SIGNALS = [
  'just starting', 'just started', "haven't posted", 'havent posted',
  "haven't started", 'havent started', 'new to', 'never posted', 'want to start',
  'trying to start', 'starting out', 'from scratch', "don't know where",
  'dont know where', 'first time', 'just beginning', 'no idea where to',
]

const INTERMEDIATE_SIGNALS = [
  'already posting', 'been posting', 'i post', 'i have followers', 'my channel',
  'growing my', 'build my audience', 'my account has', 'been creating',
  'posting for', 'have a following', 'my page has',
]

// [keyword to match, normalised platform name]
const PLATFORM_KEYWORDS = [
  ['instagram', 'Instagram'], ['reels', 'Instagram'],
  [' ig ', 'Instagram'], ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'], ['tik tok', 'TikTok'],
  ['twitter', 'Twitter'], ['linkedin', 'LinkedIn'],
]

// Words that are never a real name
const NON_NAME_WORDS = new Set([
  'me', 'my', 'i', 'hi', 'hey', 'its', 'it', 'sure', 'yeah', 'yes', 'no',
  'ok', 'okay', 'so', 'well', 'um', 'uh', 'just', 'the', 'a', 'an',
  'im', 'am', 'is', 'are', 'was', 'that', 'this', 'he', 'she', 'they', 'we',
  'call', 'btw', 'lol', 'haha', 'hm', 'hmm', 'oh', 'ah', 'ha',
  'want', 'need', 'like', 'love', 'hate', 'make', 'making', 'create', 'creating',
  'start', 'starting', 'try', 'trying', 'been', 'have', 'has', 'do', 'did',
  'get', 'got', 'go', 'going', 'went', 'think', 'know', 'feel', 'use', 'using',
  'see', 'look', 'looking', 'work', 'working', 'help', 'build', 'building',
  'post', 'posting', 'grow', 'growing', 'run', 'running',
  'really', 'actually', 'pretty', 'very', 'good', 'great', 'new', 'big', 'small',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'up', 'out',
  'about', 'into', 'over', 'after', 'before', 'through', 'between',
  'also', 'and', 'but', 'yet', 'still', 'then', 'too', 'not', 'kind', 'sort',
])

// ─── helpers ────────────────────────────────────────────────────────────────

export function detectEmail(text) {
  const m = text.match(EMAIL_RE)
  return m ? m[0].toLowerCase() : null
}

function cleanName(raw) {
  const text = raw.trim()
  // Structured phrase: "I'm X", "my name is X", "call me X"
  const structured = text.match(
    /(?:i'?m|i am|my name(?:'?s)? is|call me|it'?s|they call me)\s+([A-Za-z][a-z]{0,30})/i
  )
  if (structured) {
    const n = structured[1]
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
  }
  // Walk first 4 words — cap prevents pulling a random word from a long off-topic reply
  const words = text.split(/\s+/)
  for (let wi = 0; wi < Math.min(words.length, 4); wi++) {
    const clean = words[wi].replace(/[^a-zA-Z]/g, '')
    if (clean.length >= 2 && !NON_NAME_WORDS.has(clean.toLowerCase())) {
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
    }
  }
  return null
}

function scorePain(text) {
  const lower = text.toLowerCase()
  return PAIN_KEYWORDS.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0)
}

function extractJourneyStage(userMessages) {
  const joined = userMessages.map(m => m.content.toLowerCase()).join(' ')
  if (INTERMEDIATE_SIGNALS.some(s => joined.includes(s))) return 'intermediate'
  if (BEGINNER_SIGNALS.some(s => joined.includes(s))) return 'beginner'
  return null
}

function extractPlatform(userMessages) {
  const joined = userMessages.map(m => m.content.toLowerCase()).join(' ')
  for (const [kw, platform] of PLATFORM_KEYWORDS) {
    if (joined.includes(kw)) return platform
  }
  return null
}

// ─── main export ─────────────────────────────────────────────────────────────

export function extractLeadData(messages, email) {
  let name = null
  let instagram_handle = null
  let creator_type = null

  // Pain: track highest-scoring message; fallback = first substantive message
  let bestPainMsg = null
  let bestPainScore = -1
  let fallbackPainMsg = null

  const userMessages = messages.filter(m => m.role === 'user')

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (msg.role === 'assistant') {
      // Name: reply right after Syke asks "what's your name?"
      if (!name && NAME_QUESTION_RE.test(msg.content)) {
        const next = messages[i + 1]
        if (next?.role === 'user') name = cleanName(next.content)
      }

      // Creator type: reply right after Syke asks what they want to create
      if (!creator_type && CONTENT_QUESTION_RE.test(msg.content)) {
        const next = messages[i + 1]
        if (next?.role === 'user' && !EMAIL_RE.test(next.content)) {
          creator_type = next.content.trim().slice(0, 120).toLowerCase()
        }
      }
      continue
    }

    // ── user messages only below ──
    const text = msg.content
    if (EMAIL_RE.test(text)) continue // skip the email message itself

    // Instagram handle: @ not preceded by alphanumeric
    if (!instagram_handle) {
      const m = text.match(HANDLE_RE)
      if (m) instagram_handle = m[1]
    }

    // Pain point: score every user message, keep highest
    if (text.length > 8) {
      const score = scorePain(text)
      if (score > bestPainScore) {
        bestPainScore = score
        bestPainMsg = text.slice(0, 400)
      }
      // Fallback: first substantive non-handle message
      if (!fallbackPainMsg && text.length > 20 && !HANDLE_RE.test(text)) {
        fallbackPainMsg = text.slice(0, 400)
      }
    }
  }

  return {
    email,
    name:             name             || null,
    instagram_handle: instagram_handle || null,
    pain_point:       bestPainScore > 0 ? bestPainMsg : (fallbackPainMsg || null),
    creator_type:     creator_type     || null,
    journey_stage:    extractJourneyStage(userMessages),
    platform:         extractPlatform(userMessages),
  }
}
