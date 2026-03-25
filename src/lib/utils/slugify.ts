export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateNewsSlug(title: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  const titleSlug = slugify(title).slice(0, 50);
  return `${dateStr}-${titleSlug}`;
}
