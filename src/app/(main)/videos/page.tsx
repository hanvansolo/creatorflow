import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, Clock, Eye, ArrowRight } from 'lucide-react';
import { db, youtubeVideos } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

// Low priority channels that shouldn't appear in hero/featured sections
const LOW_PRIORITY_CHANNELS = ['Driver61'];

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Videos - Match Highlights, Analysis & Goals',
  'Watch the latest football videos including match highlights, tactical analysis, goal compilations, and exclusive content from top football YouTube channels.',
  '/videos',
  ['football videos', 'match highlights', 'goal highlights', 'football analysis videos', 'soccer videos', 'football YouTube']
);

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

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Video card component for reuse
type VideoType = typeof youtubeVideos.$inferSelect;

function VideoCard({ video, showChannel = true }: { video: VideoType; showChannel?: boolean }) {
  return (
    <Link
      href={`/videos/${video.videoId}`}
      className="group block"
    >
      <div className="rounded-lg overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-emerald-500/50 transition-all">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <PlayCircle className="h-12 w-12 text-zinc-600" />
            </div>
          )}
          {/* Duration badge */}
          {video.durationSeconds && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
              {formatDuration(video.durationSeconds)}
            </div>
          )}
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-3">
          {/* Title */}
          <h3 className="font-medium text-sm text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {video.title}
          </h3>

          {/* Description */}
          {video.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              {video.description}
            </p>
          )}

          {/* Channel */}
          {showChannel && (
            <p className="text-xs text-zinc-400 mt-1.5">
              {video.channelName}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
            <span>{formatViews(video.viewCount)} views</span>
            <span>•</span>
            <span>{getRelativeTime(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function VideosPage() {
  // Get all videos, sorted by featured status then date
  const featuredVideos = await db
    .select()
    .from(youtubeVideos)
    .orderBy(desc(youtubeVideos.isFeatured), desc(youtubeVideos.publishedAt))
    .limit(80);

  // Filter out low priority channels for hero/featured sections
  const priorityVideos = featuredVideos.filter(
    v => !LOW_PRIORITY_CHANNELS.includes(v.channelName)
  );

  const heroVideo = priorityVideos[0] ?? null;
  const sideGridVideos = priorityVideos.slice(1, 5);

  // For latest videos, include all but sort featured first
  const latestVideos = featuredVideos.slice(5);

  // Group remaining videos by channel
  const channelGroups = latestVideos.reduce((acc, video) => {
    if (!acc[video.channelName]) {
      acc[video.channelName] = [];
    }
    acc[video.channelName].push(video);
    return acc;
  }, {} as Record<string, typeof latestVideos>);

  // Filter out low priority channels from dedicated sections
  const channels = Object.entries(channelGroups)
    .filter(([channelName]) => !LOW_PRIORITY_CHANNELS.includes(channelName))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Football Videos</h1>
        {featuredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <PlayCircle className="h-16 w-16 text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-lg">No videos available yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Check back later for the latest F1 content
            </p>
          </div>
        ) : (
          <>
            {/* Featured Section: Hero + Side Grid (like home page) */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Hero Video - Left Side (3/5 width) */}
              <div className="lg:col-span-3">
                {heroVideo && (
                  <Link
                    href={`/videos/${heroVideo.videoId}`}
                    className="block group"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-zinc-800">
                      <div className="relative aspect-[16/10]">
                        {heroVideo.thumbnailUrl ? (
                          <Image
                            src={heroVideo.thumbnailUrl.replace('hqdefault', 'maxresdefault')}
                            alt={heroVideo.title}
                            fill
                            className="object-cover"
                            priority
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                            <PlayCircle className="h-24 w-24 text-zinc-600" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-600/90 flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all">
                            <PlayCircle className="h-8 w-8 text-white" />
                          </div>
                        </div>

                        {/* Duration badge */}
                        {heroVideo.durationSeconds && (
                          <div className="absolute top-4 right-4 px-2 py-1 bg-black/80 rounded text-sm text-white font-medium">
                            {formatDuration(heroVideo.durationSeconds)}
                          </div>
                        )}

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                              {heroVideo.channelName.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{heroVideo.channelName}</span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-400">{getRelativeTime(heroVideo.publishedAt)}</span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {heroVideo.title}
                          </h2>
                          <div className="flex items-center gap-3 mt-2 text-sm text-zinc-300">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {formatViews(heroVideo.viewCount)} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Side Grid - Right Side (2/5 width) */}
              <div className="lg:col-span-2">
                {sideGridVideos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 h-full">
                    {sideGridVideos.map((video) => (
                      <Link
                        key={video.id}
                        href={`/videos/${video.videoId}`}
                        className="group block h-full"
                      >
                        <div className="relative rounded-lg overflow-hidden bg-zinc-800 h-full min-h-[140px]">
                          {video.thumbnailUrl ? (
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                              <PlayCircle className="h-8 w-8 text-zinc-600" />
                            </div>
                          )}
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                          {/* Duration */}
                          {video.durationSeconds && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
                              {formatDuration(video.durationSeconds)}
                            </div>
                          )}

                          {/* Play overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-2.5">
                            <p className="text-[10px] text-zinc-400 mb-0.5">{video.channelName}</p>
                            <h3 className="text-xs font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                              {video.title}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Latest Videos Section */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Latest Videos</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestVideos.slice(0, 8).map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>

            {/* Videos by Channel */}
            {channels.map(([channelName, channelVideos]) => (
              <section key={channelName} className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                      {channelName.charAt(0)}
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{channelName}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {channelVideos.slice(0, 4).map((video) => (
                    <VideoCard key={video.id} video={video} showChannel={false} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
