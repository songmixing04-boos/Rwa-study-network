import { useEffect, useRef, useState } from 'react';

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => setLoading(false);
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', background: '#1a1a1a' }}>
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#1a1a1a', zIndex: 10, flexDirection: 'column', gap: 16
        }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #f5a623', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: '#f5a623', fontFamily: 'sans-serif', fontSize: 14, letterSpacing: 1 }}>
            Loading RWA...
          </span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/proxy/"
        title="RWA Study Portal"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="fullscreen; autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-top-navigation"
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
      `}</style>
    </div>
  );
}
