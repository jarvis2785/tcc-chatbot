import { useEffect, useState } from 'react';
import normalImg from './assets/syke-normal.png';
import happyImg from './assets/syke-happy.PNG';

export default function App() {
  const [sykeMessage, setSykeMessage] = useState('...');
  const [sykeImg, setSykeImg] = useState(normalImg);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
        const res = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json();
        const raw = data.reply || '';
        const expression = (raw.match(/\[EXPRESSION:?\s*(\w+)\]/i) || [])[1] || '';
        const clean = raw.replace(/\[.*?\]/g, '').trim();
        setSykeImg(expression.match(/happy|excited/i) ? happyImg : normalImg);
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
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const raw = data.reply || '';
      const expression = (raw.match(/\[EXPRESSION:?\s*(\w+)\]/i) || [])[1] || '';
      const clean = raw.replace(/\[.*?\]/g, '').trim();
      setSykeImg(expression.match(/happy|excited/i) ? happyImg : normalImg);
      setMessages([...newMessages, { role: 'assistant', content: raw }]);
      typeMessage(clean);
    } catch (e) {
      setSykeMessage('Something went wrong, try again!');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a2e1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', flexShrink: 0 }}>
        Syke ✦ TCC
      </div>

      {/* Cloud + dots */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '12px' }}>
        <div style={{ background: '#f5f0e8', borderRadius: '50%', padding: '16px 22px', width: '72vw', boxSizing: 'border-box', fontSize: '12px', lineHeight: '1.6', textAlign: 'center', color: '#1a1a1a', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {sykeMessage}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', margin: '8px 0' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5f0e8' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f5f0e8' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#f5f0e8' }} />
        </div>
      </div>

      {/* Syke image */}
      <div style={{ height: '300px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
        <img src={sykeImg} style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Input bar */}
      <div style={{ height: '56px', flexShrink: 0, background: '#0f1f0f', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="say something..."
          style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #4ade80', color: 'white', fontSize: '14px', outline: 'none', padding: '4px 0' }}
        />
        <button onClick={sendMessage} style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '20px', cursor: 'pointer' }}>→</button>
      </div>

    </div>
  );
}
