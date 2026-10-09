# Setting up voice & video calls (LiveKit Cloud, free)

Chat works without this. Calls stay switched off (the Voice/Video buttons are hidden) until these three settings exist.

## 1. Create the LiveKit project (about 5 minutes, no credit card)

1. Go to https://cloud.livekit.io and sign up.
2. Create a project (name it anything, for example `portfolio`).
3. Open **Settings → Keys** and create an API key.
4. Copy three values:
   - **WebSocket URL**, looks like `wss://your-project.livekit.cloud`
   - **API Key**
   - **API Secret** (shown once. Keep it private.)

The free "Build" plan includes 5,000 participant-minutes per month (a 1-hour call between you and one client uses 120), 50 GB of data, and needs no card.

## 2. Add them to Vercel

Settings → Environment Variables. Add all three, with **Production**, **Preview** and **Development** ticked. Paste each value with **no quotes and no spaces**:

| Name | Value |
|------|-------|
| `LIVEKIT_URL` | the `wss://...livekit.cloud` address |
| `LIVEKIT_API_KEY` | the API key |
| `LIVEKIT_API_SECRET` | the API secret |

Then **redeploy** (Vercel only applies new variables to new builds).

For local testing add the same three lines to `.env.local` (quotes are fine in that file).

## 3. Speed tip (recommended)

Vercel → Settings → Functions → set the region to **Dublin (dub1)** or London, next to your Supabase database in Ireland. Every database query gets faster, which makes chat and the dashboard feel much quicker.

## How it behaves

- **Chat** is instant on both sides and works on phones and computers. It also checks every 10 seconds in case instant updates are blocked.
- **Calls ring while the page is open** on the other person's screen (phone or computer). If their browser is closed they get a "missed call" note in the chat. When the client messages you while you are away, you get an email (at most one every 15 minutes per client).
- Browsers ask for microphone/camera permission the first time. Calls need HTTPS, which your live site has.
- Only one call per client at a time. A call nobody answers within 45 seconds becomes a missed call.
- Everything ends when you mark the contract finished or cancelled.
