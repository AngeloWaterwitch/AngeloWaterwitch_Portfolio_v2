'use client';

import { useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let shared: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  if (!url || !key) return null;
  shared = shared ?? createClient(url, key, { realtime: { params: { eventsPerSecond: 5 } }, auth: { persistSession: false, autoRefreshToken: false } });
  return shared;
}

/**
 * Calls `onPing` the moment the server announces something new on this channel. The ping carries no message text:
 * the callback should fetch from our own API. If Realtime is unavailable nothing breaks, because the caller also polls.
 */
export function useRealtimePing(channel: string | null | undefined, onPing: (payload: { kind?: string; clientId?: string }) => void) {
  const handler = useRef(onPing);
  handler.current = onPing;

  useEffect(() => {
    if (!channel) return;
    const sb = getClient();
    if (!sb) return;
    const ch = sb.channel(channel).on('broadcast', { event: 'ping' }, (m) => handler.current(m.payload ?? {})).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [channel]);
}
