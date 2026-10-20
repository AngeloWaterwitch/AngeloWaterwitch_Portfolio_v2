# Getting found on Google, and staying legally covered

## What the site now does by itself

- `/sitemap.xml` lists the public pages (home, privacy, terms). Private areas are left out.
- `/robots.txt` tells search engines to skip `/admin`, `/client` and `/api`.
- Every page has a title, description and canonical link. Sharing the site on WhatsApp, LinkedIn or Facebook shows a branded preview picture.
- The home page carries structured data (schema.org `Person` and `WebSite`) that tells Google who you are, where you are, and which profiles are yours (LinkedIn, GitHub, Facebook, Instagram). This is the main thing that helps a search for your name.
- `/privacy` (POPIA privacy policy) and `/terms` (website terms of use) are public pages, linked from the footer. They read your name, location and Information Officer from the Business & Legal tab. Contact and CV forms point to the privacy policy.

The address used in the sitemap and canonical links comes from `NEXTAUTH_URL` on Vercel. If you add a custom domain later, change that one setting (and redeploy) and everything follows.

## 1. Google Search Console (about 10 minutes)

1. Go to https://search.google.com/search-console and sign in with your Google account.
2. Add property -> **URL prefix** -> paste your live address, for example `https://angelo-waterwitch-portfolio-v2.vercel.app`.
3. Choose the **HTML tag** verification method. Google shows a tag like `<meta name="google-site-verification" content="XXXXXXXX" />`.
4. Copy **only the value inside content="..."**. On Vercel add `GOOGLE_SITE_VERIFICATION` with that value (no quotes, no spaces), ticked for Production, then **redeploy**.
5. Back in Search Console press **Verify**.
6. Open **Sitemaps**, type `sitemap.xml` and press Submit. It should say Success.
7. Open **URL inspection**, paste your home address, and press **Request indexing**.

Indexing usually starts within days. Searching for your exact name may take a few weeks to show the site on the first page.

## 2. Showing up when someone searches your name

- Keep your name written the same way everywhere: **Angelo Waterwitch**.
- Make sure your **LinkedIn, GitHub, Facebook and Instagram** profiles use that name and link back to the site. Google trusts a site more when profiles you own point to it.
- Link to the site from anywhere you control: your GitHub profile README, LinkedIn "Website" field, social bios, email signature, CV.
- A **custom domain** (for example `angelowaterwitch.co.za`) helps a lot over time, because it is yours for good and easy to remember. It can wait.

## 3. Google Business Profile

You only need one if you want to appear on Google Maps for local searches such as "web developer Springbok".

- It needs a real address or a defined service area, and Google verifies it (video or postcard).
- Because you work from home, choose **service-area business** and hide the street address, so your home address is not public.
- It is optional. For a search on your own name it matters much less than the steps above. Create it later if you want local clients.

## 4. The legal side

What is in place: a POPIA-based privacy policy, website terms, consent notices on every form, a separate client Privacy Notice, agreement, NDA and cancellation policy for clients, and a client delete-my-data and download-my-data feature.

Things to do or know:

- **Have a South African attorney review the Privacy Policy, Terms, and the client documents once.** These are carefully written templates, not legal advice, and nothing can promise that nobody will ever bring a claim. A review is the single best protection and is usually a modest, once-off cost.
- Register your **Information Officer** with the Information Regulator (free, online at https://inforegulator.org.za). POPIA expects this, and you are your own Information Officer.
- Only show **work you have permission to show**. Client logos, screenshots and names on your portfolio should be used with that client's agreement.
- Only use **images, icons and fonts you are licensed to use**. Your icons are made in-house. Google Fonts are free for commercial use.
- Keep the **cookie position simple**: the site uses no advertising or analytics cookies. If you ever add Google Analytics, a Facebook pixel or similar, tell me first so the policy and a consent banner are updated before it goes live.
- Fonts load from Google, which means a visitor's IP address is shared with Google. The privacy policy discloses this.

## 5. After deploying

1. Open `/sitemap.xml`, `/robots.txt`, `/privacy` and `/terms` on the live site.
2. Share the home address in a WhatsApp chat and check the preview picture and title look right.
3. Test a page at https://search.google.com/test/rich-results to confirm the structured data is read.
