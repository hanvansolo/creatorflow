// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'Stubbed - weather sync not yet migrated', updated: 0 });
}
