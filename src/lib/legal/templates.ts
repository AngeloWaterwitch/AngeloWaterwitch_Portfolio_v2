import { formatRands } from '@/lib/format';
import type { DocContent, DocSection, LegalContext } from './types';

/**
 * Standard terms for a South African freelance web developer. They are a careful starting point, NOT legal advice:
 * have an attorney review them before real clients sign (see SETUP-LEGAL.md for the points to check).
 */
export const TERMS = {
  templateVersion: 'T2',
  revisionRounds: 2,
  quoteValidDays: 14,
  clientResponseDays: 5,
  defectDays: 30,
  ndaYears: 2,
};

const p = (text: string) => ({ kind: 'p' as const, text });
const list = (items: string[]) => ({ kind: 'list' as const, items });
const rows = (r: [string, string][]) => ({ kind: 'rows' as const, rows: r });

const longDate = (d: Date) => d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function who(c: LegalContext) {
  const b = c.business;
  const dev = b.tradingName && b.tradingName !== b.legalName ? `${b.legalName}, trading as ${b.tradingName}` : b.legalName;
  const client = c.client.company ? `${c.client.name} (${c.client.company})` : c.client.name;
  return { dev, client };
}

function money(c: LegalContext) {
  const { totalCents, depositCents, currency } = c.project;
  const pct = totalCents > 0 ? Math.round((depositCents / totalCents) * 100) : 0;
  return {
    total: formatRands(totalCents, currency),
    deposit: formatRands(depositCents, currency),
    balance: formatRands(Math.max(totalCents - depositCents, 0), currency),
    pct,
  };
}

function vatLine(c: LegalContext) {
  return c.business.vatRegistered && c.business.vatNumber
    ? `All prices include VAT where VAT applies. The Developer's VAT number is ${c.business.vatNumber}.`
    : 'The Developer is not registered for VAT, so no VAT is charged.';
}

function bankRows(c: LegalContext): [string, string][] {
  const b = c.business;
  return [
    ['Bank', b.bankName],
    ['Account holder', b.accountHolder],
    ['Account number', b.accountNumber],
    ['Branch code', b.branchCode],
    ['Account type', b.accountType],
  ].filter(([, v]) => v) as [string, string][];
}

// ─── Quotation ──────────────────────────────────────────────

export function buildQuote(c: LegalContext): DocContent {
  const { dev, client } = who(c);
  const m = money(c);
  return {
    title: 'Quotation',
    subtitle: c.project.title,
    meta: [
      ['Reference', c.reference],
      ['Date', longDate(c.issuedAt)],
      ['Valid until', longDate(addDays(c.issuedAt, TERMS.quoteValidDays))],
    ],
    sections: [
      { heading: 'Prepared for / by', blocks: [rows([['Client', client], ['Email', c.client.email], ['Prepared by', dev], ['Contact', `${c.business.email}${c.business.phone ? ' / ' + c.business.phone : ''}`]])] },
      { heading: 'The project', blocks: [p(c.project.description || 'The scope of the project is as discussed with the Client and confirmed in the Website Development Agreement.')] },
      { heading: 'Price', blocks: [rows([['Total price', m.total], [`Deposit (${m.pct}%)`, m.deposit], ['Balance', m.balance]]), p(vatLine(c))] },
      { heading: 'What is included', blocks: [list([
        'Design and development of the project described above.',
        `${TERMS.revisionRounds} rounds of changes within the agreed scope.`,
        'Testing on current phones, tablets and desktop browsers.',
        'Launch support, and correction of defects reported within ' + TERMS.defectDays + ' days of launch.',
        'Access to your private client portal with live progress, a work log, chat and calls.',
      ])] },
      { heading: 'What is not included', blocks: [list([
        'Domain name, hosting and third-party subscriptions or licences (these are paid by the Client unless agreed otherwise).',
        'Writing of text, photography, logos and other content, unless described above.',
        'Ongoing maintenance, updates and support after the correction period, unless agreed separately.',
        'Features or pages not described above. These can be quoted separately.',
      ])] },
      { heading: 'Payment', blocks: [
        list([
          `The deposit of ${m.deposit} is payable after you accept the agreement and before work starts.`,
          `The balance of ${m.balance} is payable after you approve the finished work and before the website goes live and the files are handed over.`,
          'Payment is made securely online through PayFast (card or Instant EFT) or by EFT to the account below.',
        ]),
        ...(bankRows(c).length ? [rows(bankRows(c))] : []),
      ] },
      { heading: 'Timeline', blocks: [p(`The timeline is confirmed once you accept this quotation and the deposit is paid. It depends on you providing content and feedback within ${TERMS.clientResponseDays} business days.`)] },
      { heading: 'Accepting this quotation', blocks: [p(`This quotation is valid for ${TERMS.quoteValidDays} days. You accept it by accepting the Website Development Agreement in your client portal. This quotation then forms part of that agreement.`)] },
    ],
  };
}

