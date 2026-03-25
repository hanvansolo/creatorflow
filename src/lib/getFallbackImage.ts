// Specific driver last names for precise matching
const driverNames = [
  'verstappen', 'hadjar', 'leclerc', 'hamilton', 'russell', 'antonelli',
  'norris', 'piastri', 'alonso', 'stroll', 'gasly', 'colapinto',
  'albon', 'sainz', 'lawson', 'lindblad', 'hulkenberg', 'bortoleto',
  'ocon', 'bearman', 'perez', 'bottas', 'magnussen', 'zhou', 'tsunoda',
  'ricciardo', 'schumacher', 'vettel', 'raikkonen', 'rosberg'
];

// Specific team names for precise matching
const teamNames = [
  'red bull', 'ferrari', 'mercedes', 'mclaren', 'aston martin',
  'alpine', 'williams', 'racing bulls', 'audi', 'sauber', 'haas', 'cadillac'
];

// Extract SPECIFIC names from title (driver or team)
function extractSpecificNames(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  // Check for specific driver names
  for (const driver of driverNames) {
    if (lowerText.includes(driver)) {
      found.push(driver);
    }
  }

  // Check for specific team names
  for (const team of teamNames) {
    if (lowerText.includes(team)) {
      found.push(team);
    }
  }

  return found;
}

// Find an image from another article that covers THE SAME driver/team
export function findRelatedArticleImage(
  title: string,
  tags: string[] | null | undefined,
  articleImages: Array<{ title: string; tags: string[] | null; imageUrl: string }>
): string | null {
  const searchText = `${title} ${tags?.join(' ') || ''}`.toLowerCase();
  const specificNames = extractSpecificNames(searchText);

  // If no specific driver/team mentioned, don't use a fallback
  if (specificNames.length === 0) {
    return null;
  }

  // Find an article with the SAME specific driver/team
  for (const article of articleImages) {
    const articleText = `${article.title} ${article.tags?.join(' ') || ''}`.toLowerCase();
    const articleNames = extractSpecificNames(articleText);

    // Check if they share a specific name
    for (const name of specificNames) {
      if (articleNames.includes(name)) {
        return article.imageUrl;
      }
    }
  }

  // No related article found with same driver/team - don't use unrelated image
  return null;
}

// Get best image - uses original if available, otherwise finds RELATED article image
export function getRelatedImageSync(
  title: string,
  tags: string[] | null | undefined,
  originalImageUrl: string | null | undefined,
  _teamsData: Array<{ name: string; carImageUrl: string | null; logoUrl: string | null }>,
  _driversData: Array<{ firstName: string; lastName: string; headshotUrl: string | null }>,
  articleImages?: Array<{ title: string; tags: string[] | null; imageUrl: string }>
): string | null {
  // Use original article image if available
  if (originalImageUrl) {
    return originalImageUrl;
  }

  // Only fall back to related article image if we find a SPECIFIC match
  if (articleImages && articleImages.length > 0) {
    return findRelatedArticleImage(title, tags, articleImages);
  }

  return null;
}
