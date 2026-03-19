import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background:
            'radial-gradient(circle at 20% 20%, #f3f8ff 0%, #d5e6ff 35%, #a8c9ff 70%, #7aa8ff 100%)',
          color: '#0f172a',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: 28,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(15,23,42,0.15)',
            }}
          >
            Progression Lab AI
          </div>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            AI chord progressions with piano and guitar voicings
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <span>Generate ideas instantly</span>
          <span>progression-lab-ai.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