// ─── Website Development Agreement ──────────────────────────

export function buildContract(c: LegalContext): DocContent {
  const { dev, client } = who(c);
  const b = c.business;
  const m = money(c);
  const clause = (heading: string, ...texts: string[]): DocSection => ({ heading, blocks: texts.map(p) });

  return {
    title: 'Website Development Agreement',
    subtitle: c.project.title,
    meta: [['Reference', c.reference], ['Date', longDate(c.issuedAt)]],
    sections: [
      { heading: '1. The parties', blocks: [
        rows([['Developer', dev], ['ID / registration no.', b.idOrRegNumber], ['Address', `${b.address}, ${b.city}, ${b.province}`], ['Email', b.email]]),
        rows([['Client', client], ['Email', c.client.email], ['Phone', c.client.phone || '-']]),
        p('In this agreement "Developer" means the first party and "Client" means the second party.'),
      ] },
      clause('2. What this agreement covers',
        `The Developer will design and build the following project for the Client (the "Project"): ${c.project.title}.`,
        c.project.description ? `Description: ${c.project.description}` : 'The detailed scope is as set out in the Quotation issued with this agreement.',
        'The Quotation forms part of this agreement. Anything not described in the Quotation or this agreement is outside the Project.'),
      { heading: '3. Price and payment', blocks: [
        rows([['Total price', m.total], [`Deposit (${m.pct}%)`, m.deposit], ['Balance', m.balance]]),
        list([
          'The deposit is due after the Client accepts this agreement and before the Developer starts work.',
          'The balance is due after the Client approves the finished work and before the website goes live and the files are handed over.',
          'Payment is made through the secure payment link in the Client portal, or by EFT to the Developer\'s bank account. A payment is only received once the funds have cleared.',
          vatLine(c),
          'Overdue amounts bear interest at the rate prescribed by law from the due date until payment.',
        ]),
      ] },
      clause('4. Timeline and the Client\'s responsibilities',
        'Work starts once this agreement is accepted and the deposit is paid. Timelines are estimates and depend on the Client.',
        `The Client will provide the content, materials and decisions the Developer reasonably needs, and will give feedback within ${TERMS.clientResponseDays} business days. Delays by the Client move the timeline by the same time.`,
        'The Client approves the work in the portal or in writing. Approval means the work matches the agreed scope.'),
      clause('5. Changes and extra work',
        `The price includes ${TERMS.revisionRounds} rounds of changes within the agreed scope. A round is one consolidated set of requested changes.`,
        'Further rounds, new features, extra pages or any work outside the agreed scope are quoted separately and only start once the Client has agreed in writing (the portal chat counts as writing).'),
      clause('6. Overtime',
        'The Developer records working time in a work log that the Client can see in the portal.',
        'The Developer only works overtime (outside normal working hours) on the Project when the Client has confirmed in the portal that the Client requires it. Each confirmation is recorded in the log with its date and time.',
        'The Developer does not charge extra for overtime unless the Client has agreed the amount in writing before it is charged.'),
      clause('7. Communication and progress',
        'The Client portal shows progress, the work log, documents and payments, and offers chat and voice or video calls. The Developer replies during normal business hours. The portal is not an emergency support line.'),
      clause('8. Ownership and intellectual property',
        'The Developer owns all rights in the work until the full price has been received. Until then the Client may only review the work.',
        'Once the full price is received, the Developer assigns to the Client the copyright in the bespoke design and code created for the Project. This excludes third-party and open-source components (which stay under their own licences) and the Developer\'s own pre-existing tools, frameworks and code libraries, which the Developer licenses to the Client for use in the Project.',
        'The Developer may show the finished Project in a portfolio unless the Client objects in writing before launch.',
        'The Client confirms it owns or is allowed to use all content and materials it supplies, and that they do not infringe anyone\'s rights.'),
      clause('9. Hosting, domains and third parties',
        'Unless agreed otherwise, domain names, hosting and third-party services are the Client\'s responsibility and cost. Where possible they are registered in the Client\'s name. The Developer is not responsible for outages or changes at third-party providers.'),
      { heading: '10. Cancellation and refunds', blocks: [
        p('The Client may cancel this agreement at any time, by using the Cancel option in the portal or by written notice to the Developer.'),
        list([
          'Before the deposit is paid: the Client may cancel without paying anything.',
          `Once the deposit is paid: the deposit of ${m.deposit} is NON-REFUNDABLE. It reserves the Developer's time and pays for the start of work that is made specially for the Client. Cancelling stops all work.`,
          'After the final payment: payments are not refundable. Defects are dealt with under clause 11.',
          'On cancellation the Developer is not required to hand over unfinished work, which remains the Developer\'s property.',
          `The Developer may cancel if the Client does not pay on time, does not respond for 30 days, or breaches this agreement and does not fix it within 7 days of written notice. The deposit is then also non-refundable.`,
        ]),
        p('Nothing in this clause takes away any right the Client has by law (for example under the Consumer Protection Act or the Electronic Communications and Transactions Act) that cannot be excluded by agreement.'),
      ] },
      clause(`11. Corrections after launch`,
        `If the website does not work as described in the agreed scope, the Client can report it within ${TERMS.defectDays} days of launch and the Developer will fix it at no extra charge. Later fixes, updates and maintenance are by separate agreement.`),
      clause('12. Confidentiality',
        'Each party keeps the other\'s confidential information private and uses it only for the Project. If a separate Non-Disclosure Agreement has been accepted, it applies as well.'),
      clause('13. Personal information (POPIA)',
        'The Developer processes the Client\'s personal information as set out in the Privacy Notice.',
        'If the Project handles personal information of the Client\'s own customers or visitors (for example contact forms or orders), the Client is the responsible party and the Developer is an operator. The Developer will process that information only on the Client\'s instructions for the Project, keep it secure, tell the Client without undue delay if it is compromised, and return or delete it on request, subject to the law. The Client is responsible for the legal notices and consents its own website needs.'),
      clause('14. Liability',
        'To the extent the law allows, the Developer\'s total liability under this agreement is limited to the amount the Client has paid, and the Developer is not liable for indirect or consequential loss or lost profits, or for failures of third-party services.'),
      clause('15. Breach and ending the agreement',
        'If a party materially breaches this agreement and does not fix it within 7 days of written notice, the other party may end it. Clause 10 then applies to payments.'),
      clause('16. Electronic acceptance',
        'This agreement is concluded electronically. The Client accepts it by typing its full name and ticking the confirmation boxes in the portal. The date, time, IP address and device details are recorded as evidence of acceptance. Electronic acceptance has the same effect as a signature.'),
      clause('17. General',
        'This agreement, the Quotation and the documents it refers to are the whole agreement. Changes must be in writing (email or portal chat). A party who does not enforce a right does not give it up. If a part is found unenforceable the rest stays in force. Notices are sent to the email addresses above.',
        `This agreement is governed by the laws of the Republic of South Africa and the courts of ${b.province} have jurisdiction. The parties will first try to settle a dispute by talking in good faith, and then by mediation, before going to court.`),
      { heading: 'Signed', blocks: [
        rows([['For the Developer', `${b.legalName}, ${longDate(c.issuedAt)}`], ['For the Client', 'Accepted electronically in the portal (see the record below once accepted)']]),
      ] },
    ],
  };
}

