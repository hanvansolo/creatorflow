export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a slug to at most `max` chars without cutting mid-word.
 * If there's a hyphen past the halfway mark of the truncated string we cut
 * there (clean word boundary). Otherwise we keep the whole `max` slice.
 * Either way, strip any trailing hyphens so we never produce "foo-bar-".
 */
function truncateAtWordBoundary(slug: string, max: number): string {
  if (slug.length <= max) return slug.replace(/-+$/, '');
  const cut = slug.slice(0, max);
  const lastHyphen = cut.lastIndexOf('-');
  const trimmed = lastHyphen > max / 2 ? cut.slice(0, lastHyphen) : cut;
  return trimmed.replace(/-+$/, '');
}

export function generateNewsSlug(title: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  const titleSlug = truncateAtWordBoundary(slugify(title), 50);
  return `${dateStr}-${titleSlug}`;
}
