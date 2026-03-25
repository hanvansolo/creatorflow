'use client';

interface SuggestedQuestionsProps {
  questions: string[];
}

export function SuggestedQuestions({ questions }: SuggestedQuestionsProps) {
  const handleClick = (question: string) => {
    // Dispatch custom event that WhatIfSearch listens for
    window.dispatchEvent(new CustomEvent('whatif-set-question', { detail: question }));
  };

  return (
    <div className="mt-6">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleClick(question)}
            className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
