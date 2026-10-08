import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { PROJECT_STATUS_LABEL, formatRands, formatDate, formatDateTime } from '@/lib/format';
import LogoutButton from './LogoutButton';
import ProjectLive from './ProjectLive';
import { loadWorkData } from '@/lib/worklog';

export const dynamic = 'force-dynamic';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const label: React.CSSProperties = { ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' };

const dl: React.CSSProperties = { ...mono, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ddd', border: '1px solid #3a3a3a', padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '1px' };

const badgeColor: Record<string, string> = {
  QUOTED: '#9a9a9a', DEPOSIT_PENDING: '#e0a030', IN_PROGRESS: '#3fa7ff', IN_REVIEW: '#b58cff', COMPLETED: '#4caf50', CANCELLED: '#777',
};

export default async function ClientDashboard() {
  const client = await getCurrentClient();
  if (!client) redirect('/client/login');

  // Only this client's projects, and only the updates meant for them.
  const projects = await prisma.clientProject.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    include: { updates: { where: { visibleToClient: true }, orderBy: { createdAt: 'desc' }, take: 50 } },
  });

  // Work sessions, overtime and the (client-visible) activity log for each project.
  const serverNow = Date.now();
  const work = await Promise.all(projects.map((p) => loadWorkData(p.id, true)));

  const lastUpdate = projects
    .flatMap((p) => [p.updatedAt, ...p.updates.map((u) => u.createdAt)])
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem) 4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ ...label, color: 'var(--cr-light, #ff1a47)', marginBottom: '0.6rem' }}>Client Portal</div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.1 }}>
            Hello, <span style={{ color: 'var(--cr-light, #ff1a47)' }}>{client.name.split(' ')[0]}</span>
          </h1>
          {lastUpdate && (
            <p style={{ ...mono, fontSize: '0.74rem', color: 'var(--cr-muted)', marginTop: '0.6rem' }}>
              Last update: {formatDateTime(lastUpdate)}
            </p>
          )}
        </div>
        <LogoutButton />
      </header>

      {projects.length === 0 && (
        <p style={{ color: 'var(--cr-muted)' }}>No projects yet. Angelo will add yours shortly.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {projects.map((p, i) => {
          const w = work[i];
          const balance = Math.max(p.totalCents - (p.depositPaidAt ? p.depositCents : 0) - (p.finalPaidAt ? p.totalCents - p.depositCents : 0), 0);
          return (
            <section key={p.id} aria-labelledby={'p-' + p.id} style={{ background: 'var(--cr-bg3, #1a1a1a)', border: '1px solid var(--cr-bg4, #222)', borderRadius: '2px', padding: 'clamp(1.1rem, 4vw, 1.8rem)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <h2 id={'p-' + p.id} style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800 }}>{p.title}</h2>
                <span style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeColor[p.status], border: '1px solid ' + badgeColor[p.status], padding: '0.25rem 0.7rem', borderRadius: '999px' }}>
                  {PROJECT_STATUS_LABEL[p.status]}
                </span>
              </div>

              {p.description && <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.7, marginTop: '0.8rem', whiteSpace: 'pre-line' }}>{p.description}</p>}

              <div style={{ marginTop: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={label}>Progress</span>
                  <span style={{ ...mono, fontSize: '0.8rem' }}>{p.progress}%</span>
                </div>
                <div role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.title} progress`}
                  style={{ height: '8px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: p.progress + '%', height: '100%', background: 'linear-gradient(90deg, var(--cr-primary, #cc0033), var(--cr-light, #ff1a47))', transition: 'width 0.4s' }} />
                </div>
              </div>

              {w && (
                <ProjectLive
                  projectId={p.id}
                  serverNow={serverNow}
                  initial={{
                    active: w.active ? { startedAt: w.active.startedAt.toISOString(), overtime: w.active.overtime } : null,
                    lastWorkedAt: w.totals.lastWorkedAt ? w.totals.lastWorkedAt.toISOString() : null,
                    totalMinutes: w.totals.totalMinutes,
                    overtimeMinutes: w.totals.overtimeMinutes,
                    pendingOvertime: (() => {
                      const o = w.project.overtimeRequests.find((r) => r.status === 'PENDING');
                      return o ? { id: o.id, reason: o.reason, estimatedMinutes: o.estimatedMinutes, plannedFor: o.plannedFor ? o.plannedFor.toISOString() : null } : null;
                    })(),
                  }}
                />
              )}

              {p.totalCents > 0 && (
                <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <div><dt style={label}>Project total</dt><dd style={{ fontWeight: 700, marginTop: '0.3rem' }}>{formatRands(p.totalCents, p.currency)}</dd></div>
                  <div>
                    <dt style={label}>Deposit</dt>
                    <dd style={{ fontWeight: 700, marginTop: '0.3rem' }}>
                      {formatRands(p.depositCents, p.currency)}{' '}
                      <span style={{ ...mono, fontSize: '0.68rem', color: p.depositPaidAt ? '#4caf50' : '#e0a030' }}>
                        {p.depositPaidAt ? `Paid ${formatDate(p.depositPaidAt)}` : 'Due'}
                      </span>
                    </dd>
                  </div>
                  <div><dt style={label}>Balance due</dt><dd style={{ fontWeight: 700, marginTop: '0.3rem' }}>{formatRands(balance, p.currency)}</dd></div>
                </dl>
              )}

              <div style={{ marginTop: '1.8rem' }}>
                <h3 style={{ ...label, marginBottom: '1rem' }}>Updates</h3>
                {p.updates.length === 0 ? (
                  <p style={{ color: 'var(--cr-muted)', fontSize: '0.85rem' }}>No updates yet. They will appear here as work happens.</p>
                ) : (
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderLeft: '1px solid #2a2a2a' }}>
                    {p.updates.map((u) => (
                      <li key={u.id} style={{ position: 'relative', padding: '0 0 1.4rem 1.2rem' }}>
                        <span aria-hidden style={{ position: 'absolute', left: '-5px', top: '0.35rem', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--cr-light, #ff1a47)' }} />
                        <div style={{ ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)' }}>
                          {formatDateTime(u.createdAt)}{u.progress !== null ? ` · ${u.progress}% complete` : ''}
                        </div>
                        <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{u.title}</div>
                        {u.body && <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.7, marginTop: '0.3rem', whiteSpace: 'pre-line' }}>{u.body}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {w && (
                <details style={{ marginTop: '1.6rem', borderTop: '1px solid #242424', paddingTop: '1.1rem' }}>
                  <summary style={{ ...label, cursor: 'pointer' }}>Activity log ({w.project.logEntries.length})</summary>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                    <a href={'/api/client/projects/' + p.id + '/worklog?format=pdf'} style={dl}>Download PDF</a>
                    <a href={'/api/client/projects/' + p.id + '/worklog?format=csv'} style={dl}>Download CSV</a>
                  </div>
                  {w.project.logEntries.length === 0 ? (
                    <p style={{ color: 'var(--cr-muted)', fontSize: '0.85rem' }}>Nothing recorded yet. Everything done on your project is logged here automatically.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {w.project.logEntries.slice(0, 40).map((e) => (
                        <li key={e.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 160px) 1fr', gap: '0.8rem', padding: '0.45rem 0', borderTop: '1px solid #1f1f1f', fontSize: '0.85rem' }}>
                          <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)' }}>{formatDateTime(e.createdAt)}</span>
                          <span style={{ color: '#ccc' }}>{e.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {w.project.logEntries.length > 40 && <p style={{ ...mono, fontSize: '0.7rem', color: 'var(--cr-muted)', marginTop: '0.8rem' }}>Showing the latest 40. Download the full log above.</p>}
                </details>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
