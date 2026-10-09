'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimePing } from './useRealtimePing';
import { startRinging, stopRinging } from './ringtone';

// livekit-client is large, so it is only downloaded when a call actually starts.
const CallOverlay = dynamic(() => import('./CallOverlay'), { ssr: false });

export type ChatApi = {
  list: (after?: string) => Promise<Response>;
  send: (body: string) => Promise<Response>;
  startCall: (kind: 'AUDIO' | 'VIDEO') => Promise<Response>;
  callAction: (id: string, action: 'accept' | 'decline' | 'cancel' | 'end' | 'token') => Promise<Response>;
};

type Msg = { id: string; sender: 'ADMIN' | 'CLIENT' | 'SYSTEM'; body: string; createdAt: string; readAt: string | null; pending?: boolean };
type CallInfo = { id: string; kind: 'AUDIO' | 'VIDEO'; status: 'RINGING' | 'ACTIVE'; incoming: boolean; outgoing: boolean } | null;
type Overlay = { callId: string; url: string; token: string; kind: 'AUDIO' | 'VIDEO' } | null;

const mono = "'Space Mono', monospace";
const TZ = 'Africa/Johannesburg';
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });

export default function ChatPanel(props: {
  api: ChatApi;
  role: 'ADMIN' | 'CLIENT';
  peerName: string;
  /** Realtime channel for instant updates (the client gets it from the API; the admin passes the shared admin channel). */
  channel?: string | null;
  /** When false the panel pauses polling (for example while a drawer is closed). */
  active?: boolean;
  closedReason?: string;
  /** Called whenever the message list changes (the launcher uses it for the unread badge). */
  onMessages?: (messages: { sender: string; createdAt: string }[]) => void;
  /** Called when a call starts ringing for this person, so a closed drawer can open itself. */
  onIncomingCall?: () => void;
  /** When set, calls are handled elsewhere (the admin's single global call handler): this panel only shows the call buttons. */
  externalCalls?: { start: (kind: 'AUDIO' | 'VIDEO') => void };
  height?: string;
}) {
  const { api, role, peerName, active = true, closedReason, height = '420px' } = props;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [channel, setChannel] = useState<string | null>(props.channel ?? null);
  const [callsEnabled, setCallsEnabled] = useState(false);
  const [call, setCall] = useState<CallInfo>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | null>(null);
  const overlayRef = useRef<Overlay>(null);
  overlayRef.current = overlay;
  const mine = role;

  const loading = useRef(false);
  const load = useCallback(async () => {
    if (loading.current) return; // never stack polls when the network is slow
    loading.current = true;
    try {
      const res = await api.list(lastAt.current ?? undefined);
      if (!res.ok) return;
      const json = await res.json();
      if (json.channel) setChannel((c) => c ?? json.channel);
      if (typeof json.callsEnabled === 'boolean') setCallsEnabled(json.callsEnabled);
      setCall(json.call ?? null);
      const incoming: Msg[] = json.messages ?? [];
      if (incoming.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
          return merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
        lastAt.current = incoming[incoming.length - 1].createdAt;
      }
      // The server says there is no live call any more: the other side declined, cancelled or hung up.
      if (!json.call && overlayRef.current) setOverlay(null);
    } catch { /* offline: keep what we have */ } finally { loading.current = false; }
    setLoaded(true);
  }, [api]);

  useEffect(() => { lastAt.current = null; setMessages([]); setLoaded(false); load(); }, [load]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, call ? 4000 : 10000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [active, call, load]);

  useRealtimePing(active ? channel : null, () => load());

  // Keep the newest message in view.
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length, loaded]);

  // Ring while a call is coming in.
  const external = !!props.externalCalls;
  const ringing = !external && !!call?.incoming && !overlay;
  useEffect(() => {
    if (ringing) startRinging(`Incoming call from ${peerName}`);
    return () => stopRinging();
  }, [ringing, peerName]);

  const onMessagesRef = useRef(props.onMessages);
  onMessagesRef.current = props.onMessages;
  useEffect(() => { onMessagesRef.current?.(messages); }, [messages]);

  const onIncomingRef = useRef(props.onIncomingCall);
  onIncomingRef.current = props.onIncomingCall;
  useEffect(() => { if (ringing) onIncomingRef.current?.(); }, [ringing]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true); setError('');
    // Show it straight away; it is replaced by the saved message when the server answers.
    const temp: Msg = { id: 'tmp-' + Date.now(), sender: mine, body, createdAt: new Date().toISOString(), readAt: null, pending: true };
    setMessages((prev) => [...prev, temp]);
    setInput('');
    try {
      const res = await api.send(body);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        setInput(body);
        setError(json.error || 'Could not send. Please try again.');
      } else {
        await load();
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setInput(body);
      setError('No connection. Please try again.');
    }
    setSending(false);
  };

  const join = async (res: Response) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Could not start the call.'); return; }
    setOverlay({ callId: json.callId, url: json.url, token: json.token, kind: json.kind });
  };
  const startCall = async (kind: 'AUDIO' | 'VIDEO') => { setError(''); try { await join(await api.startCall(kind)); } catch { setError('No connection. Please try again.'); } };
  const answer = async () => { if (call) { setError(''); try { await join(await api.callAction(call.id, 'accept')); } catch { setError('No connection.'); } } };
  const decline = async () => { if (call) { await api.callAction(call.id, 'decline').catch(() => {}); load(); } };
  const rejoin = async () => { if (call) { setError(''); try { await join(await api.callAction(call.id, 'token')); } catch { setError('No connection.'); } } };
  const endCall = async () => {
    const id = overlay?.callId;
    setOverlay(null);
    if (id) await api.callAction(id, 'end').catch(() => {});
    load();
  };

  const closed = !!closedReason;
  const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '0.5rem 0.9rem', fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#141414', border: '1px solid #262626', borderRadius: '2px', color: '#f0ede8', fontFamily: "'Syne', sans-serif", height }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', padding: '0.7rem 0.9rem', borderBottom: '1px solid #262626' }}>
        <div style={{ fontWeight: 800 }}>{peerName}</div>
        {(callsEnabled || external) && !closed && !call && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={() => (props.externalCalls ? props.externalCalls.start('AUDIO') : startCall('AUDIO'))} aria-label={`Voice call ${peerName}`} style={btn('#2a2a30')}>Voice</button>
            <button type="button" onClick={() => (props.externalCalls ? props.externalCalls.start('VIDEO') : startCall('VIDEO'))} aria-label={`Video call ${peerName}`} style={btn('#2a2a30')}>Video</button>
          </div>
        )}
      </div>

      {ringing && call && (
        <div role="alert" style={{ padding: '0.8rem 0.9rem', background: 'rgba(76,175,80,0.12)', borderBottom: '1px solid rgba(76,175,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>📞 Incoming {call.kind === 'VIDEO' ? 'video' : 'voice'} call</span>
          <span style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={answer} style={btn('#2e7d32')}>Answer</button>
            <button type="button" onClick={decline} style={btn('#7a1020')}>Decline</button>
          </span>
        </div>
      )}
      {!external && !ringing && call && !overlay && (
        <div style={{ padding: '0.7rem 0.9rem', background: 'rgba(224,160,48,0.1)', borderBottom: '1px solid rgba(224,160,48,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem' }}>{call.status === 'ACTIVE' ? 'A call is in progress.' : 'Your call is still ringing...'}</span>
          <span style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={rejoin} style={btn('#2e7d32')}>Rejoin</button>
            <button type="button" onClick={async () => { await api.callAction(call.id, 'end').catch(() => {}); load(); }} style={btn('#7a1020')}>End</button>
          </span>
        </div>
      )}

      <div ref={listRef} role="log" aria-live="polite" aria-label="Messages" style={{ flex: 1, overflowY: 'auto', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {loaded && messages.length === 0 && (
          <p style={{ color: '#8a8a8a', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>
            {closed ? closedReason : role === 'CLIENT' ? `Send ${peerName} a message. You will get a reply here.` : 'No messages yet.'}
          </p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || day(prev.createdAt) !== day(m.createdAt);
          const sep = newDay && <div style={{ textAlign: 'center', fontFamily: mono, fontSize: '0.64rem', color: '#777', margin: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{day(m.createdAt)}</div>;
          if (m.sender === 'SYSTEM') {
            return <div key={m.id}>{sep}<div style={{ textAlign: 'center', fontFamily: mono, fontSize: '0.7rem', color: '#9a9a9a' }}>{m.body} · {time(m.createdAt)}</div></div>;
          }
          const isMine = m.sender === mine;
          const lastMine = isMine && !messages.slice(i + 1).some((x) => x.sender === mine);
          return (
            <div key={m.id}>
              {sep}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%', padding: '0.55rem 0.8rem', borderRadius: '10px', background: isMine ? 'hsl(348,100%,36%)' : '#24242a', color: '#fff', opacity: m.pending ? 0.65 : 1, fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.body}
                  <div style={{ fontFamily: mono, fontSize: '0.6rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                    {m.pending ? 'Sending...' : time(m.createdAt)}{lastMine && m.readAt ? ' · Seen' : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div role="alert" style={{ padding: '0.4rem 0.9rem', fontFamily: mono, fontSize: '0.72rem', color: '#ff7a95' }}>{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem', borderTop: '1px solid #262626' }}>
        <label htmlFor={'chat-input-' + role} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Message</label>
        <textarea
          id={'chat-input-' + role}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={closed}
          rows={1}
          maxLength={2000}
          placeholder={closed ? 'This chat is closed' : 'Type a message...'}
          style={{ flex: 1, resize: 'none', background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0ede8', padding: '0.6rem 0.8rem', fontFamily: "'Syne', sans-serif", fontSize: '0.9rem', borderRadius: '2px', maxHeight: '6rem' }}
        />
        <button type="submit" disabled={sending || closed || !input.trim()} style={{ ...btn(sending || !input.trim() || closed ? '#2a2a2a' : 'hsl(348,100%,40%)'), cursor: sending || !input.trim() || closed ? 'not-allowed' : 'pointer' }}>Send</button>
      </form>

      {!external && overlay && (
        <CallOverlay
          url={overlay.url}
          token={overlay.token}
          kind={overlay.kind}
          peerName={peerName}
          onHangUp={endCall}
          onRemoteLeft={endCall}
          onNoAnswer={async () => { await endCall(); setError('No answer.'); }}
        />
      )}
    </div>
  );
}
