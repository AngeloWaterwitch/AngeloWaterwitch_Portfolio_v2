import type { Metadata } from 'next';
import { LegalPage, H2, P, UL, A } from '@/components/legal/LegalPage';
import { loadPolicyContext, POLICY_UPDATED } from '@/lib/legal/site-policies';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms for using the Angelo Waterwitch portfolio website and client portal, governed by the laws of South Africa.',
  alternates: { canonical: '/terms' },
};

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const c = await loadPolicyContext();
  return (
    <LegalPage title="Terms of Use" updated={POLICY_UPDATED}>
      <P>By using this website you agree to these terms. If you do not agree, please do not use the site.</P>

      <H2>1. Who we are</H2>
      <P>
        This site is operated by <strong>{c.owner}</strong>, trading as <strong>{c.trading}</strong>, based in {c.city}, {c.province}, South Africa.
        {c.email ? <> Email: <A href={`mailto:${c.email}`}>{c.email}</A>.</> : null} A full physical address is given in every quote and agreement and is available on request.
      </P>

      <H2>2. What this site is</H2>
      <P>
        This is a personal portfolio that presents work, skills and services. Nothing here is an offer that can be accepted by simply using the site. Work is only agreed through a
        written quote and agreement, which you accept electronically. Where an agreement exists, it takes priority over these terms if the two differ.
      </P>

      <H2>3. Intellectual property</H2>
      <P>
        The design, text, code, graphics and other content of this site belong to {c.owner} or are used with permission, and are protected by copyright. Work shown for clients
        belongs to those clients or is shown with their permission. You may view the site and share its pages, but you may not copy, resell or republish its content, or present it
        as your own, without written permission.
      </P>

      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>try to break into, overload or disrupt the site, the client portal or the admin area;</li>
        <li>use automated tools to scrape the site, send spam or submit false information;</li>
        <li>submit anything unlawful, defamatory, abusive or that infringes someone else&apos;s rights.</li>
      </UL>

      <H2>5. Messages and testimonials you send</H2>
      <P>
        What you send through the contact form, CV request or testimonial form must be true and yours to share. Testimonials are reviewed before they are published, and we may edit
        for length, decline or remove any of them. By submitting one you allow us to publish it, with your name and role, on this site. You can ask for it to be removed at any time.
      </P>

      <H2>6. Links to other websites</H2>
      <P>This site may link to other websites, such as social profiles. We do not control them and are not responsible for their content or privacy practices.</P>

      <H2>7. No guarantee, and limits on liability</H2>
      <P>
        We work to keep the information here accurate and the site available, but it is provided &quot;as is&quot;. Information may be out of date, and the site may be briefly
        unavailable. Nothing here is professional advice. To the fullest extent the law allows, {c.owner} is not liable for any loss arising from your use of, or inability to use,
        this site. Nothing in these terms excludes or limits any liability, or any right you have, that cannot lawfully be excluded, including under the Consumer Protection Act 68 of 2008.
      </P>

      <H2>8. Privacy</H2>
      <P>Our <A href="/privacy">Privacy Policy</A> explains how personal information is handled and forms part of these terms.</P>

      <H2>9. Complaints and infringement notices</H2>
      <P>
        If you believe something on this site infringes your rights, or you have any complaint, email {c.email ? <A href={`mailto:${c.email}`}>{c.email}</A> : 'the address above'} with the page, what the
        problem is and how to reach you. We will look into it promptly and remove content that should not be here.
      </P>

      <H2>10. Changes to these terms</H2>
      <P>We may update these terms. The version published here, with the date at the top, is the one that applies. Continued use of the site after a change means you accept it.</P>

      <H2>11. Governing law</H2>
      <P>These terms are governed by the laws of the Republic of South Africa, and the South African courts have jurisdiction over any dispute arising from them.</P>
    </LegalPage>
  );
}
