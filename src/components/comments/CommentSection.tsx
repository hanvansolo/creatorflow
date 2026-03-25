'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Reply, Trash2, Clock, Shield, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: string;
  body: string;
  likes: number;
  status: string;
  parentId: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string | null;
  replies: Comment[];
}

interface CommentSectionProps {
  contentType: 'article' | 'video' | 'prediction';
  contentId: string;
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function getDisplayName(name: string | null, email: string): string {
  return name || email.split('@')[0];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  currentUserId,
  isAdmin,
  depth = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  currentUserId: string | null;
  isAdmin: boolean;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const isOwner = currentUserId === comment.userId;
  const isMod = comment.userRole === 'admin' || comment.userRole === 'superadmin';
  const replies = comment.replies || [];

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-zinc-800' : ''}`}>
      <div className="py-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isMod ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'
          }`}>
            {getInitials(comment.userName, comment.userEmail)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {getDisplayName(comment.userName, comment.userEmail)}
              </span>
              {isMod && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Shield className="h-3 w-3" /> MOD
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Body */}
            <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap break-words">
              {comment.body}
            </p>

            {/* Actions */}
            <div className="mt-2 flex items-center gap-3">
              {currentUserId && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-1 ml-11"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function CommentSection({ contentType, contentId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?type=${contentType}&id=${encodeURIComponent(contentId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setTotal(data.total);
      }
    } catch (e) {
      // Silently fail
    }
  }, [contentType, contentId]);

  useEffect(() => {
    fetchComments();

    // Check auth status
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const user = data?.user;
        if (user?.userId) {
          setIsLoggedIn(true);
          setCurrentUserId(user.userId);
          setIsAdmin(user.role === 'admin' || user.role === 'superadmin');
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          text: text.trim(),
          parentId: replyTo,
        }),
      });

      if (res.ok) {
        setText('');
        setReplyTo(null);
        setError(null);
        await fetchComments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to post comment');
      }
    } catch (e) {
      setError('Something went wrong');
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return;

    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchComments();
  }

  return (
    <div className="mt-8">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
        <MessageSquare className="h-5 w-5" />
        Comments {total > 0 && <span className="text-sm font-normal text-zinc-500">({total})</span>}
      </h3>

      {/* Comment form */}
      {isLoggedIn === false ? (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 text-center">
          <p className="text-sm text-zinc-400 mb-3">Log in to join the discussion</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Link>
        </div>
      ) : isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
              <Reply className="h-3 w-3" />
              Replying to a comment
              <button onClick={() => setReplyTo(null)} className="text-emerald-400 hover:text-emerald-300">Cancel</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
              maxLength={2000}
              rows={2}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-y"
            />
            <button
              type="submit"
              disabled={!text.trim() || isSubmitting}
              className="self-end shrink-0 rounded-lg bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-emerald-400">{error}</p>
          )}
        </form>
      ) : null}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(parentId) => { setReplyTo(parentId); }}
              onDelete={handleDelete}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
