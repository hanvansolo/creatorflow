import { NextRequest } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';

/**
 * Runs a cron job directly by importing and calling the route handler.
 * This avoids the unreliable self-fetch pattern.
 */
export async function runCronJob(jobName: string): Promise<{ success: boolean; result: unknown }> {
  const secret = CRON_SECRET;
  // Add ?force=true so manual "Run Now" bypasses timezone/schedule filters
  const fakeUrl = `http://localhost/api/cron/${secret}/${jobName}?force=true`;
  const request = new NextRequest(fakeUrl);
  const params = Promise.resolve({ secret });

  try {
    let response: Response;

    switch (jobName) {
      case 'aggregate': {
        const { GET } = await import('@/app/api/cron/[secret]/aggregate/route');
        response = await GET(request, { params });
        break;
      }
      case 'weather': {
        const { GET } = await import('@/app/api/cron/[secret]/weather/route');
        response = await GET(request, { params });
        break;
      }
      case 'data-sync': {
        const { GET } = await import('@/app/api/cron/[secret]/data-sync/route');
        response = await GET(request, { params });
        break;
      }
      case 'ai-analysis': {
        const { GET } = await import('@/app/api/cron/[secret]/ai-analysis/route');
        response = await GET(request, { params });
        break;
      }
      case 'predictions': {
        const { GET } = await import('@/app/api/cron/[secret]/predictions/route');
        response = await GET(request, { params });
        break;
      }
      case 'youtube': {
        const { GET } = await import('@/app/api/cron/[secret]/youtube/route');
        response = await GET(request, { params });
        break;
      }
      case 'roundup': {
        const { GET } = await import('@/app/api/cron/[secret]/roundup/route');
        response = await GET(request, { params });
        break;
      }
      case 'fluctuate-votes': {
        const { GET } = await import('@/app/api/cron/[secret]/fluctuate-votes/route');
        response = await GET(request, { params });
        break;
      }
      case 'match-regulations': {
        const { GET } = await import('@/app/api/cron/[secret]/match-regulations/route');
        response = await GET(request, { params });
        break;
      }
      case 'detect-incidents': {
        const { GET } = await import('@/app/api/cron/[secret]/detect-incidents/route');
        response = await GET(request, { params });
        break;
      }
      case 'generate-preview': {
        const { GET } = await import('@/app/api/cron/[secret]/generate-preview/route');
        response = await GET(request, { params });
        break;
      }
      case 'update-previews': {
        const { GET } = await import('@/app/api/cron/[secret]/update-previews/route');
        response = await GET(request, { params });
        break;
      }
      case 'generate-images': {
        const { GET } = await import('@/app/api/cron/[secret]/generate-images/route');
        response = await GET(request, { params });
        break;
      }
      case 'regenerate-images': {
        // Special case: regenerate with mode=regenerate
        const regenUrl = `http://localhost/api/cron/${secret}/generate-images?mode=regenerate&limit=10`;
        const regenRequest = new NextRequest(regenUrl);
        const { GET } = await import('@/app/api/cron/[secret]/generate-images/route');
        response = await GET(regenRequest, { params });
        break;
      }
      case 'fix-images': {
        const { GET } = await import('@/app/api/cron/[secret]/fix-images/route');
        response = await GET(request, { params });
        break;
      }
      case 'respin': {
        const { GET } = await import('@/app/api/cron/[secret]/respin/route');
        response = await GET(request, { params });
        break;
      }
      case 'reseed-calendar': {
        const { GET } = await import('@/app/api/cron/[secret]/reseed-calendar/route');
        response = await GET(request, { params });
        break;
      }
      case 'email-daily': {
        const { GET } = await import('@/app/api/cron/[secret]/email-daily/route');
        response = await GET(request, { params });
        break;
      }
      case 'email-weekly': {
        const { GET } = await import('@/app/api/cron/[secret]/email-weekly/route');
        response = await GET(request, { params });
        break;
      }
      case 'email-race-reminder': {
        const { GET } = await import('@/app/api/cron/[secret]/email-race-reminder/route');
        response = await GET(request, { params });
        break;
      }
      case 'email-race-roundup': {
        const { GET } = await import('@/app/api/cron/[secret]/email-race-roundup/route');
        response = await GET(request, { params });
        break;
      }
      default:
        return { success: false, result: { error: `Unknown job: ${jobName}` } };
    }

    const result = await response.json();
    return { success: response.ok, result };
  } catch (error) {
    return {
      success: false,
      result: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}
