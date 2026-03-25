import { NextRequest, NextResponse } from 'next/server';
import { db, youtubeVideos, aggregationJobs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { YOUTUBE_CHANNELS } from '@/lib/constants/channels';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max

const CRON_SECRET = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || 'dev-key';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}

async function fetchChannelVideos(channelId: string, maxResults = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) return [];

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('key', YOUTUBE_API_KEY);
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('order', 'date');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`Failed to fetch channel ${channelId}:`, await response.text());
    return [];
  }

  const data = await response.json();
  return data.items || [];
}

async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, YouTubeVideoDetails>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) return new Map();

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('key', YOUTUBE_API_KEY);
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('part', 'contentDetails,statistics');

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error('Failed to fetch video details:', await response.text());
    return new Map();
  }

  const data = await response.json();
  const map = new Map<string, YouTubeVideoDetails>();
  for (const item of data.items || []) {
    map.set(item.id, item);
  }
  return map;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    console.log('Starting YouTube video fetch via cron...');
    const startTime = Date.now();

    const [job] = await db.insert(aggregationJobs).values({
      jobType: 'youtube_fetch',
      status: 'running',
    }).returning();

    let insertedCount = 0;
    let updatedCount = 0;

    for (const channel of YOUTUBE_CHANNELS) {
      console.log(`Fetching videos from ${channel.name}...`);

      // Fetch fewer videos per channel since we have 25+ channels now
      const videos = await fetchChannelVideos(channel.channelId, 3);
      if (videos.length === 0) continue;

      const videoIds = videos.map(v => v.id.videoId);
      const details = await fetchVideoDetails(videoIds);

      for (const video of videos) {
        const videoId = video.id.videoId;
        const videoDetails = details.get(videoId);

        const [existing] = await db
          .select({ id: youtubeVideos.id })
          .from(youtubeVideos)
          .where(eq(youtubeVideos.videoId, videoId))
          .limit(1);

        const thumbnailUrl =
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.medium?.url ||
          video.snippet.thumbnails.default?.url ||
          null;

        const duration = videoDetails?.contentDetails?.duration
          ? parseDuration(videoDetails.contentDetails.duration)
          : null;

        const viewCount = videoDetails?.statistics?.viewCount
          ? parseInt(videoDetails.statistics.viewCount, 10)
          : 0;

        const likeCount = videoDetails?.statistics?.likeCount
          ? parseInt(videoDetails.statistics.likeCount, 10)
          : 0;

        if (existing) {
          await db
            .update(youtubeVideos)
            .set({
              viewCount,
              likeCount,
              fetchedAt: new Date(),
            })
            .where(eq(youtubeVideos.videoId, videoId));
          updatedCount++;
        } else {
          try {
            await db.insert(youtubeVideos).values({
              videoId,
              channelId: video.snippet.channelId,
              channelName: decodeHtmlEntities(video.snippet.channelTitle),
              title: decodeHtmlEntities(video.snippet.title),
              description: decodeHtmlEntities(video.snippet.description),
              thumbnailUrl,
              durationSeconds: duration,
              viewCount,
              likeCount,
              publishedAt: new Date(video.snippet.publishedAt),
              isFeatured: channel.priority === 1,
            });
            insertedCount++;
          } catch (error) {
            console.error('Failed to insert video:', error);
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    if (job) {
      await db
        .update(aggregationJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed: insertedCount,
          metadata: {
            updated: updatedCount,
            channels: YOUTUBE_CHANNELS.length,
            duration_ms: duration,
          },
        })
        .where(eq(aggregationJobs.id, job.id));
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      channels: YOUTUBE_CHANNELS.length,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('YouTube fetch failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
