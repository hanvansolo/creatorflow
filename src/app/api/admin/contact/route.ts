import { NextRequest, NextResponse } from 'next/server';
import { db, contactMessages } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

async function checkAdmin() {
  const session = await getSession();
  return session && (session.role === 'admin' || session.role === 'superadmin');
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await request.json();
  if (!id || !['read', 'unread', 'replied'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  return NextResponse.json({ success: true });
}
