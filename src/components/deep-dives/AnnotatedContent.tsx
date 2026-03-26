'use client';

import { TechnicalTermPopover } from './TechnicalTermPopover';


interface AnnotatedTerm {
  term: string;
  definition: string;
  category: string;
  deepDiveSlug?: string;
}

interface TermMatch {
  term: string;
  start: number;
  end: number;
  info: AnnotatedTerm;
}

interface AnnotatedContentProps {
  content: string;
  terms: TermMatch[];
  className?: string;
}

export function AnnotatedContent({ content, terms, className = '' }: AnnotatedContentProps) {
  if (terms.length === 0) {
    return <p className={className}>{content}</p>;
  }

  // Build the annotated content
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    // Add text before this term
    if (term.start > lastIndex) {
      elements.push(
        <span key={`text-${i}`}>{content.slice(lastIndex, term.start)}</span>
      );
    }

    // Add the annotated term
    elements.push(
      <TechnicalTermPopover
        key={`term-${i}`}
        term={term.info.term}
        definition={term.info.definition}
        deepDiveSlug={term.info.deepDiveSlug}
      >
        {term.term}
      </TechnicalTermPopover>
    );

    lastIndex = term.end;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    elements.push(
      <span key="text-end">{content.slice(lastIndex)}</span>
    );
  }

  return <p className={className}>{elements}</p>;
}

/**
 * Annotate multiple paragraphs of content
 */
interface AnnotatedParagraphsProps {
  paragraphs: string[];
  termsByParagraph: TermMatch[][];
  className?: string;
  paragraphClassName?: string;
  /** Insert an ad after every N paragraphs (0 = no ads) */
  adInterval?: number;
}

export function AnnotatedParagraphs({
  paragraphs,
  termsByParagraph,
  className = '',
  paragraphClassName = '',
  adInterval = 0,
}: AnnotatedParagraphsProps) {
  // Only show in-content ads if there are enough paragraphs
  const showAds = adInterval > 0 && paragraphs.length >= 6;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <div key={index}>
          <AnnotatedContent
            content={paragraph}
            terms={termsByParagraph[index] || []}
            className={paragraphClassName}
          />
        </div>
      ))}
    </div>
  );
}
