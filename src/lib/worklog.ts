import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

const TZ = 'Africa/Johannesburg';

/** Adds an automatic entry to a project's work log. Never throws: logging must not break the action it records. */
export async function logEvent(
  projectId: string,
  kind: string,
  message: string,
  opts: { sessionId?: string; visible?: boolean } = {},
) {
  try {
    await prisma.workLogEntry.create({
      data: { projectId, kind, message: message.slice(0, 500), sessionId: opts.sessionId ?? null, visibleToClient: opts.visible ?? true },
    });
  } catch (err) {
    console.error('[worklog] failed to record', kind, (err as Error).message);
  }
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** Local (South African) time as 2026-10-10 14:05. */
export function saTime(d: Date | string): string {
  return new Date(d).toLocaleString('sv-SE', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export type WorkData = Awaited<ReturnType<typeof loadWorkData>>;

/** Everything about a project's work. clientView hides entries marked as internal. */
export async function loadWorkData(projectId: string, clientView: boolean) {
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true, email: true } },
      workSessions: { orderBy: { startedAt: 'desc' } },
      overtimeRequests: { orderBy: { createdAt: 'desc' } },
      logEntries: { where: clientView ? { visibleToClient: true } : undefined, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!project) return null;

  const now = new Date();
  const minutes = (s: { startedAt: Date; endedAt: Date | null }) => minutesBetween(s.startedAt, s.endedAt ?? now);
  const sessions = project.workSessions;
  const active = sessions.find((s) => !s.endedAt) ?? null;
  const totals = {
    totalMinutes: sessions.reduce((n, s) => n + minutes(s), 0),
    overtimeMinutes: sessions.filter((s) => s.overtime).reduce((n, s) => n + minutes(s), 0),
    sessionCount: sessions.length,
    lastWorkedAt: sessions.map((s) => s.endedAt ?? s.startedAt).sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
  };
  return { project, sessions, active, totals, minutes };
}

// ─── CSV ───────────────────────────────────────────────────

/** Prefixes cells that a spreadsheet could treat as a formula, then quotes the value. */
function cell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export function toCsv(data: NonNullable<WorkData>): string {
  type Row = { at: Date; cols: unknown[] };
  const rows: Row[] = [];

  for (const s of data.sessions) {
    rows.push({
      at: s.startedAt,
      cols: ['Work session', saTime(s.startedAt), s.endedAt ? saTime(s.endedAt) : 'in progress', data.minutes(s), s.overtime ? 'yes' : 'no', s.summary],
    });
  }
  for (const o of data.project.overtimeRequests) {
    rows.push({
      at: o.createdAt,
      cols: ['Overtime request', saTime(o.createdAt), '', o.estimatedMinutes, 'yes', `${o.status}: ${o.reason}${o.clientNote ? ' | Client note: ' + o.clientNote : ''}`],
    });
  }
  for (const e of data.project.logEntries) {
    rows.push({ at: e.createdAt, cols: ['Log', saTime(e.createdAt), '', '', '', e.message] });
  }
  rows.sort((a, b) => a.at.getTime() - b.at.getTime());

  const head = ['Type', 'Start (SA time)', 'End (SA time)', 'Minutes', 'Overtime', 'Details'];
  const lines = [
    [`Work log: ${data.project.title}`, `Client: ${data.project.client.name}`, `Generated ${saTime(new Date())}`].map(cell).join(','),
    head.map(cell).join(','),
    ...rows.map((r) => r.cols.map(cell).join(',')),
    '',
    ['Total time', '', '', data.totals.totalMinutes, '', formatDuration(data.totals.totalMinutes)].map(cell).join(','),
    ['Overtime', '', '', data.totals.overtimeMinutes, '', formatDuration(data.totals.overtimeMinutes)].map(cell).join(','),
  ];
  return '﻿' + lines.join('\r\n') + '\r\n'; // BOM so Excel reads UTF-8
}

// ─── PDF ───────────────────────────────────────────────────

/** The built-in PDF fonts only cover Latin-1; anything else becomes "?". */
const pdfSafe = (s: string) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E -ÿ]/g, '?');

