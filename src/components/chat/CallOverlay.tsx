'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  url: string;
  token: string;
  kind: 'AUDIO' | 'VIDEO';
  peerName: string;
  /** The user pressed hang up. */
  onHangUp: () => void;
  /** The other person left a call that had connected. */
  onRemoteLeft: () => void;
  /** Nobody joined within the ring time. */
  onNoAnswer: () => void;
};

const NO_ANSWER_MS = 50_000;
const mono = "'Space Mono', monospace";

function clock(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export default function CallOverlay({ url, token, kind, peerName, onHangUp, onRemoteLeft, onNoAnswer }: Props) {
  const remoteBox = useRef<HTMLDivElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<any>(null);
  const [phase, setPhase] = useState<'connecting' | 'waiting' | 'connected'>('connecting');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(kind === 'VIDEO');
  const [seconds, setSeconds] = useState(0);
  const connectedOnce = useRef(false);
  // Callbacks are kept in refs so a re-render of the parent never restarts the call.
  const cb = useRef({ onRemoteLeft, onNoAnswer });
  cb.current = { onRemoteLeft, onNoAnswer };

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const lk = await import('livekit-client');
        if (cancelled) return;
        const room = new lk.Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(lk.RoomEvent.TrackSubscribed, (track: any) => {
          const el = track.attach() as HTMLMediaElement;
          el.setAttribute('playsinline', 'true');
          if (track.kind === 'video') {
            el.style.cssText = 'width:100%;height:100%;object-fit:cover;background:#000';
          } else {
            el.style.display = 'none';
          }
          remoteBox.current?.appendChild(el);
        });
        room.on(lk.RoomEvent.TrackUnsubscribed, (track: any) => { track.detach().forEach((e: HTMLElement) => e.remove()); });
        room.on(lk.RoomEvent.ParticipantConnected, () => {
          connectedOnce.current = true;
          if (timeout) clearTimeout(timeout);
          setPhase('connected');
        });
        room.on(lk.RoomEvent.ParticipantDisconnected, () => {
          if (connectedOnce.current) cb.current.onRemoteLeft();
        });
        room.on(lk.RoomEvent.Disconnected, () => { if (!cancelled && connectedOnce.current) cb.current.onRemoteLeft(); });

        await room.connect(url, token);
        if (cancelled) { room.disconnect(); return; }

        if (room.remoteParticipants.size > 0) { connectedOnce.current = true; setPhase('connected'); }
        else {
          setPhase('waiting');
          timeout = setTimeout(() => { if (!connectedOnce.current) cb.current.onNoAnswer(); }, NO_ANSWER_MS);
        }

        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          if (kind === 'VIDEO') {
            await room.localParticipant.setCameraEnabled(true);
            const pub = room.localParticipant.getTrackPublication(lk.Track.Source.Camera);
            if (pub?.track && localVideo.current) pub.track.attach(localVideo.current);
          }
        } catch {
          setError(kind === 'VIDEO'
            ? 'We could not use your microphone or camera. Allow access in your browser (the padlock next to the address) and try again.'
            : 'We could not use your microphone. Allow access in your browser (the padlock next to the address) and try again.');
        }
      } catch {
        setError('Could not connect the call. Check your internet connection and try again.');
      }
    })();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [url, token, kind]);

  useEffect(() => {
    if (phase !== 'connected') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const toggleMic = async () => {
    const next = !muted;
    setMuted(next);
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next).catch(() => {});
  };
  const toggleCam = async () => {
    const next = !camOn;
    setCamOn(next);
    await roomRef.current?.localParticipant.setCameraEnabled(next).catch(() => {});
  };

  const status = error ? '' : phase === 'connecting' ? 'Connecting...' : phase === 'waiting' ? `Calling ${peerName}...` : clock(seconds);
  const btn = (bg: string): React.CSSProperties => ({ width: '3.4rem', height: '3.4rem', borderRadius: '50%', border: 'none', background: bg, color: '#fff', fontSize: '1.2rem', cursor: 'pointer' });

  return (
    <div role="dialog" aria-modal="true" aria-label={`${kind === 'VIDEO' ? 'Video' : 'Voice'} call with ${peerName}`}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, visibility: 'visible', background: '#07070a', color: '#f0ede8', display: 'flex', flexDirection: 'column', fontFamily: "'Syne', sans-serif" }}>
      {/* Remote video fills the screen; remote audio elements are added here too and play even while this is hidden. */}
      <div ref={remoteBox} style={{ position: 'absolute', inset: 0, display: kind === 'VIDEO' && phase === 'connected' ? 'block' : 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1.5rem', textAlign: 'center', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
        {!(kind === 'VIDEO' && phase === 'connected') && (
          <div aria-hidden style={{ width: '7rem', height: '7rem', borderRadius: '50%', background: 'linear-gradient(135deg,#cc0033,#ff1a47)', display: 'grid', placeItems: 'center', fontSize: '2.6rem', fontWeight: 800 }}>
            {peerName.trim().charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{peerName}</div>
        <div role="status" aria-live="polite" style={{ fontFamily: mono, fontSize: '0.9rem', color: '#bbb' }}>{status}</div>
        {error && <div role="alert" style={{ maxWidth: '26rem', fontFamily: mono, fontSize: '0.8rem', color: '#ff7a95', lineHeight: 1.6 }}>{error}</div>}
      </div>

      {kind === 'VIDEO' && (
        <video ref={localVideo} muted playsInline autoPlay aria-label="Your camera"
          style={{ position: 'absolute', right: '1rem', top: '1rem', width: 'min(32vw, 160px)', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333', background: '#000', zIndex: 2, display: camOn ? 'block' : 'none', transform: 'scaleX(-1)' }} />
      )}

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', gap: '1.2rem', padding: '1.5rem 1rem calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={toggleMic} aria-pressed={muted} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} style={btn(muted ? '#555' : '#2a2a30')}>{muted ? '🔇' : '🎤'}</button>
        {kind === 'VIDEO' && <button type="button" onClick={toggleCam} aria-pressed={!camOn} aria-label={camOn ? 'Turn camera off' : 'Turn camera on'} style={btn(camOn ? '#2a2a30' : '#555')}>{camOn ? '📷' : '🚫'}</button>}
        <button type="button" onClick={onHangUp} aria-label="End call" style={btn('#d1132f')}>📞</button>
      </div>
    </div>
  );
}
