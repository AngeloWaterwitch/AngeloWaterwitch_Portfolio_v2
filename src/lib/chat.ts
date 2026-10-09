import { after } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { sanitise } from '@/lib/sanitise';
import { adminChannel, clientChannel, ping } from '@/lib/realtime';

export const MAX_MESSAGE_LENGTH = 2000;

export type ChatSender = 'ADMIN' | 'CLIENT' | 'SYSTEM';

/** Strips tags and trims; returns null when nothing is left to send. */
export function cleanMessage(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = sanitise(input.slice(0, MAX_MESSAGE_LENGTH * 2)).slice(0, MAX_MESSAGE_LENGTH);
  return s.length > 0 ? s : null;
}

/** Tells the other side to fetch. Admin messages ping the client's channel; client messages and calls ping the admin channel. */
export function notifyOtherSide(clientId: string, from: 'ADMIN' | 'CLIENT', kind: 'message' | 'call') {
  const run = () => (from === 'ADMIN' ? ping(clientChannel(clientId), kind) : ping(adminChannel(), kind, { clientId }));
  // Sent after the response, so the sender is never kept waiting for the realtime service.
  try { after(run); } catch { void run(); }
}

/** Adds a system line to the conversation (call started/missed/ended, etc.). */
export async function postSystemMessage(clientId: string, text: string) {
  try {
    await prisma.chatMessage.create({ data: { clientId, sender: 'SYSTEM', body: text.slice(0, 300), readAt: new Date() } });
  } catch (err) {
    console.error('[chat] system message failed:', (err as Error).message);
  }
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Emails the owner about a new client message, at most once every 15 minutes per client, so an offline owner does not
 * miss it and a chatty client does not flood the inbox. Never throws.
 */
export async function emailOwnerAboutMessage(client: { id: string; name: string }, preview: string) {
  try {
    const to = (process.env.RESEND_TO_EMAIL ?? '').trim().replace(/^["']+|["']+$/g, '');
    const apiKey = (process.env.RESEND_API_KEY ?? '').trim().replace(/^["']+|["']+$/g, '');
    if (!to || !apiKey) return;

    const since = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await prisma.auditLog.findFirst({
      where: { action: 'chat.email', actorId: client.id, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) return;
    await prisma.auditLog.create({ data: { actorType: 'SYSTEM', actorId: client.id, action: 'chat.email' } });

    const site = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
    const safeName = client.name.replace(/[\r\n]+/g, ' ').slice(0, 80);
    await new Resend(apiKey).emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to,
      subject: `New message from ${safeName} (client portal)`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#dc1e3c">New client message</h2>
        <p><strong>${esc(safeName)}</strong> wrote:</p>
        <blockquote style="border-left:3px solid #dc1e3c;padding-left:1rem;color:#555">${esc(preview.slice(0, 400)).replace(/\n/g, '<br/>')}</blockquote>
        ${site ? `<p><a href="${esc(site)}/admin/login" style="background:#dc1e3c;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:4px">Open the admin to reply</a></p>` : ''}
        <p style="color:#888;font-size:12px">You get at most one of these every 15 minutes per client.</p>
      </div>`,
    });
  } catch (err) {
    console.error('[chat] owner email failed:', (err as Error).message);
  }
}
