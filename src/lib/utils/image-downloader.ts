import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Use Railway volume if available, otherwise fall back to public folder for local dev
const STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || 'public/images/articles';
const IMAGE_BASE_URL = process.env.IMAGE_STORAGE_PATH ? '/api/images' : '/images/articles';

interface DownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

/**
 * Generate a unique filename based on the URL
 */
function generateFilename(url: string): string {
  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  const urlObj = new URL(url);
  const ext = path.extname(urlObj.pathname).toLowerCase() || '.jpg';
  // Clean extension (remove query params if any)
  const cleanExt = ext.split('?')[0];
  return `${hash}${cleanExt}`;
}

/**
 * Get the storage directory path
 */
function getStorageDir(): string {
  if (process.env.IMAGE_STORAGE_PATH) {
    return process.env.IMAGE_STORAGE_PATH;
  }
  return path.join(process.cwd(), STORAGE_PATH);
}

/**
 * Download an image from a URL and save it
 */
export async function downloadImage(imageUrl: string): Promise<DownloadResult> {
  if (!imageUrl) {
    return { success: false, error: 'No image URL provided' };
  }

  try {
    const filename = generateFilename(imageUrl);
    const storageDir = getStorageDir();
    const localPath = path.join(storageDir, filename);
    const publicPath = `${IMAGE_BASE_URL}/${filename}`;

    // Check if image already exists
    try {
      await fs.access(localPath);
      return { success: true, localPath: publicPath };
    } catch {
      // File doesn't exist, continue to download
    }

    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true });

    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(imageUrl).origin,
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return { success: false, error: `Invalid content type: ${contentType}` };
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(buffer));

    console.log(`Downloaded: ${imageUrl.slice(0, 60)}... -> ${filename}`);
    return { success: true, localPath: publicPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Download multiple images in parallel with concurrency limit
 */
export async function downloadImages(
  imageUrls: string[],
  concurrency = 5
): Promise<Map<string, DownloadResult>> {
  const results = new Map<string, DownloadResult>();
  const queue = [...imageUrls];

  async function processQueue() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) {
        const result = await downloadImage(url);
        results.set(url, result);
      }
    }
  }

  // Run workers in parallel
  const workers = Array(Math.min(concurrency, imageUrls.length))
    .fill(null)
    .map(() => processQueue());

  await Promise.all(workers);
  return results;
}
