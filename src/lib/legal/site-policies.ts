import { prisma } from '@/lib/prisma';

export const POLICY_UPDATED = '20 October 2026';

export type PolicyContext = {
  owner: string;
  trading: string;
  city: string;
  province: string;
  email: string;
  officerName: string;
  officerEmail: string;
};

/** Who the policies talk about. Taken from the saved Business & Legal details, with safe fallbacks if they are missing. */
export async function loadPolicyContext(): Promise<PolicyContext> {
  const fallback: PolicyContext = {
    owner: 'Angelo Waterwitch', trading: 'Waterwitch Web Studio', city: 'Springbok', province: 'Northern Cape',
    email: '', officerName: 'Angelo Waterwitch', officerEmail: '',
  };
  try {
    const [b, c] = await Promise.all([prisma.businessProfile.findFirst(), prisma.contactInfo.findFirst()]);
    return {
      owner: b?.legalName || fallback.owner,
      trading: b?.tradingName || fallback.trading,
      city: b?.city || fallback.city,
      province: b?.province || fallback.province,
      email: b?.email || c?.email || '',
      officerName: b?.informationOfficerName || b?.legalName || fallback.officerName,
      officerEmail: b?.informationOfficerEmail || b?.email || c?.email || '',
    };
  } catch {
    return fallback;
  }
}