// ─── Mutual NDA ─────────────────────────────────────────────

export function buildNda(c: LegalContext): DocContent {
  const { dev, client } = who(c);
  const clause = (heading: string, ...texts: string[]): DocSection => ({ heading, blocks: texts.map(p) });
  return {
    title: 'Mutual Non-Disclosure Agreement',
    subtitle: c.project.title,
    meta: [['Reference', c.reference], ['Date', longDate(c.issuedAt)]],
    sections: [
      { heading: 'Parties', blocks: [rows([['First party', dev], ['Second party', client]])] },
      clause('1. Purpose', 'The parties will share confidential information so that the Developer can build the Project "' + c.project.title + '".'),
      clause('2. Confidential information', 'This means non-public information one party gives the other about its business, customers, plans, designs, code, accounts or passwords, whether written, spoken or electronic, that is marked confidential or would reasonably be understood to be.'),
      clause('3. What each party must do', 'Keep the information secret, use it only for the Project, and share it only with people who need it for the Project and are bound to keep it secret.'),
      clause('4. What is not confidential', 'Information that is public (not through a breach), already known to the receiving party, received lawfully from someone else, or developed independently. A party may disclose information when the law or a court requires it, after telling the other party where it can.'),
      clause('5. Return and deletion', 'On request or when the Project ends, each party returns or deletes the other\'s confidential information, except copies it must keep by law.'),
      clause('6. How long it lasts', `These duties last for ${TERMS.ndaYears} years from the date above. Passwords and trade secrets stay protected for as long as they remain secret.`),
      clause('7. General', 'This agreement is governed by the laws of South Africa. It is accepted electronically in the client portal, and the recorded date, time and IP address are evidence of acceptance.'),
    ],
  };
}

