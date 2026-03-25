// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: 'Feature not yet available' }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ error: 'Feature not yet available' }, { status: 501 });
}
