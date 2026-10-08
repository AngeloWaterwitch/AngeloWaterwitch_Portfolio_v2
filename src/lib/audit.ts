import { prisma } from '@/lib/prisma';

type Actor = 'ADMIN' | 'CLIENT' | 'SYSTEM';

/** Records a security-relevant event. Never throws: logging must not break the action it describes. */
export async function audit(actorType: Actor, actorId: string | null, action: string, detail?: Record<string, unknown>, ip?: string) {
  try {
    await prisma.auditLog.create({
      data: { actorType, actorId, action, detail: (detail ?? undefined) as any, ip: ip ?? null },
    });
  } catch (err) {
    console.error('[audit] failed to record', action, (err as Error).message);
  }
}
