export type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'numbered'; items: string[] }
  | { kind: 'rows'; rows: [string, string][] };

export type DocSection = { heading?: string; blocks: DocBlock[] };

export type DocContent = {
  title: string;
  subtitle?: string;
  meta?: [string, string][];
  sections: DocSection[];
  /** Footer line printed on every page (set when the document is issued). */
  footer?: string;
  /** The amounts the document was issued with, so we can tell when the project has changed since. */
  snapshot?: { title: string; totalCents: number; depositCents: number };
};

export type DocType = 'QUOTE' | 'CONTRACT' | 'NDA' | 'PRIVACY' | 'CANCELLATION' | 'RECEIPT';

export const DOC_LABEL: Record<DocType, string> = {
  QUOTE: 'Quotation',
  CONTRACT: 'Website Development Agreement',
  NDA: 'Mutual Non-Disclosure Agreement',
  PRIVACY: 'Privacy Notice (POPIA)',
  CANCELLATION: 'Cancellation & Refund Policy',
  RECEIPT: 'Payment Receipt',
};

/** Documents the client must accept before paying the deposit. */
export const REQUIRES_ACCEPTANCE: DocType[] = ['CONTRACT', 'NDA', 'PRIVACY', 'CANCELLATION'];

/** Business details used in the documents (the BusinessProfile row). */
export type Business = {
  tradingName: string;
  legalName: string;
  idOrRegNumber: string;
  address: string;
  city: string;
  province: string;
  email: string;
  phone: string;
  vatRegistered: boolean;
  vatNumber: string | null;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  informationOfficerName: string;
  informationOfficerEmail: string;
};

export type LegalClient = { name: string; email: string; phone: string | null; company: string | null };

export type LegalProject = {
  title: string;
  description: string;
  totalCents: number;
  depositCents: number;
  currency: string;
};

export type LegalContext = {
  business: Business;
  client: LegalClient;
  project: LegalProject;
  issuedAt: Date;
  reference: string;
};