// ─── Privacy Notice (POPIA) ─────────────────────────────────

export function buildPrivacy(c: LegalContext): DocContent {
  const b = c.business;
  const { dev } = who(c);
  const clause = (heading: string, ...texts: string[]): DocSection => ({ heading, blocks: texts.map(p) });
  return {
    title: 'Privacy Notice',
    subtitle: 'How we handle your personal information (POPIA)',
    meta: [['Reference', c.reference], ['Date', longDate(c.issuedAt)]],
    sections: [
      { heading: 'Who is responsible', blocks: [rows([['Responsible party', dev], ['Address', `${b.address}, ${b.city}, ${b.province}`], ['Information Officer', `${b.informationOfficerName} (${b.informationOfficerEmail})`]])] },
      clause('What we collect', 'Your name, email address, phone number and company; details about your project and payments; messages and call details (time and length, not recordings) in the client portal; work log entries; and technical data such as IP address and device type when you use the portal.'),
      clause('Why we use it', 'To prepare quotes, make and carry out our agreement with you, build your project, take payments, talk to you, keep records the law requires, keep the portal secure, and protect our rights. We do not sell your information and do not use it for marketing unless you ask us to.'),
      { heading: 'Who we share it with', blocks: [p('We use these service providers (operators) who process information for us under their own security terms:'), list([
        'Vercel (website hosting) and Supabase (database, hosted in Europe).',
        'LiveKit (voice and video calls) and Resend (email).',
        'PayFast (payments). Your card or bank details go directly to PayFast and are never stored by us.',
        'Google reCAPTCHA (protects our forms against bots).',
      ]), p('Some of these providers are outside South Africa. We only use providers that protect personal information to a standard comparable to POPIA.')] },
      clause('How long we keep it', 'Project records, chat and the work log are kept while we work together and for up to 12 months afterwards, unless you ask for earlier deletion. Financial records (quotes, signed agreements, receipts and payment records) are kept for 5 years, as the law requires. After that we delete them.'),
      clause('How we protect it', 'Access to the portal needs a private access code that ends when your contract ends. Data is encrypted in transit, access is limited, and security events are logged. If your information is compromised we will tell you and the Information Regulator as the law requires.'),
      { heading: 'Your rights', blocks: [
        p('You may ask to see the information we hold about you, ask us to correct it, ask us to delete it, object to its use, or withdraw consent where we rely on it.'),
        list([
          'In your client portal you can download all your data, correct your contact details, and delete your profile yourself.',
          'Deleting your profile erases your name, contact details, chat, calls, work logs and project updates straight away and closes your access.',
          'We must keep your signed agreement, quote, receipts and payment records for 5 years because the law requires financial records to be kept. They are locked away, used for nothing else, and deleted when the 5 years end.',
          'You can also email the Information Officer above. If you are unhappy with our answer, you may complain to the Information Regulator (inforegulator.org.za).',
        ]),
      ] },
      clause('Your consent', 'By accepting the Website Development Agreement you confirm you have read this notice and agree to us processing your information as described.'),
    ],
  };
}

// ─── Cancellation & Refund Policy ───────────────────────────

export function buildCancellation(c: LegalContext): DocContent {
  const m = money(c);
  return {
    title: 'Cancellation & Refund Policy',
    subtitle: c.project.title,
    meta: [['Reference', c.reference], ['Date', longDate(c.issuedAt)]],
    sections: [
      { heading: 'In short', blocks: [list([
        'You can cancel at any time.',
        'Before you pay the deposit: cancelling costs you nothing.',
        `After you pay the deposit (${m.deposit}): the deposit is NON-REFUNDABLE. Work stops when you cancel.`,
        'After the final payment: payments are not refundable. Problems with the work are fixed under the correction period in the agreement.',
      ])] },
      { heading: 'Why the deposit is not refundable', blocks: [p('The deposit reserves time in the Developer\'s schedule, turning other work away, and pays for the start of a website that is designed and built specially for you. That work cannot be sold to anyone else.')] },
      { heading: 'How to cancel', blocks: [p('Use the Cancel option in your client portal, or email ' + c.business.email + '. Cancelling takes effect when we receive it. Unfinished work stays with the Developer.')] },
      { heading: 'If we cancel', blocks: [p('We may cancel if payments are overdue, you do not respond for 30 days, or the agreement is breached and not fixed within 7 days of written notice. The deposit is then also non-refundable.')] },
      { heading: 'Your legal rights', blocks: [p('This policy does not take away any right you have by law (for example under the Consumer Protection Act or the Electronic Communications and Transactions Act) that cannot be excluded by agreement.')] },
    ],
  };
}