export async function toPdf(data: NonNullable<WorkData>): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 595, H = 842, M = 50, LINE = 14;
  const ink = rgb(0.1, 0.1, 0.1), muted = rgb(0.42, 0.42, 0.42), accent = rgb(0.8, 0, 0.2);
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;

  const ensure = (h: number) => {
    if (y - h < M) { page = doc.addPage([W, H]); y = H - M; }
  };

  const wrap = (text: string, f: PDFFont, size: number, maxW: number): string[] => {
    const words = pdfSafe(text).split(' ');
    const out: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (f.widthOfTextAtSize(test, size) <= maxW) { line = test; continue; }
      if (line) out.push(line);
      // a single very long word: hard-split it
      let chunk = w;
      while (f.widthOfTextAtSize(chunk, size) > maxW && chunk.length > 1) {
        let n = chunk.length;
        while (n > 1 && f.widthOfTextAtSize(chunk.slice(0, n), size) > maxW) n--;
        out.push(chunk.slice(0, n));
        chunk = chunk.slice(n);
      }
      line = chunk;
    }
    if (line) out.push(line);
    return out.length ? out : [''];
  };

  const text = (t: string, opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; width?: number } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const x = opts.x ?? M;
    for (const l of wrap(t, f, size, opts.width ?? W - M - x)) {
      ensure(LINE);
      page.drawText(l, { x, y: y - size, size, font: f, color: opts.color ?? ink });
      y -= LINE;
    }
  };
  const gap = (n = 8) => { y -= n; };
  const heading = (t: string) => {
    gap(10); ensure(30);
    page.drawText(pdfSafe(t).toUpperCase(), { x: M, y: y - 10, size: 10, font: bold, color: accent });
    y -= 16;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 8;
  };

  // Title block
  page.drawText('Project Work Log', { x: M, y: y - 20, size: 20, font: bold, color: ink });
  y -= 30;
  text(data.project.title, { size: 12, f: bold });
  text(`Client: ${data.project.client.name}`, { color: muted });
  text(`Generated: ${saTime(new Date())} (South African time)`, { color: muted });

  heading('Summary');
  text(`Total time worked: ${formatDuration(data.totals.totalMinutes)}`);
  text(`Overtime worked: ${formatDuration(data.totals.overtimeMinutes)}`);
  text(`Work sessions: ${data.totals.sessionCount}`);
  text(`Status: ${data.project.status.replace(/_/g, ' ').toLowerCase()}  |  Progress: ${data.project.progress}%`);

  heading('Work sessions');
  if (data.sessions.length === 0) text('No work sessions recorded yet.', { color: muted });
  for (const s of [...data.sessions].reverse()) {
    const dur = formatDuration(data.minutes(s));
    text(`${saTime(s.startedAt)}  ->  ${s.endedAt ? saTime(s.endedAt).slice(11) : 'in progress'}   (${dur})${s.overtime ? '  [OVERTIME]' : ''}`, { f: bold, size: 9.5 });
    if (s.summary) text(s.summary, { x: M + 14, color: muted, size: 9.5 });
    gap(3);
  }

  heading('Overtime requests');
  if (data.project.overtimeRequests.length === 0) text('No overtime requested.', { color: muted });
  for (const o of [...data.project.overtimeRequests].reverse()) {
    const label = o.status === 'ACCEPTED' ? 'Client requires / accepted' : o.status === 'DECLINED' ? 'Client declined' : o.status === 'CANCELLED' ? 'Cancelled' : 'Awaiting client response';
    text(`${saTime(o.createdAt)}  -  ~${formatDuration(o.estimatedMinutes)}  -  ${label}`, { f: bold, size: 9.5 });
    text(o.reason, { x: M + 14, color: muted, size: 9.5 });
    if (o.clientNote) text(`Client note: ${o.clientNote}`, { x: M + 14, color: muted, size: 9.5 });
    gap(3);
  }

  heading('Activity log');
  if (data.project.logEntries.length === 0) text('No activity recorded yet.', { color: muted });
  for (const e of [...data.project.logEntries].reverse()) {
    text(`${saTime(e.createdAt)}   ${e.message}`, { size: 9.5 });
  }

  // Page numbers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: W - M - 60, y: 24, size: 8, font, color: muted });
  });

  return doc.save();
}

export const OVERTIME_VALID_DAYS = 7;

/**
 * The overtime the client has said they require and that is still unused: an ACCEPTED request, answered within the
 * last 7 days, whose estimated hours are not yet used up. Returns null when there is none.
 */
export async function findOvertimeAllowance(projectId: string) {
  const since = new Date(Date.now() - OVERTIME_VALID_DAYS * 24 * 3600 * 1000);
  const accepted = await prisma.overtimeRequest.findMany({
    where: { projectId, status: 'ACCEPTED', decidedAt: { gte: since } },
    orderBy: { decidedAt: 'desc' },
  });
  const now = new Date();
  for (const r of accepted) {
    const sessions = await prisma.workSession.findMany({ where: { overtimeRequestId: r.id }, select: { startedAt: true, endedAt: true } });
    const used = sessions.reduce((n, x) => n + minutesBetween(x.startedAt, x.endedAt ?? now), 0);
    if (used < r.estimatedMinutes) return { request: r, remainingMinutes: r.estimatedMinutes - used };
  }
  return null;
}
