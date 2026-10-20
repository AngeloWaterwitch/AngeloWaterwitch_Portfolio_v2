import type { Metadata } from 'next';
import { LegalPage, H2, P, UL, A } from '@/components/legal/LegalPage';
import { loadPolicyContext, POLICY_UPDATED } from '@/lib/legal/site-policies';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Angelo Waterwitch collects, uses and protects personal information on this website, under South Africa’s Protection of Personal Information Act (POPIA).',
  alternates: { canonical: '/privacy' },
};

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const c = await loadPolicyContext();
  return (
    <LegalPage title="Privacy Policy" updated={POLICY_UPDATED}>
      <P>
        This policy explains what personal information this website collects, why, who it is shared with, and the rights you have. It applies to this website and to the
        client portal. It is written to comply with South Africa&apos;s Protection of Personal Information Act 4 of 2013 (POPIA).
      </P>

      <H2>1. Who is responsible</H2>
      <P>
        The responsible party is <strong>{c.owner}</strong>, trading as <strong>{c.trading}</strong>, based in {c.city}, {c.province}, South Africa.
      </P>
      <P>
        Information Officer: <strong>{c.officerName}</strong>{c.officerEmail ? <> &ndash; <A href={`mailto:${c.officerEmail}`}>{c.officerEmail}</A></> : null}. Send any privacy question or request to the Information Officer.
      </P>

      <H2>2. What we collect, and why</H2>
      <UL>
        <li><strong>Contact form:</strong> your name, email address and message. Used only to reply to you.</li>
        <li><strong>CV requests:</strong> your name, email address and your reason for asking. Used to send you a download link and to see who has requested it.</li>
        <li><strong>Testimonials:</strong> your name, role or company and your words. Published on this site only after approval, and removed if you ask.</li>
        <li>
          <strong>Client portal (clients only):</strong> your contact details, projects, payments, messages, call records, work logs and signed documents.
          Clients are given a separate Privacy Notice that explains this in detail.
        </li>
        <li>
          <strong>Technical information:</strong> your IP address, browser type and the pages requested. This is recorded by our hosting provider in routine server logs, and
          used briefly to keep the site secure and to limit abuse, such as repeated sign-in attempts or spam.
        </li>
      </UL>
      <P>
        We do not run advertising or analytics trackers on this site, we do not sell personal information, and we do not use it to make automated decisions about you.
      </P>

      <H2>3. Legal basis</H2>
      <P>
        We process personal information because you consented by sending it to us (contact form, CV request, testimonial); because it is needed to take steps toward or perform a
        contract with you; because the law requires it (for example tax and accounting records); or because of our legitimate interest in keeping the site secure.
      </P>

      <H2>4. Who we share it with</H2>
      <P>We do not share your information for marketing. It is processed on our behalf by these service providers (&quot;operators&quot;), only to run the site:</P>
      <UL>
        <li><strong>Vercel</strong> &ndash; website hosting.</li>
        <li><strong>Supabase</strong> &ndash; database and live messaging (data stored in Ireland, EU).</li>
        <li><strong>Resend</strong> &ndash; sending email.</li>
        <li><strong>Upstash</strong> &ndash; short-term request counting for abuse protection.</li>
        <li><strong>Google</strong> &ndash; reCAPTCHA spam protection, and web fonts.</li>
        <li><strong>LiveKit</strong> &ndash; voice and video calls in the client portal.</li>
        <li><strong>PayFast</strong> &ndash; card and EFT payments (clients only). We never see or store card numbers.</li>
      </UL>
      <P>
        Some of these providers are outside South Africa, so your information may be transferred abroad. Where that happens we rely on providers that are bound by contract or by
        law to protect it to a level comparable to POPIA, as POPIA section 72 requires. We may also disclose information where the law or a court requires it.
      </P>

      <H2>5. Cookies</H2>
      <UL>
        <li><strong>Strictly necessary:</strong> sign-in session cookies for the client portal and admin area. They are used only to keep you signed in and expire automatically.</li>
        <li><strong>Google reCAPTCHA:</strong> used on forms to tell people from bots. It may set cookies and collects information about your device and how you interact with the page. This is protected by the <A href="https://policies.google.com/privacy">Google Privacy Policy</A> and <A href="https://policies.google.com/terms">Terms of Service</A>.</li>
        <li>No advertising or tracking cookies are used.</li>
      </UL>

      <H2>6. How long we keep it</H2>
      <UL>
        <li>Contact messages and CV requests: kept until dealt with and for up to 12 months after.</li>
        <li>Testimonials: kept while published, and removed on request.</li>
        <li>Client records: kept while we work together and for up to 12 months after. Signed agreements, quotes, receipts and payment records are kept for 5 years, because South African tax and company law require it, and are then deleted.</li>
        <li>Server logs: kept only for a short period by the hosting provider.</li>
      </UL>

      <H2>7. How we protect it</H2>
      <P>
        Information is sent over encrypted connections, access to the admin area needs a strong password and bot protection, client access is by a private code that expires when the
        work ends, and every provider listed above is a reputable, security-certified service. No system is perfectly secure; if there is a breach that puts your information at
        risk, we will notify you and the Information Regulator as POPIA requires.
      </P>

      <H2>8. Your rights</H2>
      <P>Under POPIA you may ask us to:</P>
      <UL>
        <li>tell you what personal information we hold about you, and give you a copy;</li>
        <li>correct information that is wrong or out of date;</li>
        <li>delete information we no longer need or are not allowed to keep (clients can also do this themselves in the portal, where they can download their data too);</li>
        <li>stop using your information, or withdraw a consent you gave, at any time. Withdrawing does not affect what was done before.</li>
      </UL>
      <P>
        Email the Information Officer above and we will respond within a reasonable time. If you are unhappy with how your information is handled, you may complain to the
        Information Regulator of South Africa: <A href="https://inforegulator.org.za">inforegulator.org.za</A>, complaints: <A href="mailto:complaints.IR@justice.gov.za">complaints.IR@justice.gov.za</A>.
      </P>

      <H2>9. Children</H2>
      <P>This site is not meant for anyone under 18, and we do not knowingly collect information from children.</P>

      <H2>10. Changes</H2>
      <P>If this policy changes, the new version will be published here with a new date at the top.</P>
    </LegalPage>
  );
}
