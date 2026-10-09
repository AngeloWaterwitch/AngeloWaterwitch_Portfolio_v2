'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatPanel, { type ChatApi } from '@/components/chat/ChatPanel';

const SEEN_KEY = 'aw_chat_seen';
const json = { 'Content-Type': 'application/json' };

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const seenAt = useRef<string>('');
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    try { seenAt.current = sessionStorage.getItem(SEEN_KEY) ?? ''; } catch { /* storage unavailable */ }
  }, []);

  const api: ChatApi = useMemo(() => ({
    list: (after) => fetch('/api/client/chat' + (after ? '?after=' + encodeURIComponent(after) : ''), { cache: 'no-store' }),
    send: (body) => fetch('/api/client/chat', { method: 'POST', headers: json, body: JSON.stringify({ body }) }),
    startCall: (kind) => fetch('/api/client/calls', { method: 'POST', headers: json, body: JSON.stringify({ kind }) }),
    callAction: (id, action) => fetch('/api/client/calls/' + id, { method: 'POST', headers: json, body: JSON.stringify({ action }) }),
  }), []);

  const markSeen = useCallback(() => {
    seenAt.current = new Date().toISOString();
    try { sessionStorage.setItem(SEEN_KEY, seenAt.current); } catch { /* storage unavailable */ }
    setUnread(0);
  }, []);

  const onMessages = useCallback((msgs: { sender: string; createdAt: string }[]) => {
    if (openRef.current) { markSeen(); return; }
    setUnread(msgs.filter((m) => m.sender === 'ADMIN' && m.createdAt > seenAt.current).length);
  }, [markSeen]);

  const toggle = () => { setOpen((o) => { if (!o) markSeen(); return !o; }); };

  return (
    <>
      <div
        role="complementary"
        aria-label="Chat with Angelo"
        aria-hidden={!open}
        style={{
          position: 'fixed', right: '8px', bottom: '80px', zIndex: 1500,
          width: 'min(420px, calc(100vw - 16px))',
          visibility: open ? 'visible' : 'hidden', opacity: open ? 1 : 0, transition: 'opacity 0.15s',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        }}
      >
        <ChatPanel
          api={api}
          role="CLIENT"
          peerName="Angelo"
          active
          height="min(560px, calc(100dvh - 120px))"
          onMessages={onMessages}
          onIncomingCall={() => { setOpen(true); markSeen(); }}
        />
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : unread ? `Open chat with Angelo, ${unread} new message${unread === 1 ? '' : 's'}` : 'Open chat with Angelo'}
        style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 1600, width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: 'var(--cr-primary, #cc0033)', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}
      >
        {open ? '✕' : '💬'}
        {!open && unread > 0 && (
          <span aria-hidden style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '22px', height: '22px', padding: '0 6px', borderRadius: '999px', background: '#fff', color: '#cc0033', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
