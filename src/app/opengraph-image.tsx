import { ImageResponse } from 'next/og';

// The picture shown when the site is shared on WhatsApp, LinkedIn, Facebook and similar.
export const alt = 'Angelo Waterwitch — Web Developer & Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '80px', background: '#0a0a0a', color: '#f0ede8',
          backgroundImage: 'radial-gradient(circle at 85% 20%, #5a1020 0%, #0a0a0a 55%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: '#ff1a47', letterSpacing: 6, textTransform: 'uppercase' }}>
          <div style={{ width: 60, height: 3, background: '#ff1a47', marginRight: 20 }} />
          Software &amp; Design Engineer
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1.02, marginTop: 28, display: 'flex', flexDirection: 'column' }}>
          <span>Angelo</span>
          <span style={{ color: '#ff1a47' }}>Waterwitch</span>
        </div>
        <div style={{ fontSize: 30, color: '#9a9a9a', marginTop: 36 }}>Websites &amp; web apps · Springbok, South Africa</div>
      </div>
    ),
    { ...size },
  );
}
