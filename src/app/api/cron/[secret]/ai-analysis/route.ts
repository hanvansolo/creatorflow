// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'Stubbed - AI analysis not yet migrated', analysed: 0 });
}
