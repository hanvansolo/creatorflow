import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Eye, ThumbsUp, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { db, youtubeVideos } from '@/lib/db';
import { eq, desc, and, ne } from 'drizzle-orm';
import { generateVideoMetadata, generateAlternates, JsonLdScript, jsonLd } from '@/lib/seo';
import { CommentSection } from '@/components/comments/CommentSection';

export const revalidate = 3600; // Cache for 1 hour

interface VideoPageProps {
  params: Promise<{ videoId: string }>;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { videoId } = await params;
  const [video] = await db
    .select()
    .from(youtubeVideos)
    .where(eq(youtubeVideos.videoId, videoId))
    .limit(1);

  if (!video) {
    return { title: 'Video Not Found | Footy Feed' };
  }

  return {
    ...generateVideoMetadata({
      title: video.title,
      description: video.description?.slice(0, 160) || 'Watch this football video on Footy Feed',
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: video.thumbnailUrl || '',
      uploadDate: video.publishedAt.toISOString(),
      duration: video.durationSeconds ? `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S` : undefined,
      tags: video.tags || [],
    }),
    alternates: generateAlternates(`/videos/${videoId}`),
  };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(count: number | null): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoId } = await params;

  const [video] = await db
    .select()
    .from(youtubeVideos)
    .where(eq(youtubeVideos.videoId, videoId))
    .limit(1);

  if (!video) {
    notFound();
  }

  // Get related videos from same channel
  const relatedVideos = await db
    .select()
    .from(youtubeVideos)
    .where(
      and(
        eq(youtubeVideos.channelId, video.channelId),
        ne(youtubeVideos.videoId, videoId)
      )
    )
    .orderBy(desc(youtubeVideos.publishedAt))
    .limit(6);

  // Get more videos from other channels
  const moreVideos = await db
    .select()
    .from(youtubeVideos)
    .where(ne(youtubeVideos.channelId, video.channelId))
    .orderBy(desc(youtubeVideos.publishedAt))
    .limit(6);

  // VideoObject structured data for rich search results
  const videoSchema = jsonLd({
    '@type': 'VideoObject' as const,
    name: video.title,
    description: video.description?.slice(0, 300) || video.title,
    thumbnailUrl: video.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    uploadDate: video.publishedAt.toISOString(),
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    ...(video.durationSeconds ? { duration: `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S` } : {}),
    ...(video.viewCount ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: video.viewCount } } : {}),
    publisher: {
      '@type': 'Organization',
      name: video.channelName,
      url: `https://www.youtube.com/channel/${video.channelId}`,
    },
  });

  return (
    <>
    <JsonLdScript data={videoSchema} />
    <div className="min-h-screen">
      {/* Back button */}
      <div className="border-b border-zinc-700 bg-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Videos
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {video.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {formatViews(video.viewCount)} views
                </span>
                {video.likeCount && video.likeCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    {formatViews(video.likeCount)} likes
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(video.publishedAt)}
                </span>
                {video.durationSeconds && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}
              </div>

              {/* Channel info */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    {video.channelName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{video.channelName}</p>
                    <p className="text-xs text-zinc-400">YouTube Channel</p>
                  </div>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Watch on YouTube
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {video.tags.slice(0, 10).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              {video.description && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-white mb-2">Description</h3>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {video.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              <CommentSection contentType="video" contentId={videoId} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* More from this channel */}
            {relatedVideos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  More from {video.channelName}
                </h3>
                <div className="space-y-3">
                  {relatedVideos.map((relVideo) => (
                    <Link
                      key={relVideo.id}
                      href={`/videos/${relVideo.videoId}`}
                      className="flex gap-3 group"
                    >
                      <div className="relative w-40 flex-shrink-0 aspect-video bg-zinc-800 rounded overflow-hidden">
                        {relVideo.thumbnailUrl ? (
                          <Image
                            src={relVideo.thumbnailUrl}
                            alt={relVideo.title}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                        {relVideo.durationSeconds && (
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                            {formatDuration(relVideo.durationSeconds)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {relVideo.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          {formatViews(relVideo.viewCount)} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More videos */}
            {moreVideos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  More Videos
                </h3>
                <div className="space-y-3">
                  {moreVideos.map((moreVideo) => (
                    <Link
                      key={moreVideo.id}
                      href={`/videos/${moreVideo.videoId}`}
                      className="flex gap-3 group"
                    >
                      <div className="relative w-40 flex-shrink-0 aspect-video bg-zinc-800 rounded overflow-hidden">
                        {moreVideo.thumbnailUrl ? (
                          <Image
                            src={moreVideo.thumbnailUrl}
                            alt={moreVideo.title}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                        {moreVideo.durationSeconds && (
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                            {formatDuration(moreVideo.durationSeconds)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {moreVideo.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          {moreVideo.channelName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatViews(moreVideo.viewCount)} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}
