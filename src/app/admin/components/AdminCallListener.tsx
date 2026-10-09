'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimePing } from '@/components/chat/useRealtimePing';
import { startRinging, stopRinging } from '@/components/chat/ringtone';

const CallOverlay = dynamic(() => import('@/components/chat/CallOverlay'), { ssr: false });

export type AdminSummary = {
  channel: string | null;
  callsEnabled: boolean;
  unread: Record<string, number>;
  totalUnread: number;
};

type Incoming = { id: string; kind: 'AUDIO' | 'VIDEO'; clientId: string; clientName: string };
type Live = { id: string; kind: 'AUDIO' | 'VIDEO'; status: string; clientId: string; clientName: string };
type Overlay = { callId: string; url: string; token: string; kind: 'AUDIO' | 'VIDEO'; peerName: string } | null;

const mono = "'Space Mono', monospace";
const json = { 'Content-Type': 'application/json' };

/**
 * The one place the admin answers calls. It lives on every admin tab so a ringing client is never missed,
 * and it also starts outgoing calls requested from a client's chat (via a window event).
 */
export function AdminCallListener({ onSummary }: { onSummary: (s: AdminSummary) => void }) {
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [live, setLive] = useState<Live[]>([]);
  const [channel, setChannel] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [error, setError] = useState('');
  const overlayRef = useRef<Overlay>(null);
  overlayRef.current = overlay;
  const onSummaryRef = useRef(onSummary);
  onSummaryRef.current = onSummary;

  const busy = useRef(false);
  // Bumped on every call action. A poll that started before the action is stale and must not undo it.
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    if (busy.current) return; // never stack polls when the network is slow
    busy.current = true;
    const seqAtStart = seq.current;
    try {
      const res = await fetch('/api/admin/chat/summary', { cache: 'no-store' });
      if (!res.ok) return;
      const s = await res.json();
      setChannel((c) => c ?? s.channel);
      if (seqAtStart === seq.current) { setIncoming(s.incoming ?? []); setLive(s.live ?? []); }
      onSummaryRef.current({ channel: s.channel, callsEnabled: s.callsEnabled, unread: s.unread ?? {}, totalUnread: s.totalUnread ?? 0 });
      // The call ended on the other side (declined, hung up): close our call screen.
      if (seqAtStart === seq.current && overlayRef.current && !(s.live ?? []).some((c: Live) => c.id === overlayRef.current!.callId)) setOverlay(null);
    } catch { /* offline: try again on the next poll */ } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, incoming.length || overlay ? 4000 : 10000);
    return () => clearInterval(id);
  }, [refresh, incoming.length, overlay]);

  useRealtimePing(channel, () => refresh());

  const first = incoming[0];
  const ringing = !!first && !overlay;
  useEffect(() => {
    if (ringing) startRinging(`Incoming call from ${first.clientName}`);
    return () => stopRinging();
  }, [ringing, first?.clientName]); // eslint-disable-line react-hooks/exhaustive-deps

  const join = async (res: Response, peerName: string) => {
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || 'Could not start the call.'); return; }
    setOverlay({ callId: j.callId, url: j.url, token: j.token, kind: j.kind, peerName });
  };
  const act = (id: string, action: string) => fetch('/api/admin/calls/' + id, { method: 'POST', headers: json, body: JSON.stringify({ action }) });

  // Outgoing calls requested by a client's chat panel.
  useEffect(() => {
    const onStart = async (e: Event) => {
      const d = (e as CustomEvent).detail as { clientId: string; name: string; kind: 'AUDIO' | 'VIDEO' };
      setError('');
      try { await join(await fetch(`/api/admin/clients/${d.clientId}/calls`, { method: 'POST', headers: json, body: JSON.stringify({ kind: d.kind }) }), d.name); }
      catch { setError('No connection. Please try again.'); }
      refresh();
    };
    window.addEventListener('aw-admin-call', onStart);
    return () => window.removeEventListener('aw-admin-call', onStart);
  }, [refresh]);

  const end = async () => {
    const id = overlay?.callId;
    seq.current++;
    setOverlay(null);
    setLive((l) => l.filter((c) => c.id !== id));
    if (id) await act(id, 'end').catch(() => {});
    refresh();
  };

  const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '0.6rem 1.1rem', fontFamily: mono, fontSize: '0.74rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px' });
  const rejoinable = live.filter((c) => !overlay && !incoming.some((i) => i.id === c.id));

  return (
    <>
      {ringing && first && (
        <div role="alertdialog" aria-label={`Incoming call from ${first.clientName}`} style={{ position: 'fixed', top: '1rem', left: '1rem', right: '1rem', marginLeft: 'auto', maxWidth: '360px', zIndex: 2500, boxSizing: 'border-box', background: '#17171c', border: '1px solid rgba(76,175,80,0.6)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', padding: '1rem 1.1rem', color: '#f0ede8', fontFamily: "'Syne', sans-serif" }}>
          <div style={{ fontFamily: mono, fontSize: '0.68rem', color: '#4caf50', letterSpacing: '0.15em', textTransform: 'uppercase' }}>📞 Incoming {first.kind === 'VIDEO' ? 'video' : 'voice'} call</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.4rem 0 0.9rem' }}>{first.clientName}</div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" style={btn('#2e7d32')} onClick={async () => { setError(''); seq.current++; try { await join(await act(first.id, 'accept'), first.clientName); } catch { setError('No connection.'); } refresh(); }}>Answer</button>
            <button type="button" style={btn('#7a1020')} onClick={async () => { const id = first.id; seq.current++; setIncoming((l) => l.filter((c) => c.id !== id)); await act(id, 'decline').catch(() => {}); refresh(); }}>Decline</button>
          </div>
          {incoming.length > 1 && <div style={{ fontFamily: mono, fontSize: '0.66rem', color: '#999', marginTop: '0.7rem' }}>+{incoming.length - 1} more waiting</div>}
        </div>
      )}

      {rejoinable.length > 0 && (
        <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem', marginLeft: 'auto', maxWidth: '420px', boxSizing: 'border-box', zIndex: 2400, background: '#17171c', border: '1px solid rgba(224,160,48,0.6)', padding: '0.7rem 0.9rem', color: '#f0ede8', fontFamily: "'Syne', sans-serif", display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem' }}>Call with <strong>{rejoinable[0].clientName}</strong> {rejoinable[0].status === 'ACTIVE' ? 'is in progress' : 'is still ringing'}</span>
          <button type="button" style={btn('#2e7d32')} onClick={async () => { setError(''); try { await join(await act(rejoinable[0].id, 'token'), rejoinable[0].clientName); } catch { setError('No connection.'); } }}>Rejoin</button>
          <button type="button" style={btn('#7a1020')} onClick={async () => { const id = rejoinable[0].id; seq.current++; setLive((l) => l.filter((c) => c.id !== id)); await act(id, 'end').catch(() => {}); refresh(); }}>End</button>
        </div>
      )}

      {error && <div role="alert" style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 2400, background: '#2a1015', border: '1px solid #7a1020', color: '#ff9db0', fontFamily: mono, fontSize: '0.74rem', padding: '0.6rem 0.9rem', maxWidth: '24rem' }}>
        {error} <button type="button" onClick={() => setError('')} style={{ marginLeft: '0.6rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>}

      {overlay && (
        <CallOverlay url={overlay.url} token={overlay.token} kind={overlay.kind} peerName={overlay.peerName}
          onHangUp={end} onRemoteLeft={end} onNoAnswer={async () => { await end(); setError('No answer.'); }} />
      )}
    </>
  );
}
