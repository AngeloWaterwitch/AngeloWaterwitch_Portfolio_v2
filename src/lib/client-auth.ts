import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const CLIENT_COOKIE = 'aw_client';
export const CLIENT_SESSION_HOURS = 12;

// No 0/O, 1/I/L so a code read out loud or typed from a message is hard to get wrong.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 16;
const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{16}$/;

function codeSecret(): string {
  const s = process.env.CLIENT_CODE_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error('CLIENT_CODE_SECRET (or NEXTAUTH_SECRET) must be set');
  return 'client-access-code:' + s;
}

/** A new access code like AW-K7MQ-4XJP-9TDA-2WEN. 16 characters from a 31-letter alphabet is about 79 bits. */
export function generateAccessCode(): string {
  let raw = '';
  for (let i = 0; i < CODE_LENGTH; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
  return 'AW-' + raw.match(/.{4}/g)!.join('-');
}

/** Accepts what a person types (any case, with or without dashes/spaces/AW prefix). Returns null if it cannot be a valid code. */
export function normaliseAccessCode(input: string): string | null {
  let s = String(input ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === CODE_LENGTH + 2 && s.startsWith('AW')) s = s.slice(2);
  return CODE_PATTERN.test(s) ? s : null;
}

/** Keyed hash used to look a client up by code. The code itself is never stored. */
export function hashAccessCode(normalised: string): string {
  return createHmac('sha256', codeSecret()).update(normalised).digest('hex');
}

export function accessCodeHint(normalised: string): string {
  return normalised.slice(-4);
}

/** Display form for a normalised code. */
export function formatAccessCode(normalised: string): string {
  return 'AW-' + normalised.match(/.{4}/g)!.join('-');
}

/** Creates a fresh code and everything that must be stored for it. The plain code is returned once and never again. */
export function issueAccessCode() {
  const code = generateAccessCode();
  const normalised = normaliseAccessCode(code)!;
  return { code, hash: hashAccessCode(normalised), hint: accessCodeHint(normalised) };
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export async function createClientSession(clientId: string, ip: string, userAgent: string | null) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { codeExpiresAt: true } });
  let expiresAt = new Date(Date.now() + CLIENT_SESSION_HOURS * 3600 * 1000);
  // A session can never outlive the access code.
  if (client?.codeExpiresAt && client.codeExpiresAt < expiresAt) expiresAt = client.codeExpiresAt;

  const token = randomBytes(32).toString('base64url');
  await prisma.clientSession.create({
    data: { clientId, tokenHash: sha256(token), expiresAt, ip, userAgent: userAgent?.slice(0, 300) ?? null },
  });
  // Opportunistic clean-up of this client's old sessions.
  await prisma.clientSession.deleteMany({ where: { clientId, expiresAt: { lt: new Date() } } }).catch(() => {});
  return { token, expiresAt };
}

export async function setClientCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearClientCookie() {
  const store = await cookies();
  store.delete(CLIENT_COOKIE);
}

/** The signed-in client for this request, or null. Checks the session, the expiry and the client's status on every request. */
export async function getCurrentClient() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.clientSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { client: true },
  });
  if (!session) return null;

  const now = new Date();
  const c = session.client;
  const codeValid = !c.codeExpiresAt || c.codeExpiresAt > now;
  if (session.expiresAt <= now || c.status !== 'ACTIVE' || !codeValid) return null;
  return c;
}

export async function endClientSession() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (token) await prisma.clientSession.deleteMany({ where: { tokenHash: sha256(token) } }).catch(() => {});
  store.delete(CLIENT_COOKIE);
}

/** Ends a client's access immediately: the code stops working and every open session is removed. */
export async function revokeClientAccess(clientId: string) {
  await prisma.$transaction([
    prisma.client.update({ where: { id: clientId }, data: { codeExpiresAt: new Date() } }),
    prisma.clientSession.deleteMany({ where: { clientId } }),
  ]);
}
