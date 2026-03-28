// @ts-nocheck
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const homeName = searchParams.get('home') || 'Home';
  const awayName = searchParams.get('away') || 'Away';
  const homeLogo = searchParams.get('homeLogo') || '';
  const awayLogo = searchParams.get('awayLogo') || '';
  const competition = searchParams.get('comp') || 'Football Match';
  const kickoff = searchParams.get('time') || '';
  const score = searchParams.get('score') || ''; // e.g. "2 - 1" for finished/live
  const status = searchParams.get('status') || 'scheduled'; // live, halftime, finished, scheduled
  const minute = searchParams.get('min') || '';

  const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(status);
  const isFinished = status === 'finished';

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
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
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

        {/* Competition name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              color: '#a1a1aa',
              fontSize: '24px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {competition}
          </span>
        </div>

        {/* Match card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '60px',
            padding: '40px 60px',
          }}
        >
          {/* Home team */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              minWidth: '200px',
            }}
          >
            {homeLogo ? (
              <img
                src={homeLogo}
                width="120"
                height="120"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '60px',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#a1a1aa',
                }}
              >
                {homeName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              style={{
                color: '#fafafa',
                fontSize: '28px',
                fontWeight: 700,
                textAlign: 'center',
                maxWidth: '240px',
              }}
            >
              {homeName}
            </span>
          </div>

          {/* Score / VS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {score ? (
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  color: '#fafafa',
                  letterSpacing: '4px',
                }}
              >
                {score}
              </span>
            ) : (
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#52525b',
                }}
              >
                VS
              </span>
            )}

            {/* Status badge */}
            {isLive && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#dc2626',
                  borderRadius: '20px',
                  padding: '6px 20px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '5px',
                    background: '#fafafa',
                  }}
                />
                <span
                  style={{
                    color: '#fafafa',
                    fontSize: '20px',
                    fontWeight: 700,
                  }}
                >
                  LIVE {minute ? `${minute}'` : ''}
                </span>
              </div>
            )}
            {isFinished && (
              <span
                style={{
                  color: '#a1a1aa',
                  fontSize: '20px',
                  fontWeight: 600,
                  background: '#27272a',
                  borderRadius: '20px',
                  padding: '6px 20px',
                }}
              >
                FULL TIME
              </span>
            )}
            {!isLive && !isFinished && kickoff && (
              <span
                style={{
                  color: '#10b981',
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              >
                {kickoff}
              </span>
            )}
          </div>

          {/* Away team */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              minWidth: '200px',
            }}
          >
            {awayLogo ? (
              <img
                src={awayLogo}
                width="120"
                height="120"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '60px',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#a1a1aa',
                }}
              >
                {awayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              style={{
                color: '#fafafa',
                fontSize: '28px',
                fontWeight: 700,
                textAlign: 'center',
                maxWidth: '240px',
              }}
            >
              {awayName}
            </span>
          </div>
        </div>

        {/* Footy Feed branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 800,
              color: '#fafafa',
            }}
          >
            FF
          </div>
          <span
            style={{
              color: '#71717a',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            footy-feed.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
