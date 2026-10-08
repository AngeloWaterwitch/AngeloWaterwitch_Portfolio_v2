import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { loadWorkData, toCsv, toPdf } from '@/lib/worklog';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const data = await loadWorkData(id, false);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const slug = data.project.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'project';
  const format = req.nextUrl.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';

  if (format === 'pdf') {
    const pdf = await toPdf(data);
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="work-log-${slug}.pdf"`, 'Cache-Control': 'no-store' },
    });
  }
  return new NextResponse(toCsv(data), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="work-log-${slug}.csv"`, 'Cache-Control': 'no-store' },
  });
}