// ─── Payment receipt ────────────────────────────────────────

export type ReceiptInfo = {
  receiptNo: string;
  kind: 'DEPOSIT' | 'FINAL';
  amountCents: number;
  paidAt: Date;
  providerRef: string | null;
  paidToDateCents: number;
};

export function buildReceipt(c: LegalContext, r: ReceiptInfo): DocContent {
  const { dev, client } = who(c);
  const cur = c.project.currency;
  const balance = Math.max(c.project.totalCents - r.paidToDateCents, 0);
  return {
    title: 'Payment Receipt',
    subtitle: c.project.title,
    meta: [['Receipt no.', r.receiptNo], ['Date', longDate(r.paidAt)]],
    sections: [
      { heading: 'Details', blocks: [rows([
        ['Received from', client],
        ['Received by', dev],
        ['For', `${r.kind === 'DEPOSIT' ? 'Deposit' : 'Final payment'}: ${c.project.title}`],
        ['Amount received', formatRands(r.amountCents, cur)],
        ['Payment method', 'PayFast (online)'],
        ...(r.providerRef ? ([['PayFast reference', r.providerRef]] as [string, string][]) : []),
      ])] },
      { heading: 'Project account', blocks: [rows([
        ['Project total', formatRands(c.project.totalCents, cur)],
        ['Paid to date', formatRands(r.paidToDateCents, cur)],
        ['Balance remaining', formatRands(balance, cur)],
      ]), p(vatLine(c))] },
      { heading: 'Notes', blocks: [p(r.kind === 'DEPOSIT' ? 'The deposit is non-refundable as set out in the Website Development Agreement and Cancellation & Refund Policy.' : 'Thank you. The files are handed over and the website goes live after final payment, as set out in the agreement.')] },
    ],
  };
}

// ─── Cancellation notice ────────────────────────────────────

export type CancellationInfo = {
  cancelledAt: Date;
  by: 'CLIENT' | 'ADMIN';
  reason: string;
  depositPaidAt: Date | null;
  paidToDateCents: number;
};

/** A record of a cancellation, given to the client, stating plainly what happens to the money. */
export function buildCancellationNotice(c: LegalContext, i: CancellationInfo): DocContent {
  const { dev, client } = who(c);
  const cur = c.project.currency;
  const m = money(c);
  const depositPaid = !!i.depositPaidAt;
  return {
    title: 'Cancellation Notice',
    subtitle: c.project.title,
    meta: [['Reference', c.reference], ['Date', longDate(i.cancelledAt)]],
    sections: [
      { heading: 'What was cancelled', blocks: [rows([
        ['Project', c.project.title],
        ['Client', client],
        ['Developer', dev],
        ['Cancelled by', i.by === 'CLIENT' ? 'The client, through the client portal' : 'The Developer'],
      ]), ...(i.reason ? [p('Reason given: ' + i.reason)] : [])] },
      { heading: 'Payments', blocks: depositPaid
        ? [
            rows([['Deposit paid', formatRands(c.project.depositCents, cur)], ['Deposit paid on', longDate(i.depositPaidAt!)], ['Total paid to date', formatRands(i.paidToDateCents, cur)], ['Refund', 'None']]),
            p('The deposit was paid before this cancellation, so it is non-refundable, as set out in clause 10 of the Website Development Agreement and in the Cancellation & Refund Policy that the client accepted. No further amount is owed for the cancelled work.'),
          ]
        : [
            rows([['Deposit paid', 'None'], ['Amount owed', formatRands(0, cur)]]),
            p('No deposit had been paid, so the cancellation costs the client nothing and nothing is owed.'),
          ] },
      { heading: 'What happens now', blocks: [list([
        'All work on the project has stopped.',
        'Unfinished work stays with the Developer and is not handed over.',
        'Any payment that was still pending has been cancelled.',
        `The agreed total of ${m.total} is no longer payable.`,
        'The client can keep using the portal to download documents and to download or delete their data.',
      ])] },
      { heading: 'Your legal rights', blocks: [p('This notice does not take away any right you have by law that cannot be excluded by agreement.')] },
    ],
  };
}
