'use client';

import { useMemo } from 'react';
import ChatPanel, { type ChatApi } from '@/components/chat/ChatPanel';

const json = { 'Content-Type': 'application/json' };

/** A client's conversation inside the admin. Calls are handed to the global AdminCallListener. */
export function AdminChat({ clientId, clientName, channel, callsEnabled, closed }: { clientId: string; clientName: string; channel: string | null; callsEnabled: boolean; closed: boolean }) {
  const api: ChatApi = useMemo(() => ({
    list: (after) => fetch(`/api/admin/clients/${clientId}/chat` + (after ? '?after=' + encodeURIComponent(after) : ''), { cache: 'no-store' }),
    send: (body) => fetch(`/api/admin/clients/${clientId}/chat`, { method: 'POST', headers: json, body: JSON.stringify({ body }) }),
    // Not used here: calls are started and answered by AdminCallListener.
    startCall: () => Promise.reject(new Error('handled globally')),
    callAction: () => Promise.reject(new Error('handled globally')),
  }), [clientId]);

  return (
    <ChatPanel
      api={api}
      role="ADMIN"
      peerName={clientName}
      channel={channel}
      height="460px"
      closedReason={closed ? 'This contract is finished, so the chat is closed.' : undefined}
      externalCalls={callsEnabled && !closed ? { start: (kind) => window.dispatchEvent(new CustomEvent('aw-admin-call', { detail: { clientId, name: clientName, kind } })) } : undefined}
    />
  );
}
