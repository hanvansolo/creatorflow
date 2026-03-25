'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatIfSearchProps {
  className?: string;
  placeholder?: string;
  onSubmit?: (question: string) => void;
}

export function WhatIfSearch({ className, placeholder, onSubmit }: WhatIfSearchProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Listen for custom event from SuggestedQuestions
  useEffect(() => {
    const handleSetQuestion = (e: CustomEvent<string>) => {
      setQuestion(e.detail);
    };

    window.addEventListener('whatif-set-question', handleSetQuestion as EventListener);
    return () => {
      window.removeEventListener('whatif-set-question', handleSetQuestion as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process question');
      }

      if (onSubmit) {
        onSubmit(question);
      }

      // Navigate to the scenario page
      router.push(`/what-if/${data.scenario.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder || "What if Lewis Hamilton had stayed at Mercedes..."}
          disabled={isLoading}
          className={cn(
            'w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-4 pl-12 pr-14 text-white placeholder-zinc-500',
            'focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'flex h-10 w-10 items-center justify-center rounded-lg',
            'bg-purple-500 text-white transition-colors',
            'hover:bg-purple-600 disabled:bg-zinc-700 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-emerald-400">{error}</p>
      )}

      <p className="mt-2 text-xs text-zinc-500">
        Ask any football-related hypothetical question and our AI will analyze it
      </p>
    </form>
  );
}
