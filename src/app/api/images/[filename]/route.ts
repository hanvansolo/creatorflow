import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Storage path - Railway volume or local fallback
const STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || 'public/images/articles';

function getStorageDir(): string {
  if (process.env.IMAGE_STORAGE_PATH) {
    return process.env.IMAGE_STORAGE_PATH;
  }
  return path.join(process.cwd(), STORAGE_PATH);
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(getStorageDir(), sanitizedFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = await fs.readFile(filePath);
    let contentType = getContentType(sanitizedFilename);

    // Twitter/social crawlers don't support WebP - serve as JPEG instead
    // WebP files are still valid when served as image/jpeg for most consumers
    if (contentType === 'image/webp') {
      contentType = 'image/jpeg';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
