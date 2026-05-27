const EXPRESSION_RE = /^\[(EXCITED|CURIOUS|FUNNY|APPRECIATIVE|ANALYTICAL)\]\s*/

function parseMessage(content) {
  const match = content.match(EXPRESSION_RE)
  if (match) {
    return { expression: match[1], text: content.slice(match[0].length) }
  }
  return { expression: null, text: content }
}

export function ChatMessage({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-[75%]"
          style={{ backgroundColor: '#7c3aed' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  const { expression, text } = parseMessage(message.content)

  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="text-base mt-5 shrink-0">⭐</span>
      <div className="flex flex-col max-w-[75%]">
        {expression && (
          <span
            className="text-xs mb-1 ml-1"
            style={{ color: '#6b7280' }}
          >
            {expression}
          </span>
        )}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
          style={{ backgroundColor: '#1a1a1a', color: '#e5e7eb' }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
