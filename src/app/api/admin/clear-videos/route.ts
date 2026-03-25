import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { db, youtubeVideos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await db.delete(youtubeVideos);
    return NextResponse.json({ success: true, message: 'All videos deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete videos' },
      { status: 500 }
    );
  }
}
