import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { db, siteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SCRIPT_KEYS = [
  { key: 'script_head', description: 'Scripts injected into <head> (analytics, meta tags)' },
  { key: 'script_body_start', description: 'Scripts injected at the start of <body> (GTM noscript)' },
  { key: 'script_body_end', description: 'Scripts injected before </body> (chat widgets, tracking)' },
] as const;

async function requireAdmin() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return null;
  }
  return session;
}

/**
 * GET /api/admin/scripts
 * Returns all script settings
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.select().from(siteSettings);
  const settingsMap = new Map(settings.map(s => [s.key, s]));

  const scripts = SCRIPT_KEYS.map(def => {
    const dbSetting = settingsMap.get(def.key);
    return {
      key: def.key,
      description: def.description,
      value: dbSetting?.value || '',
      updatedAt: dbSetting?.updatedAt ?? null,
    };
  });

  return NextResponse.json({ scripts });
}

/**
 * PUT /api/admin/scripts
 * Update script content
 * Body: { key: string, value: string }
 */
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || !SCRIPT_KEYS.some(s => s.key === key)) {
    return NextResponse.json({ error: 'Invalid script key' }, { status: 400 });
  }

  const description = SCRIPT_KEYS.find(s => s.key === key)?.description || '';

  await db
    .insert(siteSettings)
    .values({
      key,
      value: value || '',
      description,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: value || '',
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true, key, value });
}
