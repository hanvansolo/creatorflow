// @ts-nocheck
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #18181b 50%, #0a0a0a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 900,
              color: '#fafafa',
            }}
          >
            FF
          </div>
          <span style={{ fontSize: '48px', fontWeight: 900, color: '#fafafa' }}>
            Footy Feed
          </span>
        </div>
        <span style={{ fontSize: '24px', color: '#a1a1aa', maxWidth: '600px', textAlign: 'center' }}>
          Football news that gets straight to the point. Live scores, match stats, league tables, and AI predictions.
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
