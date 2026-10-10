# Payments, documents and email: setup guide

Everything works without payments or email being set up: clients can still read, accept and download their documents in the portal, and you can still tick "Deposit received" yourself (for example for an EFT). The steps below switch on online payments and emailed documents.

## 1. Fill in your business details (5 minutes)

Admin → **Business & Legal**. These details are printed on every quote, agreement, policy and receipt. Documents cannot be created until this is saved.

## 2. PayFast (online payments)

1. Create a **sandbox** account at https://sandbox.payfast.co.za first, to test with fake money.
2. In the sandbox dashboard open **Settings → Integration** and copy the **Merchant ID** and **Merchant Key**. Set a **Passphrase** there (any long phrase) and remember it exactly.
3. In Vercel → Environment Variables (no quotes or spaces), add:

   | Name | Value |
   |------|-------|
   | `PAYFAST_MERCHANT_ID` | the Merchant ID |
   | `PAYFAST_MERCHANT_KEY` | the Merchant Key |
   | `PAYFAST_PASSPHRASE` | the passphrase, exactly as in PayFast (leave empty only if PayFast has none) |
   | `PAYFAST_MODE` | `sandbox` while testing, `live` when real |

   Tick Production and Preview, then **redeploy**.
4. In the admin go to **Business & Legal → Test PayFast connection**. It tells you in plain English whether PayFast accepts your details. A "signature does not match" message means the passphrase differs from the one in PayFast.
5. Make a test payment as a client (use PayFast's sandbox test buyer shown on its payment page). The deposit should show as paid within seconds, and a receipt should appear.
6. **Going live:** create a real PayFast account (needs your ID and bank account), copy its Merchant ID, Key and Passphrase into the same variables, set `PAYFAST_MODE` to `live`, redeploy, and run the connection test again.

`NEXTAUTH_URL` must be your real address (`https://angelo-waterwitch-portfolio-v2.vercel.app`). PayFast sends its payment confirmations to `/api/payfast/notify` on that address.

How safe is it? Card and bank details never touch your site: the client pays on PayFast's own page. A payment is only marked paid after PayFast's server confirms it to your site, and your site checks the signature, that the message really comes from PayFast, that the amount matches, and asks PayFast to confirm. The page the client returns to proves nothing on its own.

## 3. Email (so documents reach clients' inboxes)

Right now emails come from Resend's test sender, which only delivers to **your own address**. To email clients you need a domain you own:

1. Buy a domain (a `.co.za` is cheap).
2. In Resend → **Domains**, add it and add the DNS records Resend shows (SPF and DKIM). Wait until it says Verified.
3. In Vercel add `EMAIL_FROM` = `Angelo Waterwitch <hello@yourdomain.co.za>` and redeploy.

Until then, a client's documents are always available to download in their portal, and the admin shows "not emailed" with the reason.

## 4. Have an attorney review the documents (important)

The quote, agreement, NDA, privacy notice and cancellation policy are standard South African freelance templates, a careful starting point and **not legal advice**. Before your first real client signs, ask an attorney to check in particular:

1. **Non-refundable deposit** (agreement clause 10, cancellation policy): whether it holds against individual (consumer) clients under the Consumer Protection Act and the 7-day cooling-off rules of the Electronic Communications and Transactions Act, and whether the "made specially for the client" reasoning is enough.
2. **Limitation of liability** (clause 14): that it does not run into the Consumer Protection Act's list of prohibited terms.
3. **Ownership on final payment** (clause 8): that the copyright assignment is worded and accepted in the way the Copyright Act requires.
4. **Overtime** (clause 6) and the **30-day correction period** (clause 11): that these are the promises you want to make.
5. **POPIA**: the operator wording (clause 13), the cross-border transfer wording and the retention periods in the privacy notice.
6. **Interest on late payment**, the **jurisdiction** clause and the **electronic acceptance** wording (clause 16).

The text lives in `src/lib/legal/templates.ts` (the numbers, such as 2 revision rounds, are at the top in `TERMS`). Ask me to change any wording and to re-issue.

## How a new client flows

1. You create the client in **Clients** (documents are created automatically, and emailed if email is set up) and give them their access code.
2. The client signs in, reads the documents and accepts them by typing their name and ticking three boxes (including "the deposit is non-refundable once paid"). The date, time and IP address are recorded.
3. The **Pay deposit** button unlocks. After PayFast confirms, work can start and a receipt is created.
4. When you set the project to **In review**, the **Pay final balance** button unlocks. After payment, you hand over the files and go live.
5. If you change the price after documents were issued, the admin shows "out of date: re-issue". Re-issuing creates version 2 (version 1 stays on file) and the client accepts again.

## Profile, cancellation and data deletion (slice 5)

- **Client profile**: clients can edit their name, email, phone and company, download a copy of all their data (JSON), and delete their profile from the bottom of the portal.
- **Cancel a project**: each unfinished project has a "Cancel this project" button. Before the deposit is paid it costs nothing. After it, the deposit is **not refunded**, and the client must tick a box saying they understand. A Cancellation Notice is added to their documents. Pending payments, overtime requests and running work sessions are stopped.
- **Delete my profile (POPIA)**: personal details, chat, calls, work logs and updates are erased at once and access is closed. The signed agreement, quote, receipts, cancellation notices and payment records are kept for **5 years** (tax / Companies Act / CPA), then removed by "Delete expired records" on the admin Clients list.
- **Admin**: the client's Danger zone has "Erase personal data (keep records)" for client requests, and "Delete everything", which is refused while the client has payments on file.
- The privacy notice template is now version T2 and describes these rights and the 5-year retention. Have an attorney review it with the other documents.
- Database change: new nullable columns only (migration `20261013090000_add_profile_erasure`, already applied).
