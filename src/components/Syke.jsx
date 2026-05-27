import { useEffect, useRef, useState } from 'react'
import '../styles/Syke.css'
import sykeNormal from '../assets/syke-normal.png'
import sykeHappy from '../assets/syke-happy.PNG'

// Expressions that use the happy asset
const HAPPY_EXPRESSIONS = new Set(['excited', 'happy', 'appreciative'])

export default function Syke({ expression = 'neutral', bouncing = false, speaking = false }) {
  const containerRef = useRef(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0, rot: 0 })

  const isHappy = HAPPY_EXPRESSIONS.has(expression)

  // Mouse parallax tracking (desktop only)
  useEffect(() => {
    function handleMouseMove(e) {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx  // -1 to +1
      const dy = (e.clientY - cy) / cy  // -1 to +1
      setMouseOffset({
        x: -dx * 8,
        y: -dy * 6,
        rot: -dx * 3,
      })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className={[
        'syke-container',
        bouncing  ? 'syke-bouncing'  : '',
        speaking  ? 'syke-speaking'  : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--mouse-x':   `${mouseOffset.x}px`,
        '--mouse-y':   `${mouseOffset.y}px`,
        '--mouse-rot': `${mouseOffset.rot}deg`,
      }}
    >
      {/* Normal face */}
      <img
        className={`syke-img syke-img-normal ${isHappy ? 'syke-img-hidden' : ''}`}
        src={sykeNormal}
        alt=""
        draggable="false"
      />
      {/* Happy face — crossfades in for excited/happy/appreciative */}
      <img
        className={`syke-img syke-img-happy ${isHappy ? '' : 'syke-img-hidden'}`}
        src={sykeHappy}
        alt="Syke"
        draggable="false"
      />
    </div>
  )
}
