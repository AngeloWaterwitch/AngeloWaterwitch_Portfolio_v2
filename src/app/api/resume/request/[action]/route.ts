import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
 
const resend = new Resend(process.env.RESEND_API_KEY);
 
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
 
async function generateSignedUrl(fileUrl: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    console.log('[signedUrl] fileUrl:', fileUrl);
 
    // Bucket is 'portfolio', path inside is 'resume/filename.pdf'
    const match = fileUrl.match(/\/object\/(?:public|sign)\/portfolio\/(.+)$/);
    console.log('[signedUrl] match:', match);
 
    if (!match) return null;
    const storagePath = match[1];
    console.log('[signedUrl] storagePath:', storagePath);
 
    const { data, error } = await supabase.storage
      .from('portfolio')
      .createSignedUrl(storagePath, 60 * 60 * 48);
 
    console.log('[signedUrl] data:', JSON.stringify(data), 'error:', JSON.stringify(error));
 
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch (err) {
    console.error('[signedUrl] exception:', err);
    return null;
  }
}
 
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const token = req.nextUrl.searchParams.get('token');
 
  if (!token || !['approve', 'deny'].includes(action)) {
    return new NextResponse('Invalid request.', { status: 400 });
  }
 
  try {
    const request = await prisma.resumeRequest.findUnique({ where: { token } });
 
    if (!request) {
      return new NextResponse('Request not found.', { status: 404 });
    }
    if (request.status !== 'PENDING') {
      return new NextResponse(
        `This request was already ${request.status.toLowerCase()}.`,
        { status: 409 }
      );
    }
    if (new Date() > request.tokenExpiry) {
      return new NextResponse('This link has expired.', { status: 410 });
    }
 
    if (action === 'approve') {
      const resumeFile = await prisma.resumeFile.findFirst({ where: { enabled: true } });
      console.log('[approve] resumeFile:', JSON.stringify(resumeFile));
 
      if (!resumeFile?.url) {
        return new NextResponse('No resume file is currently uploaded.', { status: 500 });
      }
 
      const signedUrl = await generateSignedUrl(resumeFile.url);
 
      if (!signedUrl) {
        return new NextResponse(
          'Could not generate a secure download link. Check that the portfolio bucket is set to private and the service role key is correct.',
          { status: 500 }
        );
      }
 
      await prisma.resumeRequest.update({
        where: { token },
        data: { status: 'APPROVED' },
      });
 
      await prisma.activityLog.create({
        data: {
          action: 'resume_approved',
          detail: `Approved CV download for ${request.email}`,
        },
      });
 
      await resend.emails.send({
        from: 'Angelo Waterwitch <onboarding@resend.dev>',
        to: request.email,
        subject: 'Your CV download is ready',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;background:#111;color:#f0ede8;border-radius:6px;">
            <h2 style="color:#22c55e;margin-top:0;">You are approved!</h2>
            <p>Hi there,</p>
            <p>Angelo has approved your CV request. Click the button below to download it.</p>
            <p style="color:#888;font-size:0.85rem;">This link is unique to you and expires in 48 hours.</p>
            <div style="margin:2rem 0;">
              <a href="${signedUrl}" style="padding:0.75rem 1.5rem;background:#ff3366;color:#fff;text-decoration:none;border-radius:4px;font-weight:700;">
                Download CV
              </a>
            </div>
            <p style="color:#555;font-size:0.75rem;">If you have any questions, feel free to reach out via the portfolio contact form.</p>
          </div>
        `,
      });
 
      return new NextResponse(`
        <html>
          <body style="font-family:sans-serif;background:#111;color:#f0ede8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="color:#22c55e;">Approved</h2>
              <p>${request.email} has been emailed a secure 48-hour download link.</p>
            </div>
          </body>
        </html>
      `, { status: 200, headers: { 'Content-Type': 'text/html' } });
 
    } else {
      await prisma.resumeRequest.update({
        where: { token },
        data: { status: 'DENIED' },
      });
 
      await prisma.activityLog.create({
        data: {
          action: 'resume_denied',
          detail: `Denied CV download for ${request.email}`,
        },
      });
 
      await resend.emails.send({
        from: 'Angelo Waterwitch <onboarding@resend.dev>',
        to: request.email,
        subject: 'Regarding your CV request',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;background:#111;color:#f0ede8;border-radius:6px;">
            <h2 style="color:#f0ede8;margin-top:0;">CV Request Update</h2>
            <p>Hi there,</p>
            <p>Thank you for your interest. Unfortunately, Angelo is not able to share his CV at this time.</p>
            <p>Feel free to reach out directly via the contact form on the portfolio.</p>
          </div>
        `,
      });
 
      return new NextResponse(`
        <html>
          <body style="font-family:sans-serif;background:#111;color:#f0ede8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="color:#ef4444;">Denied</h2>
              <p>${request.email} has been notified.</p>
            </div>
          </body>
        </html>
      `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }
 
  } catch (err) {
    console.error('[resume/request/action]', err);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}