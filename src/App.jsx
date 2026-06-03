import { useEffect, useState } from 'react';
import normalImg       from './assets/syke-normal.png';
import happyImg        from './assets/syke-happy.PNG';
import funnyImg        from './assets/syke-funny.png';
import curiousImg      from './assets/syke-curious.png';
import appreciativeImg from './assets/syke-appreciative.png';

const resolveExpression = (expr) => {
  const e = (expr || '').toLowerCase();
  if (/happy|excited/.test(e))   return happyImg;
  if (/funny/.test(e))           return funnyImg;
  if (/curious/.test(e))         return curiousImg;
  if (/appreciative/.test(e))    return appreciativeImg;
  return normalImg;
};

export default function App() {
  const [sykeMessage, setSykeMessage] = useState('...');
  const [sykeImg, setSykeImg] = useState(normalImg);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cloudKey, setCloudKey] = useState(0);
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  // Transparent body for embed mode
  useEffect(() => {
    if (isEmbed) {
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
    }
  }, [isEmbed]);

  // Re-trigger pop animation each time a new message starts typing
  useEffect(() => {
    if (sykeMessage === '') setCloudKey(k => k + 1);
  }, [sykeMessage]);

  // Typewriter effect
  const typeMessage = (text) => {
    setSykeMessage('');
    let i = 0;
    const interval = setInterval(() => {
      setSykeMessage(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 30);
  };

  // Opening message — fires once on mount
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json();
        const raw = data.reply || '';
        const expression = (raw.match(/\[(\w+)\]/) || [])[1] || '';
        const clean = raw.replace(/\[.*?\]/g, '').trim();
        setSykeImg(resolveExpression(expression));
        typeMessage(clean);
      } catch (e) {
        setSykeMessage('Hey! Something went wrong on my end.');
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setSykeMessage('...');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const raw = data.reply || '';
      console.log('[DEBUG] raw API response:', raw);
      const expression = (raw.match(/\[(\w+)\]/) || [])[1] || '';
      console.log('[DEBUG] extracted expression:', expression);
      const img = resolveExpression(expression);
      console.log('[DEBUG] selected image src:', img);
      const clean = raw.replace(/\[.*?\]/g, '').trim();
      setSykeImg(img);
      setMessages([...newMessages, { role: 'assistant', content: raw }]);
      typeMessage(clean);
    } catch (e) {
      setSykeMessage('Something went wrong, try again!');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', background: isEmbed ? 'transparent' : '#11453a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header — hidden in embed mode */}
      {!isEmbed && (
        <div style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fffee3', fontSize: '16px', fontFamily: '"Apple Garamond", Georgia, serif', letterSpacing: '0.8px', flexShrink: 0 }}>
          Syke ✦ TCC
        </div>
      )}

      {/* Syke — independent, fixed */}
      <div style={{ position: 'fixed', bottom: '56px', left: '50%', transform: 'translateX(-50%)', width: '280px', height: '280px', flexShrink: 0, zIndex: 1 }}>
        <img src={sykeImg} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes cloudPop {
          0%   { opacity: 0; transform: scale(0.3); }
          60%  { opacity: 1; transform: scale(1.08); }
          80%  { transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cloudFloat {
          0%   { transform: scale(1)    rotate(0deg); }
          25%  { transform: scale(1.03) rotate(-0.8deg); }
          50%  { transform: scale(1.04) rotate(0deg); }
          75%  { transform: scale(1.03) rotate(0.8deg); }
          100% { transform: scale(1)    rotate(0deg); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
        input::placeholder { color: rgba(255,254,227,0.45); font-family: "Apple Garamond", Georgia, serif; }
      `}</style>

      {/* CSS cartoon cloud + thought dots */}
      <div style={{
        position: 'fixed',
        bottom: '370px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70vw',
        maxWidth: '250px',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Pop wrapper — re-mounts on new message to replay animation */}
        <div key={cloudKey} style={{
          width: '100%',
          animation: 'cloudPop 0.4s ease-out both',
          transformOrigin: 'bottom center',
        }}>

          {/* Outline + depth shadow via drop-shadow (follows the composite cloud silhouette) */}
          {/* Breathing + wobble — gentle float after pop */}
          <div style={{ animation: 'cloudFloat 4s ease-in-out 0.4s infinite', transformOrigin: 'center center' }}>
          <div style={{
            filter: [
              'drop-shadow(2px 0 0 #c4b99a)',
              'drop-shadow(-2px 0 0 #c4b99a)',
              'drop-shadow(0 2px 0 #c4b99a)',
              'drop-shadow(0 -2px 0 #c4b99a)',
              'drop-shadow(0 6px 14px rgba(0,0,0,0.22))',
            ].join(' '),
          }}>

            {/* Cloud: bumps on TOP + BOTTOM + body — drop-shadow outlines the full organic silhouette */}
            <div style={{ position: 'relative', paddingTop: '26px', paddingBottom: '28px' }}>

              {/* ── TOP BUMPS — 5 circles, all centered at y=26 so body covers their bottom halves exactly ── */}
              <div style={{ position: 'absolute', top: '-1px',  left: '-2px', width: '54px', height: '54px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '-8px',  left: '18%',  width: '68px', height: '68px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '-13px', left: '37%',  width: '78px', height: '78px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '-8px',  left: '58%',  width: '68px', height: '68px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '-1px',  left: '78%',  width: '54px', height: '54px', borderRadius: '50%', background: '#faf6e8' }} />

              {/* ── BOTTOM BUMPS — 4 circles, bottom:-4px so ~60% peeks below the body ── */}
              <div style={{ position: 'absolute', bottom: '-4px', left: '6%',  width: '54px', height: '54px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', bottom: '-4px', left: '26%', width: '68px', height: '68px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', bottom: '-4px', left: '50%', width: '68px', height: '68px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', bottom: '-4px', left: '71%', width: '54px', height: '54px', borderRadius: '50%', background: '#faf6e8' }} />

              {/* ── LEFT SIDE BUMPS — 5 circles staggered vertically, peek ~16-20px left of body.
                   Percentage top positions scale with body height so coverage holds at any text length. ── */}
              <div style={{ position: 'absolute', top:  '5%', left: '-16px', width: '52px', height: '52px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '22%', left: '-20px', width: '58px', height: '58px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '42%', left: '-18px', width: '54px', height: '54px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '62%', left: '-20px', width: '58px', height: '58px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '80%', left: '-14px', width: '46px', height: '46px', borderRadius: '50%', background: '#faf6e8' }} />

              {/* ── RIGHT SIDE BUMPS — 5 circles, offsets staggered differently from left for irregular feel ── */}
              <div style={{ position: 'absolute', top: '10%', right: '-15px', width: '50px', height: '50px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '30%', right: '-20px', width: '58px', height: '58px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '50%', right: '-16px', width: '52px', height: '52px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '68%', right: '-20px', width: '58px', height: '58px', borderRadius: '50%', background: '#faf6e8' }} />
              <div style={{ position: 'absolute', top: '86%', right: '-12px', width: '42px', height: '42px', borderRadius: '50%', background: '#faf6e8' }} />

              {/* ── BODY — z-index:2 covers inner halves of ALL bumps (top + bottom + left + right).
                   Only the outer arcs peek past the body edges, creating the organic silhouette.
                   Large borderRadius keeps the sides and corners smooth, never rectangular. ── */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                background: '#faf6e8',
                borderRadius: '34px',
                padding: '18px 24px 16px',
                minHeight: '60px',
                fontSize: '11.5px',
                lineHeight: '1.6',
                textAlign: 'center',
                color: '#2a2010',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
              }}>
                {sykeMessage}
              </div>
            </div>
          </div>
          </div>{/* end cloudFloat wrapper */}

          {/* Thought dots — 5 dots, each on its own rhythm like rising bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '7px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dfdd99', animation: 'dotPulse 1.2s ease-in-out 0s    infinite' }} />
            <div style={{ width: '8px',  height: '8px',  borderRadius: '50%', background: '#dfdd99', animation: 'dotPulse 1.5s ease-in-out 0.15s infinite' }} />
            <div style={{ width: '6px',  height: '6px',  borderRadius: '50%', background: '#dfdd99', animation: 'dotPulse 1.8s ease-in-out 0.3s  infinite' }} />
            <div style={{ width: '4px',  height: '4px',  borderRadius: '50%', background: '#dfdd99', animation: 'dotPulse 2.1s ease-in-out 0.45s infinite' }} />
            <div style={{ width: '3px',  height: '3px',  borderRadius: '50%', background: '#dfdd99', animation: 'dotPulse 2.4s ease-in-out 0.6s  infinite' }} />
          </div>

        </div>
      </div>

      {/* Input bar — fixed to bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '56px', background: isEmbed ? 'transparent' : '#11453a', borderTop: isEmbed ? 'none' : '1px solid rgba(255,254,227,0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="talk to syke..."
          style={{ flex: 1, background: '#1a5c4a', border: '1.5px solid rgba(255,254,227,0.25)', borderRadius: '999px', color: '#fffee3', fontSize: '14px', fontFamily: '"Apple Garamond", Georgia, serif', outline: 'none', padding: '12px 16px' }}
        />
        <button onClick={sendMessage} style={{ background: '#fffee3', border: 'none', color: '#11453a', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(255,254,227,0.2)' }}>→</button>
      </div>

    </div>
  );
}
