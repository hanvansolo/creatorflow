'use client';

import { useState, useEffect } from 'react';
import { UpvoteIcon, DownvoteIcon } from '@/components/icons';

interface VoteButtonsProps {
  articleId: string;
  initialScore: number;
  initialUserVote?: 1 | -1 | null;
  size?: 'sm' | 'md';
  layout?: 'vertical' | 'horizontal';
}

// Generate or retrieve visitor ID for anonymous voting
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('footyfeed_visitor_id');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('footyfeed_visitor_id', visitorId);
  }
  return visitorId;
}

export function VoteButtons({
  articleId,
  initialScore,
  initialUserVote = null,
  size = 'md',
  layout = 'vertical',
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');

  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  // Fetch user's vote on mount
  useEffect(() => {
    if (!visitorId) return;

    const fetchUserVote = async () => {
      try {
        const res = await fetch(`/api/votes?articleIds=${articleId}`, {
          headers: { 'x-visitor-id': visitorId },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.votes[articleId]) {
            setUserVote(data.votes[articleId]);
          }
        }
      } catch {
        // Silently fail
      }
    };

    // Only fetch if we don't already have the user's vote
    if (initialUserVote === null) {
      fetchUserVote();
    }
  }, [articleId, visitorId, initialUserVote]);

  const handleVote = async (voteType: 1 | -1) => {
    if (isLoading || !visitorId) return;

    // Determine new vote state
    const newVoteType = userVote === voteType ? 0 : voteType;

    // Optimistic update
    const previousScore = score;
    const previousVote = userVote;

    let optimisticDelta = 0;
    if (newVoteType === 0) {
      // Removing vote
      optimisticDelta = userVote ? -userVote : 0;
    } else if (userVote) {
      // Changing vote
      optimisticDelta = newVoteType - userVote;
    } else {
      // New vote
      optimisticDelta = newVoteType;
    }

    setScore(score + optimisticDelta);
    setUserVote(newVoteType === 0 ? null : newVoteType);
    setIsLoading(true);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': visitorId,
        },
        body: JSON.stringify({ articleId, voteType: newVoteType }),
      });

      if (!res.ok) {
        throw new Error('Vote failed');
      }

      const data = await res.json();
      setScore(data.newScore);
      setUserVote(data.userVote);
    } catch {
      // Revert optimistic update on error
      setScore(previousScore);
      setUserVote(previousVote);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;
  const buttonPadding = size === 'sm' ? 'p-2' : 'p-2';
  const scoreSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const isVertical = layout === 'vertical';

  return (
    <div
      className={`flex items-center ${isVertical ? 'flex-col' : 'flex-row gap-1'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Upvote button */}
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={`${buttonPadding} rounded transition-all ${
          userVote === 1
            ? 'text-green-500 hover:text-green-400 scale-110'
            : 'text-zinc-400 hover:text-green-500 dark:text-zinc-500 dark:hover:text-green-400'
        } disabled:opacity-50`}
        title="Upvote"
        aria-label="Upvote"
      >
        <UpvoteIcon size={iconSize} className={userVote === 1 ? 'opacity-100' : 'opacity-70'} />
      </button>

      {/* Score */}
      <span
        className={`${scoreSize} font-bold tabular-nums ${
          userVote === 1
            ? 'text-green-500'
            : userVote === -1
            ? 'text-emerald-500'
            : 'text-zinc-600 dark:text-zinc-400'
        } ${isVertical ? 'my-0.5' : 'min-w-[2ch] text-center'}`}
      >
        {score}
      </span>

      {/* Downvote button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={`${buttonPadding} rounded transition-all ${
          userVote === -1
            ? 'text-emerald-500 hover:text-emerald-400 scale-110'
            : 'text-zinc-400 hover:text-emerald-500 dark:text-zinc-500 dark:hover:text-emerald-400'
        } disabled:opacity-50`}
        title="Downvote"
        aria-label="Downvote"
      >
        <DownvoteIcon size={iconSize} className={userVote === -1 ? 'opacity-100' : 'opacity-70'} />
      </button>
    </div>
  );
}
